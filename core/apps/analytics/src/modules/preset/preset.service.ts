import { ConflictException, Injectable } from '@nestjs/common';

import { Preset, User } from '@ontrack-tech-group/common/models';
import {
  checkIfSingleRecordExist,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { MODULE_NAMES, RESPONSES } from '@ontrack-tech-group/common/constants';

import { CreatePresetDto } from './dto';
import { checkValidations, mapFiltersForDb } from './helper';

@Injectable()
export class PresetService {
  constructor() {}

  async createPreset(createPresetDto: CreatePresetDto, user: User) {
    const { event_id, filters, week_days, month_days, name } = createPresetDto;

    await withCompanyScope(user, event_id);

    const presetAlreadyExists = await checkIfSingleRecordExist(
      Preset,
      {
        module: MODULE_NAMES.ANALYTICS,
        name,
      },
      ['id'],
    );

    if (presetAlreadyExists)
      throw new ConflictException(RESPONSES.alreadyExist('Preset'));

    const {
      incidentDivisions,
      incidentTypes,
      eventRegions,
      companies,
      events,
    } = await checkValidations(filters);

    const filtersNumber = mapFiltersForDb(
      filters,
      incidentDivisions,
      incidentTypes,
      eventRegions,
      companies,
      events,
    );

    const preset = await Preset.create({
      ...createPresetDto,
      filters: filtersNumber,
      user_id: user.id,
      additional_fields: {
        day: week_days || month_days,
      },
      module: MODULE_NAMES.ANALYTICS,
    });

    return preset;
  }
}
