import { Request, Response } from 'express';
import { CreateOptions, Op, UpdateOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  Alert,
  Company,
  Department,
  Event,
  EventContact,
  EventIncidentType,
  EventUser,
  Incident,
  IncidentDivision,
  IncidentType,
  IncidentTypeTranslation,
  ResolvedIncidentNote,
  Scan,
  User,
  UserCompanyRole,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  SortBy,
  MESSAGES,
  PolymorphicType,
  IncidentPriorityApi,
  RESPONSES,
  AlertableType,
  TemplateNames,
  Options,
  isOntrackRole,
  PriorityGuideFilter,
  Editor,
} from '@ontrack-tech-group/common/constants';
import {
  isCompanyExist,
  parseCsvForTypes,
  successInterceptorResponseFormat,
  uploadTypesCsvHeaderNames,
  withCompanyScope,
  isEventExist,
  calculatePagination,
  getPageAndPageSize,
  getEventForPdfs,
  userRoleInclude,
  checkIfNameAlreadyExistModel,
  checkIfAllIdsExist,
  getQueryListParam,
  throwCatchError,
  checkIfRecordsExist,
  checkIfSingleRecordExist,
} from '@ontrack-tech-group/common/helpers';
import {
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { SocketTypes, _ERRORS, _MESSAGES } from '@Common/constants';
import { IncidentTypeDefaultPriority } from '@Common/constants/interfaces';
import { CloneDto } from '@Common/dto';
import { IncidentService } from '@Modules/incident/incident.service';
import { getStatusNameByKeyInclude } from '@Modules/incident/helpers/queries';
import {
  CreateIncidentTypeDto,
  DestroyMultipleIncidentTypesDto,
  GetIncidentTypeNamesDto,
  IncidentTypeQueryParamsDto,
  TypeAssocitateOrDisassociateToEventDto,
  UpdateIncidentTypeDto,
  UploadIncidentTypesDto,
  GetAlertIncidentTypesDto,
  GetIncidentTypeUsersDto,
  GetIncidentTypeIncidentsDto,
  RequestIncidentTypeDto,
} from './dto';
import {
  convertCountArrayToPriorityCount,
  eventContactAttributes,
  eventsCountSubquery,
  generateCsvOrPdfForIncidentTypesInReport,
  getAllIncidentTypeCountWhere,
  getAllIncidentTypeWhere,
  getFilteredTypesForCsv,
  getIncidentAlphabeticallyForSocket,
  incidentTypeAlertCountSubQuery,
  incidentsCountSubquery,
  updateIncidentTypeData,
  userAttributes,
  aphabeticalGroupData,
  getIncidentTypeWithResolvedTime,
  getIncidentTypeAlertWhere,
  getIncidentAlertWhere,
  getUserWhereQuery,
  UsersAttributes,
  EventContactAttributes,
  sendIncidentTypesAssociationsUpdate,
  getResolvedTime,
  sendUpdatedIncidentTypes,
  getIncidentTypeIncidentsWhere,
  getUserCompanyIncludeForAlerts,
  createIncidentTypesThroughCSV,
  getAssignedAlertSubquery,
} from './helpers';
import { getIncidentTypesAlphabetically } from './queries';

@Injectable()
export class IncidentTypeService {
  constructor(
    private readonly httpService: HttpService,
    private sequelize: Sequelize,
    private readonly pusherService: PusherService,
    @Inject(forwardRef(() => IncidentService))
    private readonly incidentService: IncidentService,
    private readonly communicationService: CommunicationService,
  ) {}
  async createIncidentType(
    createIncidentTypeDto: CreateIncidentTypeDto,
    user: User,
  ) {
    const { incident_type_id, event_id, default_priority, name } =
      createIncidentTypeDto;
    let _default_priority: any = default_priority;
    let incidentType = null;

    if (default_priority === IncidentPriorityApi.MEDIUM) {
      _default_priority = 'normal';
    }

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfNameAlreadyExistModel(
      IncidentType,
      'Incident Type',
      name,
      company_id,
    );

    const company: Company = (
      await checkIfRecordsExist(Company, { id: company_id }, [
        'default_lang',
        'parent_id',
      ])
    )[0] as unknown as Company;

    const transaction = await this.sequelize.transaction();

    try {
      if (incident_type_id) {
        incidentType = await IncidentType.findByPk(incident_type_id);
      } else {
        // Every incident type must have a translations
        // No Sub incident type can be created without a core incident type
        // So if sub incident type to create first create a core of it and than sub
        let coreIncidentType: IncidentType = null;

        if (company.parent_id) {
          // if this is a sub company so we must link it with a core incident type
          // find a core incident type if already exists
          coreIncidentType = await IncidentType.findOne({
            where: {
              company_id: company.parent_id,
              name: createIncidentTypeDto.name,
              parent_id: null,
            },
          });

          if (!coreIncidentType) {
            // if core incident type is not already there create a new one
            // because we are creating core we should give it main company language
            const parentCompany = await isCompanyExist(company.parent_id);

            coreIncidentType = await IncidentType.create(
              {
                ...createIncidentTypeDto,
                default_priority: _default_priority,
                company_id: company.parent_id,
                incident_type_translations: {
                  language: parentCompany.default_lang,
                  translation: createIncidentTypeDto.name,
                },
              },
              {
                include: [{ association: 'incident_type_translations' }],
                transaction,
              },
            );
          }
        }

        // creating incident type make sure it has parent id if from sub company
        incidentType = await IncidentType.create(
          {
            ...createIncidentTypeDto,
            default_priority: _default_priority,
            company_id,
            ...(coreIncidentType && { parent_id: coreIncidentType.id }),
            incident_type_translations: {
              language: company.default_lang,
              translation: createIncidentTypeDto.name,
            },
          },
          {
            include: [{ association: 'incident_type_translations' }],
            transaction,
            editor: { editor_id: user.id, editor_name: user.name },
            company_id,
          } as CreateOptions & { editor: Editor; company_id: number },
        );

        await transaction.commit();
      }

      if (incidentType) {
        await EventIncidentType.findOrCreate({
          where: {
            incident_type_id: incidentType.id,
            event_id,
          },
          useMaster: true,
        });

        const createdIncidentType = await this.getIncidentTypeById(
          incidentType.id,
          event_id,
          user,
          { useMaster: true },
        );

        const count = await this.incidentService.getIncidentModuleCounts(
          event_id,
          { useMaster: true },
        );

        sendUpdatedIncidentTypes(
          { incidentType: createdIncidentType, count },
          event_id,
          'new',
          SocketTypes.INCIDENT_TYPE,
          true,
          this.pusherService,
        );

        return createdIncidentType;
      }
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }
  }

  async requestIncidentType(
    requestIncidentTypeDto: RequestIncidentTypeDto,
    user: User,
  ) {
    const { event_id, default_priority, name } = requestIncidentTypeDto;

    const event = await isEventExist(event_id);
    const _event = event.get({ plain: true });

    await checkIfNameAlreadyExistModel(
      IncidentType,
      'Incident Type',
      name,
      event.company_id,
    );

    const emailData = {
      name,
      default_priority,
      requesteeName: user.name,
      email: [user.email],
      eventName: _event.name,
      companyName: _event.company_name,
    };

    try {
      await this.communicationService.communication(
        {
          data: emailData,
          template: TemplateNames.REQUEST_INCIDENT_TYPE,
          subject: 'Incident Type Request',
        },
        'send-email',
      );
    } catch (err) {
      console.log('🚀 ~ IncidentTypeService ~ err:', err);
    }

    return { message: 'Email Has Been Sent to Admin' };
  }

  async manageIncidentTypes(
    typeAssocitateOrDisassociateToEventDto: TypeAssocitateOrDisassociateToEventDto,
    user: User,
  ) {
    const { event_id, incident_type_ids } =
      typeAssocitateOrDisassociateToEventDto;

    const newLinkedIncidentTypes = [];
    let message = _MESSAGES.INCIDENT_TYPE_ASSOCIATIONS_UPDATED_SUCCESSFULLY;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfAllIdsExist(
      IncidentType,
      'Some Of Incident Types',
      incident_type_ids,
    );

    for (const incident_type_id of incident_type_ids) {
      const [, created] = await EventIncidentType.findOrCreate({
        where: { event_id, incident_type_id },
      });

      if (created) newLinkedIncidentTypes.push(incident_type_id);
    }

    const eventIncidentType = await EventIncidentType.findAll({
      where: {
        incident_type_id: { [Op.notIn]: incident_type_ids },
        event_id,
      },
      attributes: ['incident_type_id'],
    });

    const incidentTypeExistingIds = eventIncidentType.map(
      ({ incident_type_id }) => incident_type_id,
    );

    const incidents = await Incident.findAll({
      where: {
        company_id,
        event_id,
      },
      attributes: [],
      include: [
        {
          model: IncidentType,
          where: { id: { [Op.in]: incidentTypeExistingIds } },
          attributes: ['id'],
        },
      ],
    });

    const incidentLinked = [
      ...new Set(incidents.map((item) => item.incident_types.id)),
    ];

    const incidentTypeToDelete = incidentTypeExistingIds.filter(
      (id) => !incidentLinked.includes(id),
    );

    if (incidentLinked.length) {
      await EventIncidentType.destroy({
        where: {
          event_id,
          incident_type_id: { [Op.in]: incidentTypeToDelete },
        },
      });

      message = `'${incidentLinked.length}' Incident Types could not be removed. These are associated with incidents.`;
    } else {
      await EventIncidentType.destroy({
        where: {
          event_id,
          incident_type_id: { [Op.notIn]: incident_type_ids },
        },
      });
    }

    const updatedIncidentType = await updateIncidentTypeData(event_id);

    this.pusherService.sendDeletedIncidentType(updatedIncidentType, event_id);

    sendIncidentTypesAssociationsUpdate(
      incidentTypeToDelete,
      newLinkedIncidentTypes,
      this.pusherService,
      event_id,
      company_id,
      this.sequelize,
    );

    return {
      message,
      statusCode: incidentLinked.length ? 402 : null,
    };
  }

  async uploadIncidentTypes(
    uploadIncidentTypes: UploadIncidentTypesDto,
    user: User,
  ) {
    const { file, event_id } = uploadIncidentTypes;
    let incidentTypesToBeCreated = [];
    const transaction = await this.sequelize.transaction();

    const [company_id] = await withCompanyScope(user, event_id);

    const parsedFileData = await parseCsvForTypes(file, this.httpService);

    const company: Company = await isCompanyExist(company_id);

    if (parsedFileData.length) {
      incidentTypesToBeCreated = await getFilteredTypesForCsv(
        await uploadTypesCsvHeaderNames(parsedFileData),
        company_id,
        company.default_lang,
      );
    }

    if (incidentTypesToBeCreated.length)
      await createIncidentTypesThroughCSV(
        incidentTypesToBeCreated,
        company,
        event_id,
        transaction,
      );
    else if (!parsedFileData.length || !incidentTypesToBeCreated.length) {
      return { message: 'No New Records To Be Saved' };
    }

    const count = await this.incidentService.getIncidentModuleCounts(event_id);

    sendUpdatedIncidentTypes(
      { message: `Saved Successfully`, count },
      event_id,
      'upload',
      SocketTypes.INCIDENT_TYPE,
      true,
      this.pusherService,
    );

    return { message: 'Saved Successfully' };
  }

  async getAllIncidentTypes(
    incidentTypeQueryParamsDto: IncidentTypeQueryParamsDto,
    user: User,
    res: Response,
  ) {
    const { event_id, is_assigned } = incidentTypeQueryParamsDto;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    const company = await checkIfRecordsExist(Company, { id: company_id }, [
      'default_lang',
    ]);

    const include = [];

    if (is_assigned)
      include.push({
        model: EventIncidentType,
        attributes: [],
        where: {
          event_id,
        },
      });

    include.push({
      model: IncidentTypeTranslation,
      as: 'incident_type_translations',
      attributes: ['id', 'language', 'translation', 'incident_type_id'],
      where: {
        language: company[0].default_lang,
      },
    });

    const incidentTypes = await IncidentType.findAll({
      where: getAllIncidentTypeWhere(incidentTypeQueryParamsDto, company_id),
      attributes: ['id', 'name'],
      include: include,
      order: [[Sequelize.literal('name'), SortBy.ASC]],
    });

    const incident_ids = incidentTypes.map(({ id }) => id);

    let result = [];

    if (incident_ids.length)
      [result] = await getIncidentTypesAlphabetically(
        event_id,
        company_id,
        incident_ids,
        company[0].default_lang,
        this.sequelize,
      );

    const assignedTypes = await IncidentType.count({
      where: getAllIncidentTypeWhere(incidentTypeQueryParamsDto, company_id),
      include: [
        {
          model: EventIncidentType,
          where: { event_id },
        },
      ],
    });

    const pinnedCount = await IncidentType.count({
      where: getAllIncidentTypeWhere(incidentTypeQueryParamsDto, company_id),
      include: [
        {
          model: EventIncidentType,
          where: { event_id },
          required: false,
        },
      ],
    });

    //priority-counts//
    const counts: IncidentTypeDefaultPriority[] = await IncidentType.findAll({
      where: getAllIncidentTypeCountWhere(
        incidentTypeQueryParamsDto,
        company_id,
      ),
      attributes: [
        [IncidentType.getDefaultPriorityNameByKey, 'default_priority'],
        [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
      ],
      include: !!is_assigned
        ? [
            {
              model: EventIncidentType,
              attributes: [],
              where: {
                event_id,
              },
            },
          ]
        : [],
      group: [`"IncidentType"."default_priority"`],
      raw: true,
    });

    const priorityCounts = convertCountArrayToPriorityCount(counts);
    const count = Object.values(priorityCounts).reduce(
      (acc, value) => acc + value,
      0,
    );

    return res.send(
      successInterceptorResponseFormat({
        data: result,
        counts: {
          count,
          assignedTypes,
          pinnedCount,
          priorityCounts,
        },
      }),
    );
  }

  public async getAllIncidentTypesUncategorized(
    incidentTypeQueryParamsDto: IncidentTypeQueryParamsDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_id, csv_pdf, page, page_size, top_sorted } =
      incidentTypeQueryParamsDto;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    const company = await isCompanyExist(company_id);

    const incidentTypeWithResolvedTime = await getIncidentTypeWithResolvedTime(
      incidentTypeQueryParamsDto,
      company_id,
      company.default_lang,
      this.sequelize,
    );

    let incidentTypes = incidentTypeWithResolvedTime['incidentType'];
    const count = incidentTypeWithResolvedTime['count'];

    if (top_sorted) {
      incidentTypes = incidentTypes.filter(
        ({ incidents_count }) => incidents_count > 0,
      ); // Remove records where incidents_count is 0
    }

    incidentTypes = incidentTypes.map((incidentType) => ({
      ...incidentType,
      name: incidentType.incident_type_translations[0].translation,
    }));

    if (csv_pdf) {
      const event = await getEventForPdfs(event_id, this.sequelize);

      return await generateCsvOrPdfForIncidentTypesInReport(
        incidentTypeQueryParamsDto,
        incidentTypes,
        event,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: incidentTypes,
        pagination: calculatePagination(count, page_size, page),
      }),
    );
  }

  async getAllIncidentTypeNames(
    getIncidentTypeNamesDto: GetIncidentTypeNamesDto,
  ) {
    const { company_id, event_id } = getIncidentTypeNamesDto;

    const company = await isCompanyExist(company_id);

    const include = [];

    if (event_id)
      include.push({
        model: Event,
        where: { id: event_id },
        attributes: [],
        required: true,
      });

    include.push({
      model: IncidentTypeTranslation,
      as: 'incident_type_translations',
      attributes: ['id', 'language', 'translation', 'incident_type_id'],
      where: {
        language: company.default_lang,
      },
    });

    const incidentTypes = await IncidentType.findAll({
      where: { company_id },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      include,
      order: [['name', SortBy.ASC]],
    });

    return incidentTypes.map((incidentType) => ({
      ...incidentType.dataValues,
      name: incidentType.incident_type_translations[0].translation,
    }));
  }

  async getIncidentTypeById(
    id: number,
    event_id: number,
    user: User,
    options?: Options,
  ) {
    const [company_id] = await withCompanyScope(user, event_id);

    const incidentType = await IncidentType.findOne({
      where: { id, company_id },
      attributes: [
        'id',
        'name',
        'company_id',
        'color',
        'default_priority',
        'pinned',
        [
          Sequelize.literal(incidentTypeAlertCountSubQuery(event_id)),
          'incident_type_alert_count',
        ],
        [
          Sequelize.literal(incidentsCountSubquery(event_id, company_id)),
          'incidents_count',
        ],
        [Sequelize.literal(eventsCountSubquery(event_id)), 'events_count'],
        [
          Sequelize.literal(`EXISTS(
          SELECT 1 FROM "event_incident_types"
            WHERE "event_incident_types"."incident_type_id" = "IncidentType"."id"
            AND "event_incident_types"."event_id" = ${event_id}
        )`),
          'is_assigned',
        ],
      ],
      include: [
        {
          model: Alert,
          where: { event_id },
          attributes: ['id', 'email_alert', 'sms_alert'],
          order: [['id', SortBy.DESC]],
          required: false,
          include: [
            {
              model: User,
              attributes: userAttributes,
            },
            {
              model: EventContact,
              attributes: eventContactAttributes,
            },
          ],
        },
      ],
      ...options,
    });
    if (!incidentType)
      throw new NotFoundException(ERRORS.INCIDENT_TYPE_NOT_FOUND);

    const [incidentTypeWithResolvedTime] = await getResolvedTime(
      this.sequelize,
      event_id,
      [incidentType],
    );

    return incidentTypeWithResolvedTime;
  }

  async updateIncidentType(
    id: number,
    updateIncidentTypeDto: UpdateIncidentTypeDto,
    user: User,
  ) {
    const { event_id, name, color, default_priority } = updateIncidentTypeDto;

    // checking Company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    const incidentType = await IncidentType.findOne({
      where: { id, company_id },
    });
    if (!incidentType)
      throw new NotFoundException(ERRORS.INCIDENT_TYPE_NOT_FOUND);
    const company = await isCompanyExist(company_id);

    const incidentTypeTranslation = await IncidentTypeTranslation.findOne({
      where: {
        incident_type_id: id,
        language: company.default_lang,
        translation: name,
      },
    });

    if (incidentTypeTranslation)
      throw new NotFoundException(ERRORS.INCIDENT_TYPE_ALREADY_EXIST);

    const transaction = await this.sequelize.transaction();

    try {
      await incidentType.update({ name, color, default_priority }, {
        transaction,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      await IncidentTypeTranslation.update({ translation: name }, {
        where: {
          incident_type_id: id,
          language: company.default_lang,
        },
        transaction,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ IncidentTypeService ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    const updatedIncidentType = await this.getIncidentTypeById(
      id,
      event_id,
      user,
      { useMaster: true },
    );

    this.pusherService.sendUpdatedIncidentType(
      updatedIncidentType,
      event_id,
      id,
    );

    const updatedIncidentTypeFormated = await this.getIncidentTypeById(
      id,
      event_id,
      user,
    );

    const count = await this.incidentService.getIncidentModuleCounts(event_id);

    sendUpdatedIncidentTypes(
      { incidentType: updatedIncidentTypeFormated, count },
      event_id,
      'update',
      SocketTypes.INCIDENT_TYPE,
      false,
      this.pusherService,
    );

    return updatedIncidentTypeFormated;
  }

  async deleteIncidentType(
    destroyMultipleIncidentTypesDto: DestroyMultipleIncidentTypesDto,
    user: User,
  ) {
    const { event_id, incident_type_ids } = destroyMultipleIncidentTypesDto;

    // checking company level permission
    let [company_id] = await withCompanyScope(user, event_id);

    company_id = isOntrackRole(user['role']) ? company_id : user['company_id'];

    const incidentType = await IncidentType.findAll({
      where: { id: { [Op.in]: incident_type_ids } },
      attributes: ['id', 'name'],
    });

    if (incidentType.length !== incident_type_ids.length)
      throw new NotFoundException(_ERRORS.SOME_OF_INCIDENT_TYPE_ARE_NOT_FOUND);

    const incidentTypeIds = incidentType.map(({ id }) => id);

    const incidents = (
      await Incident.findAll({
        where: {
          incident_type_id: { [Op.in]: incidentTypeIds },
          company_id,
          event_id,
        },
        attributes: ['incident_type_id'],
      })
    ).map((incident) => incident.incident_type_id);

    const incidentTypeEvents = (
      await EventIncidentType.findAll({
        where: { incident_type_id: { [Op.in]: incident_type_ids } },
        attributes: ['id', 'incident_type_id'],
      })
    ).map((event_incident_type) => event_incident_type.incident_type_id);

    const incidentTypeToDelete = incidentTypeIds.filter(
      (id) => !incidentTypeEvents.includes(id) && !incidents.includes(id),
    );

    const notDeletedIncidentType = incidentTypeIds.filter(
      (id) => !incidentTypeToDelete.includes(id),
    );

    if (incidentTypeToDelete.length) {
      const deletedIncidentTypeNames = incidentType
        .filter((type) => incidentTypeToDelete.includes(type.id))
        .map((type) => type.name);

      await IncidentType.destroy({
        where: {
          id: {
            [Op.in]: incidentTypeToDelete,
          },
        },
      });

      const updatedIncidentType = getIncidentAlphabeticallyForSocket(
        deletedIncidentTypeNames,
        incidentTypeToDelete,
      );

      this.pusherService.sendDeletedIncidentType(updatedIncidentType, event_id);

      const count =
        await this.incidentService.getIncidentModuleCounts(event_id);

      sendUpdatedIncidentTypes(
        {
          message: MESSAGES.INCIDENT_TYPE_DESTROYED_SUCCESSFULLY,
          count,
          deletedIds: incidentTypeToDelete,
        },
        event_id,
        'delete',
        SocketTypes.INCIDENT_TYPE,
        false,
        this.pusherService,
      );

      return {
        message: MESSAGES.INCIDENT_TYPE_DESTROYED_SUCCESSFULLY,
        statusCode: notDeletedIncidentType?.length ? 402 : 200,
      };
    } else {
      throw new UnprocessableEntityException(
        _ERRORS.INCIDENT_ARE_LINKED_WITH_THIS_INCIDENT_TYPE_IT_CANT_BE_DESTROYED,
      );
    }
  }

  async removeAlerts(id: number, event_id: number) {
    const alerts = await Alert.findAll({
      where: {
        event_id,
        alertable_id: id,
        alertable_type: PolymorphicType.INCIDENT_TYPE,
      },
    });
    if (!alerts) throw new NotFoundException(ERRORS.ALERT_NOT_FOUND);

    await Alert.destroy({
      where: {
        event_id,
        alertable_id: id,
        alertable_type: PolymorphicType.INCIDENT_TYPE,
      },
    });

    const count = await this.incidentService.getIncidentModuleCounts(event_id);

    const deletedAlertIds = alerts.map((alert) => alert.id);

    sendUpdatedIncidentTypes(
      {
        message: MESSAGES.ALERTS_REMOVED_SUCCESSFULLY,
        count,
        deletedIds: [id],
        deletedAlertIds,
      },
      event_id,
      'delete',
      SocketTypes.ALERT,
      false,
      this.pusherService,
    );

    return { message: MESSAGES.ALERTS_REMOVED_SUCCESSFULLY };
  }

  async cloneEventIncidentTypes(clone_incident_types: CloneDto) {
    const { clone_event_id, current_event_id } = clone_incident_types;

    await isEventExist(current_event_id);

    const eventTypes = await EventIncidentType.findAll({
      where: { event_id: clone_event_id },
      attributes: ['incident_type_id'],
    });
    if (!eventTypes.length)
      throw new NotFoundException(_ERRORS.NO_TYPES_HAVE_BEEN_ASSOCIATED);

    const incidentTypeIds = eventTypes.map(
      ({ incident_type_id }) => incident_type_id,
    );

    for (const incident_type_id of incidentTypeIds) {
      await EventIncidentType.findOrCreate({
        where: { event_id: current_event_id, incident_type_id },
      });
    }

    const count =
      await this.incidentService.getIncidentModuleCounts(current_event_id);

    sendUpdatedIncidentTypes(
      { message: 'Event Sources Cloned Successfully', count },
      current_event_id,
      'clone',
      SocketTypes.INCIDENT_TYPE,
      true,
      this.pusherService,
    );

    return { message: 'Event Incident Types Cloned Successfully' };
  }

  async getAlertIncidentTypes(
    alertIncidentDto: GetAlertIncidentTypesDto,
    user: User,
    res: Response,
  ) {
    const {
      event_id,
      user_id,
      assigned_incident_types,
      keyword,
      incident_priority,
      key_contact,
      alphabet_sort,
    } = alertIncidentDto;
    let priorities: string[];

    const [company_id] = await withCompanyScope(user, event_id);

    const company: Company = (await checkIfSingleRecordExist(
      Company,
      { id: company_id },
      ['default_lang'],
    )) as Company;

    if (incident_priority?.length) {
      priorities = getQueryListParam(incident_priority);

      if (priorities.includes(IncidentPriorityApi.MEDIUM)) {
        priorities.push(PriorityGuideFilter.NORMAL);
      }
    }

    const incidentTypes = await IncidentType.findAndCountAll({
      attributes: [
        'name',
        'id',
        'default_priority',
        'pinned',
        [Sequelize.literal(`"events->alerts"."id"`), 'is_assigned'],
      ],
      where: getIncidentAlertWhere(keyword, priorities),
      include: [
        {
          model: Event,
          through: { attributes: [] },
          attributes: ['id'],
          where: { id: event_id },
          include: [
            {
              model: Alert,
              attributes: ['id', 'sms_alert', 'email_alert'],
              where: getIncidentTypeAlertWhere(user_id),
              required: user_id || assigned_incident_types ? true : false,
              include:
                key_contact === false
                  ? [
                      {
                        model: User,
                        attributes: UsersAttributes(),
                        include: getUserCompanyIncludeForAlerts(company_id),
                      },
                    ]
                  : key_contact
                    ? [
                        {
                          model: EventContact,
                          attributes: EventContactAttributes(),
                        },
                      ]
                    : [
                        {
                          model: User,
                          attributes: UsersAttributes(),
                          include: getUserCompanyIncludeForAlerts(company_id),
                        },
                        {
                          model: EventContact,
                          attributes: EventContactAttributes(),
                        },
                      ],
            },
          ],
        },
        {
          model: IncidentTypeTranslation,
          as: 'incident_type_translations',
          attributes: ['id', 'language', 'translation', 'incident_type_id'],
          where: {
            language: company.default_lang,
          },
        },
      ],
      distinct: true,
    });

    const { rows, count } = incidentTypes;
    const result = aphabeticalGroupData(
      rows.map((item) => ({
        ...item.toJSON(),
        name: item.toJSON().incident_type_translations[0].translation,
      })),
      alphabet_sort,
    );

    const counts: IncidentTypeDefaultPriority[] = await IncidentType.findAll({
      where: getIncidentAlertWhere(keyword),
      attributes: [
        [IncidentType.getDefaultPriorityNameByKey, 'default_priority'],
        [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
      ],
      include: [
        {
          model: Event,
          attributes: [],
          where: { id: event_id },
        },
      ],
      group: [
        `"IncidentType"."default_priority"`,
        `"events->EventIncidentType"."id"`,
      ],
      raw: true,
    });

    const priorityCounts = convertCountArrayToPriorityCount(counts);

    const assignedTypes = await IncidentType.count({
      where: getIncidentAlertWhere(keyword, priorities),
      include: [
        {
          model: EventIncidentType,
          where: { event_id },
        },
      ],
    });

    return res.send(
      successInterceptorResponseFormat({
        data: result,
        counts: {
          priorityCounts,
          count,
          assignedTypes,
        },
      }),
    );
  }

  async getUsersByIncidentType(
    getIncidentTypeUsersDto: GetIncidentTypeUsersDto,
  ) {
    const {
      keyword,
      event_id,
      incident_type_id,
      order,
      sort_column,
      page,
      page_size,
      department_users,
      all_users,
      department_id,
    } = getIncidentTypeUsersDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    let users;
    let allAlerts = [];
    let count: number;

    const { company_id } = await isEventExist(event_id);
    if (all_users) {
      const users = await User.findAll({
        attributes: [
          'id',
          'cell',
          'email',
          'name',
          'first_name',
          'last_name',
          'country_code',
          'country_iso_code',
          'createdAt',
          [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
          [
            Sequelize.literal(`(
              SELECT ("companies"."name") FROM "companies"
              WHERE "companies"."id" = ${company_id}
            )`),
            'company_name',
          ],
        ],
        where: {
          ...getUserWhereQuery(keyword, true),
          blocked_at: { [Op.eq]: null },
        },
        include: [
          {
            model: EventUser,
            attributes: [],
            where: { event_id },
          },
          {
            model: Alert,
            attributes: ['id', 'sms_alert', 'email_alert', 'alertable_id'],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
              alertable_id: incident_type_id,
            },
            required: true,
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
              },
            ],
          },
          ...userRoleInclude(company_id),
        ],
      });

      const eventContacts = await EventContact.findAll({
        where: getUserWhereQuery(keyword),
        attributes: {
          exclude: ['event_id', 'expected_presence', 'city', 'updated_at'],
          include: [
            [EventContact.getInfoTypeByKey, 'info_type'],
            [
              Sequelize.literal(`(
                SELECT ("companies"."name") FROM "companies"
                WHERE "companies"."id" = ${company_id}
              )`),
              'company_name',
            ],
          ],
        },
        include: [
          {
            model: Alert,
            attributes: ['id', 'sms_alert', 'email_alert', 'alertable_id'],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
              alertable_id: incident_type_id,
            },
            required: true,
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
              },
            ],
          },
        ],
      });

      allAlerts = [...users, ...eventContacts];
      // Sort the merged array by name in ascending order
      allAlerts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (department_users) {
      const staff = await User.findAll({
        attributes: [
          'id',
          'name',
          [
            getAssignedAlertSubquery(
              'user_alerts->incident_type',
              incident_type_id,
            ),
            'assigned_alert',
          ], // for getting assigned value alert for listing in incident_type modal
        ],
        where: {
          ...getUserWhereQuery(keyword, department_users),
          blocked_at: { [Op.eq]: null },
        },
        include: [
          {
            model: EventUser,
            attributes: [],
            where: { event_id },
          },
          {
            model: Department,
            attributes: ['id'],
            where: {
              ...(department_id
                ? {
                    id: department_id,
                  }
                : {}),
            },
            include: [
              {
                model: Event,
                attributes: [],
                where: { id: event_id },
              },
            ],
          },
          {
            model: Alert,
            attributes: [],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
            },
            required: false,
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
                required: false,
              },
            ],
          },
          {
            model: UserCompanyRole,
            attributes: [],
            where: { company_id },
          },
        ],
        subQuery: false,
        order: [
          ['assigned_alert', SortBy.DESC], // Prioritize matching incident_type_id
          [sort_column || 'name', order || SortBy.ASC],
        ],
      });

      const userIds = staff?.map((data) => data.id);
      const limit = _page_size;
      const offset = _page * _page_size;

      // Calculate the offset for pagination
      const array_offset = offset ?? 0;

      // Slice the event IDs based on pagination parameters
      const paginatedUserIds = userIds.slice(
        array_offset,
        array_offset + limit,
      );

      count = staff?.length;

      users = await User.findAll({
        where: { id: { [Op.in]: paginatedUserIds } },
        attributes: [
          'id',
          'cell',
          'email',
          'name',
          'first_name',
          'last_name',
          'country_code',
          'country_iso_code',
          'createdAt',
          [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
          [
            Sequelize.literal(`(
              SELECT ("companies"."name") FROM "companies"
              WHERE "companies"."id" = ${company_id}
            )`),
            'company_name',
          ],
          [
            getAssignedAlertSubquery(
              'user_alerts->incident_type',
              incident_type_id,
            ),
            'assigned_alert',
          ], // for getting assigned value alert for listing in incident_type modal
        ],
        include: [
          {
            model: Alert,
            attributes: ['id', 'sms_alert', 'email_alert', 'alertable_id'],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
            },
            required: false,
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
                required: false,
              },
            ],
          },
          ...userRoleInclude(company_id),
        ],
        order: [
          ['assigned_alert', SortBy.DESC], // Prioritize matching incident_type_id
          [sort_column || 'name', order || SortBy.ASC],
        ],
      });
    } else {
      const staff = await EventContact.findAll({
        where: getUserWhereQuery(keyword, false, company_id),
        attributes: [
          'id',
          'name',
          [
            getAssignedAlertSubquery(
              'event_contact_alerts->incident_type',
              incident_type_id,
            ),
            'assigned_alert',
          ], // for getting assigned value alert for listing in incident_type modal
        ],
        include: [
          {
            model: Alert,
            attributes: [],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
            },
            required: false,
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
                required: false,
              },
            ],
          },
        ],
        subQuery: false,
        order: [
          ['assigned_alert', SortBy.DESC], // Prioritize matching incident_type_id
          [sort_column || 'name', order || SortBy.ASC],
        ],
      });

      const userIds = staff?.map((data) => data.id);
      const limit = _page_size;
      const offset = _page * _page_size;

      // Calculate the offset for pagination
      const array_offset = offset ?? 0;

      // Slice the event IDs based on pagination parameters
      const paginatedUserIds = userIds.slice(
        array_offset,
        array_offset + limit,
      );

      count = staff?.length;

      users = await EventContact.findAll({
        where: {
          id: { [Op.in]: paginatedUserIds },
        },
        attributes: {
          exclude: ['event_id', 'expected_presence', 'city', 'updated_at'],
          include: [
            [EventContact.getInfoTypeByKey, 'info_type'],
            [
              Sequelize.literal(`(
                SELECT ("companies"."name") FROM "companies"
                WHERE "companies"."id" = ${company_id}
              )`),
              'company_name',
            ],
            [
              getAssignedAlertSubquery(
                'event_contact_alerts->incident_type',
                incident_type_id,
              ),
              'assigned_alert',
            ], // for getting assigned value alert for listing in incident_type modal
          ],
        },
        include: [
          {
            model: Alert,
            attributes: ['id', 'sms_alert', 'email_alert', 'alertable_id'],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
            },
            required: false,
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
                required: false,
              },
            ],
          },
        ],
        order: [
          ['assigned_alert', SortBy.DESC], // Prioritize matching incident_type_id
          [sort_column || 'name', order || SortBy.ASC],
        ],
      });
    }

    return {
      data: all_users ? allAlerts : users,
      pagination: all_users
        ? calculatePagination(allAlerts?.length, 0, 1) //sending all data for all_users case and only sending count and page size and page are just dummy values
        : calculatePagination(count, page_size, page),
    };
  }

  async getIncidentsByIncidentType(
    getIncidentTypeIncidentsDto: GetIncidentTypeIncidentsDto,
  ) {
    const { event_id, page, page_size } = getIncidentTypeIncidentsDto;

    // checking is event exist or not
    await isEventExist(event_id);

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const { count, rows: allIncidents } = await Incident.findAndCountAll({
      where: getIncidentTypeIncidentsWhere(getIncidentTypeIncidentsDto),
      attributes: ['id'],
      include: [
        {
          model: IncidentType,
          as: 'incident_types',
          attributes: [],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: [],
        },
        {
          model: ResolvedIncidentNote,
          attributes: [],
        },
      ],
      limit: _page_size,
      offset: _page_size * _page || undefined,
      order: [['id', SortBy.ASC]],
      distinct: true,
    });

    const allIncidentIds = allIncidents.map((incident) => incident.id);

    const incidents = await Incident.findAll({
      where: {
        id: { [Op.in]: allIncidentIds },
      },
      attributes: [
        'id',
        'description',
        'logged_date_time',
        'resolved_time',
        'createdAt',
        'created_by',
        [Incident.getStatusNameByKey, 'status'],
        [Incident.getPriorityNameByKeyNewMapping, 'priority'],
        [Sequelize.literal(`"incident_types"."name"`), 'incident_type'],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "comments"
            WHERE "comments"."commentable_id" = "Incident"."id" AND "comments"."commentable_type" = '${PolymorphicType.INCIDENT}'
          )`),
          'comments_count',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "images"
            WHERE "images"."imageable_id" = "Incident"."id" AND "images"."imageable_type" = '${PolymorphicType.INCIDENT}'
          )`),
          'attachments_count',
        ],
      ],
      include: [
        {
          model: IncidentType,
          attributes: [],
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: [
            'id',
            'name',
            'first_name',
            'last_name',
            [Sequelize.literal(User.getStatusByKey), 'status'],
            [
              Sequelize.literal(`(
                SELECT JSON_BUILD_OBJECT(
                  'id', scans.id,
                  'scan_type', ${Scan.getScanTypeByKey},
                  'created_at', to_char("scans"."created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                ) AS subquery_results
                FROM "users" AS "_users"
                INNER JOIN "incident_department_users" ON "_users"."id" = "incident_department_users"."user_id"
                LEFT JOIN "scans" ON "scans"."user_id" = "_users"."id" AND "scans"."incident_id" = "Incident"."id"
                WHERE "incident_department_users"."incident_id" = "Incident"."id"
                  AND "_users"."id" = "users"."id"
                ORDER BY
                  "scans"."created_at" DESC
                LIMIT 1
              )`),
              'incident_user_last_scan',
            ],
          ],
        },
        {
          model: ResolvedIncidentNote,
          attributes: [
            'note',
            'affected_person',
            [getStatusNameByKeyInclude, 'status'],
          ],
        },
        {
          model: IncidentDivision,
          as: 'incident_divisions',
          attributes: [
            [
              Sequelize.literal('CAST("incident_divisions"."id" AS INTEGER)'),
              'id',
            ],
            'name',
          ],
          through: { attributes: [] },
        },
      ],
      order: [['id', SortBy.ASC]],
    });

    return {
      data: incidents,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async pinIncidentType(id: number, event_id: number, user: User) {
    let updatedIncidentTypeFormated;

    const incidentType = await IncidentType.findOne({
      where: { id },
      attributes: ['id', 'pinned', 'company_id'],
    });

    if (!incidentType)
      throw new NotFoundException(RESPONSES.notFound('Incident Type'));

    await incidentType.update({ pinned: !incidentType.pinned });

    if (event_id) {
      updatedIncidentTypeFormated = await this.getIncidentTypeById(
        id,
        event_id,
        user,
        { useMaster: true },
      );

      this.pusherService.sendUpdatedIncidentType(
        updatedIncidentTypeFormated,
        event_id,
        id,
      );
    }

    sendUpdatedIncidentTypes(
      {
        message: 'Incident Type pinned Successfully',
        data: event_id ? updatedIncidentTypeFormated : '',
      },
      event_id ? event_id : incidentType.company_id,
      'update',
      SocketTypes.INCIDENT_TYPE,
      false,
      this.pusherService,
    );

    return { success: true };
  }
}
