import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { UpdateOptions } from 'sequelize';
import {
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  Incident,
  ResolvedIncidentNote,
  User,
} from '@ontrack-tech-group/common/models';
import {
  Editor,
  IncidentStatusType,
  RESPONSES,
  ResolvedIncidentNoteStatusDb,
} from '@ontrack-tech-group/common/constants';
import {
  AnalyticCommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { isIncidentExist } from '@Modules/incident/helpers';
import { sendIncidentUpdate } from '@Modules/incident/helpers/sockets';
import { IncidentService } from '@Modules/incident/incident.service';
import {
  CreateResolvedIncidentNoteDto,
  UpdateResolvedIncidentNoteDto,
} from './dto';
import {
  getResolvedIncidentNoteByIdHelper,
  isResolvedIncidentNoteExist,
} from './helpers';

@Injectable()
export class ResolvedIncidentNoteService {
  constructor(
    private readonly analyticCommunicationService: AnalyticCommunicationService,
    private readonly incidentService: IncidentService,
    private readonly pusherService: PusherService,
    private readonly sequelize: Sequelize,
  ) {}

  async createResolvedIncidentNote(
    createResolvedIncidentNoteDto: CreateResolvedIncidentNoteDto,
    user: User,
  ) {
    const { event_id, incident_id, status } = createResolvedIncidentNoteDto;
    const [, divisionLockService] = await withCompanyScope(user, event_id);
    let createdResolvedIncidentNote: ResolvedIncidentNote;

    const incident = await isIncidentExist(incident_id, user, event_id);

    const transaction = await this.sequelize.transaction();

    if (await isResolvedIncidentNoteExist(event_id, incident_id))
      throw new ConflictException(
        RESPONSES.alreadyExist('Resolved Incident Note'),
      );
    try {
      createdResolvedIncidentNote = await ResolvedIncidentNote.create({
        ...createResolvedIncidentNoteDto,
        status: ResolvedIncidentNoteStatusDb[status.toUpperCase()],
        transaction,
      });

      if (createdResolvedIncidentNote) {
        await Incident.update({ status: IncidentStatusType.RESOLVED }, {
          where: { id: incident.id },
          individualHooks: true,
          hook_triggered: false,
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & { editor: Editor });
      }
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }

    const resolvedIncidentNote = await getResolvedIncidentNoteByIdHelper(
      createdResolvedIncidentNote.id,
      { useMaster: true },
    );

    const updatedIncident = await this.incidentService.getIncidentById(
      incident_id,
      event_id,
      user,
      null,
      { useMaster: true },
    );

    try {
      // This is for sending update to dashboard/analytics service
      this.analyticCommunicationService.analyticCommunication(
        {
          id: resolvedIncidentNote.id,
          is_new_resolved_note: true,
        },
        'resolved-incident-note',
        user,
      );

      sendIncidentUpdate(
        updatedIncident,
        event_id,
        false, // isNew flag
        this.pusherService,
        false, // isUpload flag
        divisionLockService,
      );
    } catch (e) {
      console.log(e);
    }

    return resolvedIncidentNote;
  }

  async getResolvedIncidentNoteById(id: number, user: User) {
    const resolvedIncidentNote = await getResolvedIncidentNoteByIdHelper(id);

    await withCompanyScope(user, resolvedIncidentNote.event_id);

    return resolvedIncidentNote;
  }

  async updateResolvedIncidentNote(
    id: number,
    updateResolvedIncidentNoteDto: UpdateResolvedIncidentNoteDto,
    user: User,
  ) {
    const { status } = updateResolvedIncidentNoteDto;

    // checking resolved note exist or not
    const resolvedIncidentNote = await isResolvedIncidentNoteExist(
      null,
      null,
      id,
    );
    if (!resolvedIncidentNote)
      throw new NotFoundException(RESPONSES.notFound('Resolved Incident Note'));

    // checking Company level permission
    await withCompanyScope(user, resolvedIncidentNote.event_id);

    await resolvedIncidentNote.update({
      ...updateResolvedIncidentNoteDto,
      status: status
        ? ResolvedIncidentNoteStatusDb[status.toUpperCase()]
        : resolvedIncidentNote.status,
    });

    const _resolvedIncidentNote = await getResolvedIncidentNoteByIdHelper(id, {
      useMaster: true,
    });

    try {
      // This is for sending update to dashboard/analytics service
      this.analyticCommunicationService.analyticCommunication(
        {
          id: _resolvedIncidentNote.id,
          is_new_resolved_note: false,
        },
        'resolved-incident-note',
        user,
      );
    } catch (e) {
      console.log(e);
    }

    return _resolvedIncidentNote;
  }

  async deleteResolvedIncidentNote(id: number, user: User) {
    const resolvedIncidentNote = await isResolvedIncidentNoteExist(
      null,
      null,
      id,
    );
    if (!resolvedIncidentNote)
      throw new NotFoundException(RESPONSES.notFound('Resolved Incident Note'));

    await withCompanyScope(user, resolvedIncidentNote.event_id);

    await resolvedIncidentNote.destroy();

    return {
      message: RESPONSES.destroyedSuccessfully('Resolved Incident Note'),
    };
  }
}
