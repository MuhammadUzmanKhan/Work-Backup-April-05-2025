import { Op } from 'sequelize';
import { Response } from 'express';
import { Sequelize } from 'sequelize-typescript';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  isEventExist,
  parseCsvForTypes,
  successInterceptorResponseFormat,
  uploadTypesCsvHeaderNames,
  withCompanyScope,
  checkIfNameAlreadyExistModel,
} from '@ontrack-tech-group/common/helpers';
import {
  Event,
  EventSource,
  Incident,
  Source,
  User,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  Options,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { SocketTypes, _ERRORS, _MESSAGES } from '@Common/constants';
import { CloneDto } from '@Common/dto';
import { PusherService } from '@ontrack-tech-group/common/services';
import { IncidentService } from '@Modules/incident/incident.service';
import {
  UpdateSourceDto,
  CreateSourceDto,
  SourceQueryParamsDto,
  AssignOrRemoveToEventDto,
  UploadSourcesForEventDto,
  DestroyMultipleSourcesDto,
} from './dto';
import {
  getFilteredSourcesForCsv,
  getSourceWhereQuery,
  isSourceExist,
  isSourcesExist,
  sendUpdatedSource,
} from './helpers';

@Injectable()
export class SourceService {
  constructor(
    private readonly httpService: HttpService,
    private sequelize: Sequelize,
    private pusherService: PusherService,
    @Inject(forwardRef(() => IncidentService))
    private readonly incidentService: IncidentService,
  ) {}

  async createSource(createSourceDto: CreateSourceDto, user: User) {
    const { name, event_id } = createSourceDto;
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfNameAlreadyExistModel(Source, 'Source', name, company_id);

    const createdSource = await Source.create({
      name,
      company_id,
    });

    await EventSource.findOrCreate({
      where: {
        event_id,
        source_id: createdSource.id,
      },
      useMaster: true,
    });

    const createdIncidentSourceFormated = await this.getSourceById(
      createdSource.id,
      event_id,
      { useMaster: true },
    );

    const count = await this.incidentService.getIncidentModuleCounts(event_id, {
      useMaster: true,
    });

    sendUpdatedSource(
      { source: createdIncidentSourceFormated, count },
      event_id,
      'new',
      SocketTypes.SOURCE,
      true,
      this.pusherService,
    );

    return createdIncidentSourceFormated;
  }

  async uploadSourcesForEvents(
    uploadSourcesForEventDto: UploadSourcesForEventDto,
    user: User,
  ) {
    const { file, event_id } = uploadSourcesForEventDto;
    let sourcesToBeCreated = [];
    const transaction = await this.sequelize.transaction();

    const [company_id] = await withCompanyScope(user, event_id);

    const parsedFileData = await parseCsvForTypes(file, this.httpService);

    if (parsedFileData.length) {
      sourcesToBeCreated = await getFilteredSourcesForCsv(
        await uploadTypesCsvHeaderNames(parsedFileData),
        company_id,
      );
    }

    if (sourcesToBeCreated.length) {
      try {
        const createdSources = await Source.bulkCreate(
          [
            ...sourcesToBeCreated.map((source) => ({
              name: source.name,
              company_id,
            })),
          ],
          { transaction },
        );

        await Promise.all(
          createdSources.map((source) =>
            EventSource.findOrCreate({
              where: {
                event_id,
                source_id: source.id,
              },
              transaction,
            }),
          ),
        );

        await transaction.commit();
      } catch (error) {
        console.log(error);
        await transaction.rollback();

        throw new BadRequestException(_ERRORS.SOURCE_FILE_UPLOAD_ERROR);
      }
    } else if (!parsedFileData.length || !sourcesToBeCreated.length) {
      return { message: 'No New Records To Be Saved' };
    }

    const count = await this.incidentService.getIncidentModuleCounts(event_id);

    sendUpdatedSource(
      { message: `Saved Successfully`, count },
      event_id,
      'upload',
      SocketTypes.SOURCE,
      true,
      this.pusherService,
    );

    return { message: 'Saved Successfully' };
  }

  async manageSources(
    assignOrRemoveToEventDto: AssignOrRemoveToEventDto,
    user: User,
  ) {
    const eventSourcesWithError = [];
    const linkedSources = [];
    const unlinkedSources = [];
    const linkedSourcesData = [];
    const unlinkedSourcesData = [];
    const { event_id, source_ids } = assignOrRemoveToEventDto;

    if (!source_ids) throw new NotFoundException(ERRORS.SOURCES_NOT_FOUND);

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    if (source_ids?.length) {
      const sources = await Source.count({
        where: {
          company_id,
          id: { [Op.in]: source_ids },
        },
      });
      if (source_ids?.length !== sources)
        throw new NotFoundException(_ERRORS.SOME_OF_SOURCE_ARE_NOT_FOUND);
    }

    for (const source_id of source_ids) {
      const [eventSource, created] = await EventSource.findOrCreate({
        where: { event_id, source_id },
      });

      if (created) {
        const source = await Source.findOne({
          where: { id: eventSource.source_id },
          attributes: ['name'],
        });

        linkedSources.push(eventSource.source_id);

        const sourceData = source.get({ plain: true });

        linkedSourcesData.push({
          id: eventSource?.source_id,
          name: sourceData.name,
        });
      }
    }

    const eventSources = await EventSource.findAll({
      where: { event_id, source_id: { [Op.notIn]: source_ids } },
      include: [
        {
          model: Event,
          attributes: [],
        },
        {
          model: Source,
          attributes: ['id', 'name'],
        },
      ],
    });

    for (const eventSource of eventSources) {
      const incidentCount = await Incident.count({
        where: { event_id, source_id: eventSource.source_id },
      });

      if (incidentCount > 0) {
        eventSourcesWithError.push(eventSource.sources.name);
      } else {
        unlinkedSources.push(eventSource.source_id);

        unlinkedSourcesData.push({
          id: eventSource?.source_id,
          name: eventSource?.sources.name,
        });

        await eventSource.destroy();
      }
    }

    if (!eventSourcesWithError.length) {
      sendUpdatedSource(
        {
          linkedSources,
          unlinkedSources,
          message: _MESSAGES.SOURCE_ASSOCIATIONS_UPDATED_SUCCESSFULLY,
        },
        event_id,
        'manage',
        SocketTypes.SOURCE,
        false,
        this.pusherService,
      );

      sendUpdatedSource(
        {
          linkedSourcesData,
          unlinkedSourcesData,
          message: _MESSAGES.SOURCE_ASSOCIATIONS_UPDATED_SUCCESSFULLY,
        },
        event_id,
        'manage-data',
        SocketTypes.SOURCE,
        false,
        this.pusherService,
      );

      return { message: _MESSAGES.SOURCE_ASSOCIATIONS_UPDATED_SUCCESSFULLY };
    } else if (eventSourcesWithError.length > 0) {
      const sources = eventSourcesWithError.join(', ');
      const errorMessage =
        eventSourcesWithError.length > 1
          ? `Sources '${sources}' could not be removed. These are associated with incidents.`
          : `Source '${sources}' could not be removed. It is associated with incidents.`;

      sendUpdatedSource(
        {
          message: `Source${eventSourcesWithError.length > 1 ? 's' : ''}
             '${sources}' could not be removed. ${eventSourcesWithError.length > 1 ? 'These are' : 'It is'}
              associated with incidents.`,
          linkedSources: linkedSources || 0,
          unlinkedSources: unlinkedSources || 0,
        },
        event_id,
        'manage',
        SocketTypes.SOURCE,
        false,
        this.pusherService,
      );

      if (unlinkedSources && eventSourcesWithError) {
        return { errorMessage, statusCode: 402 };
      } else {
        throw new UnprocessableEntityException(errorMessage);
      }
    }
  }

  async getAllSources(
    sourceQueryParamsDto: SourceQueryParamsDto,
    user: User,
    res: Response,
  ) {
    const { event_id, is_assigned } = sourceQueryParamsDto;
    const [company_id] = await withCompanyScope(user, event_id);

    const sources = await Source.findAll({
      where: getSourceWhereQuery(sourceQueryParamsDto, company_id),
      attributes: [
        [Sequelize.cast(Sequelize.col('"Source"."id"'), 'integer'), 'id'],
        'name',
        'is_test',
        [
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM "event_sources"
            WHERE "event_sources"."source_id" = "Source"."id" 
            AND "event_sources"."event_id" = ${event_id}
          )`),
          'is_assigned',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT ("event_sources"."event_id")::INTEGER FROM "event_sources"
            WHERE "event_sources"."source_id" = "Source"."id" AND "event_sources"."event_id" <> ${event_id}
          )`),
          'event_count',
        ],
        [
          Sequelize.literal(`(SELECT COUNT(DISTINCT incidents.id)::INTEGER
           FROM incidents
           WHERE incidents.source_id = "Source"."id")`),
          'total_incident_count',
        ],
        [
          Sequelize.literal(`(SELECT COUNT(DISTINCT incidents.id)::INTEGER
           FROM incidents
           WHERE incidents.source_id = "Source"."id"
           AND incidents.event_id = ${event_id})`),
          'incident_count',
        ],
      ],
      include: [
        {
          model: EventSource,
          attributes: [],
          where: is_assigned ? { event_id } : {},
          required: !!is_assigned,
        },
      ],
      order: [
        [Sequelize.literal('is_assigned'), SortBy.DESC],
        [{ model: EventSource, as: 'event_sources' }, 'createdAt', SortBy.DESC],
      ],
    });

    const assigned_source_counts = await Source.count({
      where: { company_id },
      include: [
        {
          model: EventSource,
          where: { event_id },
        },
      ],
    });

    return res.send(
      successInterceptorResponseFormat({
        data: sources,
        counts: {
          count: sources?.length || 0,
          assigned_source_counts,
        },
      }),
    );
  }

  async getAllSourcesv1(
    sourceQueryParamsDto: SourceQueryParamsDto,
    user: User,
    res: Response,
  ) {
    const { event_id, is_assigned } = sourceQueryParamsDto;
    const [company_id] = await withCompanyScope(user, event_id);

    const sources = await Source.findAll({
      benchmark: true,
      logging: (...msg) =>
        console.log(`Sources Find All [V1] (Load Time): `, msg[1] + 'ms'),
      where: getSourceWhereQuery(sourceQueryParamsDto, company_id),
      attributes: [
        [Sequelize.literal(`"Source"."id"::integer`), 'id'],
        [Sequelize.literal(`"Source"."name"`), 'name'],
        [Sequelize.literal(`"Source"."is_test"`), 'is_test'],
        [
          Sequelize.literal(`
            CASE WHEN SUM(CASE WHEN event_sources.event_id = ${event_id} THEN 1 ELSE 0 END) > 0
            THEN true ELSE false END
          `),
          'is_assigned',
        ],
        [
          Sequelize.literal(`
            count(distinct case when event_sources.event_id != ${event_id} then event_sources.event_id end)::integer
          `),
          'event_count',
        ],
        [
          Sequelize.literal(`COUNT(DISTINCT incidents.id)::integer`),
          'total_incident_count',
        ],
        [
          Sequelize.literal(`
            COUNT(DISTINCT CASE WHEN incidents.event_id = ${event_id} THEN incidents.id END)::integer
          `),
          'incident_count',
        ],
      ],
      include: [
        {
          model: EventSource,
          attributes: [],
          where: is_assigned ? { event_id } : {},
          required: !!is_assigned,
        },
        {
          model: Incident,
          attributes: [],
          required: false,
        },
      ],
      group: [
        Sequelize.col(`"Source"."id"`),
        Sequelize.col(`"event_sources"."created_at"`),
      ],
      order: [
        [Sequelize.literal('is_assigned'), SortBy.DESC],
        [Sequelize.literal('name'), SortBy.ASC], // Use alias
      ],
    });

    return res.send(
      successInterceptorResponseFormat({
        data: sources,
        counts: {
          count: sources?.length,
          assigned_source_counts: sources.filter(
            (source) => !!source.toJSON()['is_assigned'] === true,
          ).length,
        },
      }),
    );
  }

  async getSourceById(id: number, event_id: number, options?: Options) {
    const source = await Source.findOne({
      where: { id },
      attributes: [
        'id',
        'name',
        'is_test',
        [
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM "event_sources"
            WHERE "event_sources"."source_id" = "Source"."id" 
            AND "event_sources"."event_id" = ${event_id}
          )`),
          'is_assigned',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT ("event_sources"."event_id")::INTEGER FROM "event_sources"
            WHERE "event_sources"."source_id" = "Source"."id" AND "event_sources"."event_id" <> ${event_id}
          )`),
          'event_count',
        ],
        [
          Sequelize.literal(`(
              SELECT COUNT(DISTINCT "incidents"."id")::INTEGER
              FROM "incidents"
              WHERE incidents.event_id = ${event_id}
              AND "incidents"."source_id" =  "Source"."id"
            )`),
          'incident_count',
        ],
      ],
      ...options,
    });
    if (!source) throw new NotFoundException(_ERRORS.SOURCE_NOT_FOUND);

    return source;
  }

  async updateSource(id: number, updateSourceDto: UpdateSourceDto, user: User) {
    const { event_id, name } = updateSourceDto;

    // checking Company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    // checking source exist or not
    const source = await isSourceExist(id);

    await checkIfNameAlreadyExistModel(
      Source,
      'Source',
      name,
      company_id,
      null,
      id,
    );

    await source.update({ name });

    const updatedSource = await this.getSourceById(id, event_id, {
      useMaster: true,
    });

    const count = await this.incidentService.getIncidentModuleCounts(event_id, {
      useMaster: true,
    });

    sendUpdatedSource(
      { source: updatedSource, count },
      event_id,
      'update',
      SocketTypes.SOURCE,
      false,
      this.pusherService,
    );

    return updatedSource;
  }

  async deleteSource(
    destroyMultipleSourcesDto: DestroyMultipleSourcesDto,
    user: User,
  ) {
    const { event_id, source_ids } = destroyMultipleSourcesDto;

    const [company_id] = await withCompanyScope(user, event_id);

    // checking sources exist or not
    await isSourcesExist(source_ids, company_id);

    // checking if this source is not linked with another event
    const linkedSources = (
      await Source.findAll({
        where: { id: { [Op.in]: source_ids } },
        attributes: ['id'],
        include: [{ model: Event, attributes: ['id'], required: true }],
      })
    ).map((source) => +source.id);

    const sourcesToBeDeleted = source_ids.filter(
      (id) => !linkedSources.includes(id),
    );

    if (sourcesToBeDeleted.length) {
      await Source.destroy({
        where: {
          id: {
            [Op.in]: sourcesToBeDeleted,
          },
        },
      });
    }

    if (!sourcesToBeDeleted.length) {
      sendUpdatedSource(
        {
          message:
            _ERRORS.SOURCE_HAS_BEEN_ALREADY_ASSOCIATED_TO_EVENTS_IT_CANT_BE_DESTROYED,
        },
        event_id,
        'delete',
        SocketTypes.SOURCE,
        false,
        this.pusherService,
      );

      throw new UnprocessableEntityException(
        _ERRORS.SOURCE_HAS_BEEN_ALREADY_ASSOCIATED_TO_EVENTS_IT_CANT_BE_DESTROYED,
      );
    } else if (!linkedSources.length) {
      const message = {
        message:
          sourcesToBeDeleted.length > 1
            ? RESPONSES.destroyedSuccessfully('Sources')
            : RESPONSES.destroyedSuccessfully('Source'),
      };

      const count = await this.incidentService.getIncidentModuleCounts(
        event_id,
        {
          useMaster: true,
        },
      );

      sendUpdatedSource(
        { message, count, deletedIds: sourcesToBeDeleted },
        event_id,
        'delete',
        SocketTypes.SOURCE,
        false,
        this.pusherService,
      );

      return message;
    } else if (sourcesToBeDeleted.length && linkedSources.length) {
      const message = `${
        sourcesToBeDeleted.length > 1
          ? RESPONSES.destroyedSuccessfully('Sources')
          : RESPONSES.destroyedSuccessfully('Source')
      } But ${
        _ERRORS.SOME_SOURCE_HAS_BEEN_ALREADY_ASSOCIATED_TO_EVENTS_IT_CANT_BE_DESTROYED
      }`;

      const count = await this.incidentService.getIncidentModuleCounts(
        event_id,
        { useMaster: true },
      );

      sendUpdatedSource(
        { message, count, deletedIds: sourcesToBeDeleted },
        event_id,
        'delete',
        SocketTypes.SOURCE,
        false,
        this.pusherService,
      );

      return { message, statusCode: 402 };
    }
  }

  async cloneEventSource(clone_sources: CloneDto) {
    const { clone_event_id, current_event_id } = clone_sources;

    await isEventExist(current_event_id);

    const event_sources = await EventSource.findAll({
      where: { event_id: clone_event_id },
      attributes: ['source_id'],
    });
    if (!event_sources.length)
      throw new NotFoundException(_ERRORS.NO_SOURCES_HAVE_BEEN_ASSOCIATED);

    const source_ids = event_sources.map(({ source_id }) => source_id);

    for (const source_id of source_ids) {
      await EventSource.findOrCreate({
        where: { event_id: current_event_id, source_id },
        useMaster: true,
      });
    }

    const count = await this.incidentService.getIncidentModuleCounts(
      current_event_id,
      { useMaster: true },
    );

    sendUpdatedSource(
      { message: 'Event Sources Cloned Successfully', count },
      current_event_id,
      'clone',
      SocketTypes.SOURCE,
      true,
      this.pusherService,
    );

    return { message: 'Event Sources Cloned Successfully' };
  }
}
