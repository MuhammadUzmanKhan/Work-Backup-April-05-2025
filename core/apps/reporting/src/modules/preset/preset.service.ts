import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import {
  Company,
  Event,
  Preset,
  User,
} from '@ontrack-tech-group/common/models';
import {
  isEventExist,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  ERRORS,
  MODULE_NAMES,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  CommunicationService,
  IncidentService,
} from '@ontrack-tech-group/common/services';
import { _ERRORS, ReportingFrequency } from '@Common/constants';
import { QueueService } from '@Modules/queues/queues.service';
import { CreatePresetDto, GetAllPresetDto, UpdatePresetDto } from './dto';
import {
  checkValidations,
  formatAndGenerateCsv,
  getAllPresetWhere,
  isPresetExist,
  mapFiltersForDb,
  mapFiltersForQueryParams,
  mapFiltersForResponse,
} from './helpers';
import { userRole } from './helpers/query';

@Injectable()
export class PresetService {
  constructor(
    private readonly incidentCommunicationService: IncidentService,
    private readonly communicationService: CommunicationService,
    private readonly queueService: QueueService,
  ) {}

  async createPreset(createPresetDto: CreatePresetDto, user: User) {
    const { event_id, filters } = createPresetDto;

    await withCompanyScope(user, event_id);

    const { incidentDivisions, incidentZones, incidentTypes } =
      await checkValidations(filters);

    const filtersNumber = mapFiltersForDb(
      filters,
      incidentDivisions,
      incidentTypes,
      incidentZones,
    );

    const preset = await Preset.create({
      ...createPresetDto,
      filters: filtersNumber,
      user_id: user.id,
    });

    const createdPreset = await this.getPresetById(preset.id, null);

    if (createdPreset.frequency) {
      const mappedFilters = mapFiltersForQueryParams(preset);

      this.queueService.schedulePreset(
        { ...createdPreset, filters: mappedFilters },
        user,
      );
    }

    return { ...createdPreset, event: undefined };
  }

  async sendEmail(id: number, user: User) {
    const preset = await isPresetExist(id);
    const { event, name, email, csv, pdf, event_id } = preset;
    let incidents = [];
    let csvData = null;
    let response = null;

    const [, , timezone] = await withCompanyScope(user, event_id);

    if (!csv && !pdf)
      throw new BadRequestException(
        _ERRORS.EMAIL_FOR_CSV_AND_PDF_BOTH_ARE_NOT_ALLOWED,
      );

    const queryFilters = mapFiltersForQueryParams(preset);

    try {
      incidents = await this.incidentCommunicationService.communicate(
        queryFilters,
        'get-incidents-by-filter',
        user,
      );
    } catch (error) {
      console.log('🚀 ~ PresetService ~ sendEmail ~ error:', error);
    }

    if (csv) {
      csvData = await formatAndGenerateCsv(incidents, timezone);
    }

    try {
      response = await this.communicationService.communication(
        {
          csvData,
          recipientEmails: email ? [email] : [user.email], // if it is not scheduled then use user's email
          pdfUrl: null,
          content: {
            event: event.name,
            company: event.company.name,
            preset: name,
            attachments: Number(csv) + Number(pdf),
          },
        },
        'send-reporting-email',
        user,
      );
    } catch (error) {
      console.log('🚀 ~ PresetService ~ sendEmail ~ error:', error);
    }

    if (response.message === ERRORS.SOMETHING_WENT_WRONG) {
      throwCatchError(response);
    }

    await Preset.update({ last_export_time: new Date() }, { where: { id } });

    return response;
  }

  async sendOrScheduleEmail(body: { eventId: number; isCompelete: boolean }) {
    const { eventId, isCompelete } = body;
    const { company_id } = await isEventExist(eventId);

    if (!isCompelete) return true;

    const emailNowPresets = [];
    const schedulePresets = [];

    // Filter all presets that are needs to be send email or needs to be scheduled
    const allPresets = await Preset.findAll({
      where: {
        event_id: eventId,
        frequency: { [Op.ne]: null },
        module: MODULE_NAMES.REPORTING,
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'is_pinned', 'last_export_time'],
        include: [[userRole(company_id), 'user_role']],
      },
      include: [
        {
          model: Event,
          attributes: ['name', 'time_zone'],
          include: [{ model: Company, attributes: ['name'] }],
        },
      ],
    });

    allPresets.forEach((preset) => {
      preset = preset.toJSON();
      const { csv, pdf, disabled, user_id, buffer } = preset;

      // both csv and pdf flag are false or preset is disabled then we will just skip that preset
      if (!((!csv && !pdf) || disabled)) {
        const filters = mapFiltersForQueryParams(preset);

        const finalPreset = {
          ...preset,
          filters,
          user: { id: user_id, role: preset['user_role'] },
        };

        // if we have buffer then we need to schedule else we will send email instantly
        !buffer
          ? emailNowPresets.push(finalPreset)
          : schedulePresets.push(finalPreset);
      }
    });

    // we will add these array as data in a job and will send email or schedule emails through background job
    await this.queueService.sendEmailOrSchedule(
      emailNowPresets,
      schedulePresets,
    );

    return { message: 'Success' };
  }

  async getAllPresets(getAllPresetDto: GetAllPresetDto, user: User) {
    const { event_id, order } = getAllPresetDto;
    await withCompanyScope(user, event_id);

    const presets = await Preset.findAll({
      where: getAllPresetWhere(getAllPresetDto, user.id),
      attributes: { exclude: ['updatedAt'] },
      order: [
        ['is_pinned', SortBy.DESC],
        ['name', order || SortBy.ASC],
      ],
    });

    return presets.map((preset) => mapFiltersForResponse(preset));
  }

  async getAllPresetNames(event_id: number, user: User) {
    await withCompanyScope(user, event_id);

    const presets = await Preset.findAll({
      where: { user_id: user.id, event_id, module: MODULE_NAMES.REPORTING },
      attributes: ['id', 'name'],
      order: [
        ['is_pinned', SortBy.DESC],
        ['name', SortBy.ASC],
      ],
    });

    return presets;
  }

  async getPresetById(
    id: number,
    event_id: number,
    user?: User,
    emailSchedule = false,
  ) {
    const preset = await Preset.findByPk(id, {
      attributes: { exclude: ['updatedAt'] },
      useMaster: true,
      include: [
        {
          model: Event,
          attributes: [
            'name',
            'public_start_date',
            'public_end_date',
            'time_zone',
          ],
          ...(event_id && {
            where: { id: event_id },
          }),
          include: [{ model: Company, attributes: ['name'] }],
        },
      ],
    });

    if (!preset) throw new NotFoundException(RESPONSES.notFound('Preset'));

    if (user) {
      await withCompanyScope(user, preset.event_id);
    }

    return emailSchedule ? preset.toJSON() : mapFiltersForResponse(preset);
  }

  async pinPreset(id: number, user: User) {
    const preset = await isPresetExist(id);

    await withCompanyScope(user, preset.event_id);

    await preset.update({ is_pinned: !preset.is_pinned });

    return { success: true };
  }

  async updatePreset(id: number, updatePresetDto: UpdatePresetDto, user: User) {
    const { filters, frequency, event_id } = updatePresetDto;
    let incidentDivisions = null;
    let incidentZones = null;
    let incidentTypes = null;
    let filtersNumber = null;

    await withCompanyScope(user, event_id);

    const preset = await isPresetExist(id);

    if (event_id !== preset?.event_id)
      throw new NotAcceptableException(
        _ERRORS.PRESET_IS_NOT_PART_OF_PASSED_EVENT_ID,
      );

    if (filters) {
      ({ incidentDivisions, incidentZones, incidentTypes } =
        await checkValidations(filters));

      filtersNumber = mapFiltersForDb(
        filters,
        incidentDivisions,
        incidentTypes,
        incidentZones,
      );

      updatePresetDto['filters'] = filtersNumber;
    }

    if (frequency === ReportingFrequency.EVENT_COMPLETION) {
      updatePresetDto['export_time'] = null;
    } else if (frequency) {
      updatePresetDto['buffer'] = null;
    }

    await preset.update(updatePresetDto);

    const updatedPreset = await this.getPresetById(preset.id, null, null, true);
    const mappedFilters = mapFiltersForQueryParams(updatedPreset);

    this.queueService.schedulePreset(
      { ...updatedPreset, filters: mappedFilters },
      user,
    );

    return { ...updatedPreset, event: undefined };
  }

  async deletePreset(id: number, user: User) {
    const preset = await isPresetExist(id);

    await withCompanyScope(user, preset.event_id);

    await preset.destroy();

    await this.queueService.clearExistingJobs(preset.id);

    return { message: RESPONSES.destroyedSuccessfully('Preset') };
  }
}
