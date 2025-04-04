import { CreateOptions, Op, UpdateOptions } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import moment from 'moment';
import axios from 'axios';
import {
  ChangeLog,
  Comment,
  Company,
  Department,
  Event,
  Image,
  Incident,
  IncidentDepartmentUsers,
  IncidentDivision,
  IncidentMultipleDivision,
  IncidentType,
  IncidentTypeTranslation,
  IncidentZone,
  LegalGroup,
  Location,
  ResolvedIncidentNote,
  Scan,
  Source,
  StatusChange,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getPageAndPageSize,
  getPageAndPageSizeWithDefault,
  humanizeTitleCase,
  isEventExist,
  isUserExist,
  pushNotificationJsonFormater,
  throwCatchError,
  withCompanyScope,
  getEventForPdfs,
  userRoleInclude,
  getQueryListParam,
  isDepartmentExist,
  extractPlainFileNameFromS3Url,
  getUserRole,
  withTryCatch,
  isCompanyExist,
  getSubCompaniesOfGlobalAdmin,
  checkIfSingleRecordExist,
} from '@ontrack-tech-group/common/helpers';
import {
  CommentableTypes,
  AlertableType,
  CsvOrPdf,
  ERRORS,
  IncidentPriority,
  PdfTypes,
  PriorityFilter,
  RESPONSES,
  SortBy,
  PolymorphicType,
  IncidentStatusType,
  StatusFilter,
  ScanTypeNumber,
  Priority,
  SourceTypeNumber,
  ResolvedIncidentNoteStatusDb,
  isLowerRoleIncludingOperationManager,
  isWithRestrictedVisibility,
  IosInterruptionLevel,
  MessageableType,
  Options,
  Editor,
  PriorityFilterBothConventionNumber,
  PriorityFilterBothConventionString,
  priorityMap,
  customPriorityMap,
  GraphDataInterface,
  ObjectWithNumbersValue,
  IncidentDashboardStats,
  PaginationInterface,
  restrictedDeleteImageRolesIncidentModule,
} from '@ontrack-tech-group/common/constants';
import {
  PusherService,
  AnalyticCommunicationService,
  getReportsFromLambda,
  postRequest,
  CommunicationService,
  ChangeLogService,
  putRequest,
  ImageService,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { getIncidentTypeWithResolvedTime } from '@Modules/incident-type/helpers';
import { getIncidentDivisionsWithResolvedTime } from '@Modules/incident-division/helpers';
import {
  getIncidentZoneWithResolvedTime,
  isIncidentZoneExist,
} from '@Modules/incident-zone/helpers';
import {
  checkEventOfSameCompany,
  createChangelogForDispatchStaff,
  sendPushNotificationAndSMS,
} from '@Common/helpers';
import {
  FormattedIncidentData,
  IncidentByPriorityAndStatus,
  IncidentDashboard,
  LinkIncidentData,
  UserWithCompanyId,
} from '@Common/constants/interfaces';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { CloneDto } from '@Common/dto';
import { IncidentDivisionService } from '@Modules/incident-division/incident-division.service';
import { SourceService } from '@Modules/source/source.service';
import { IncidentTypeService } from '@Modules/incident-type/incident-type.service';
import { IncidentZoneService } from '@Modules/incident-zone/incident-zone.service';
import { ReferenceMapService } from '@Modules/reference-map/reference-map.service';
import { AlertService } from '@Modules/alert/alert.service';
import { _ERRORS } from '@Common/constants';
import { QueueService } from '@Modules/queue/queue.service';
import {
  IncidentQueryParamsDto,
  CreateIncidentDto,
  UpdateIncidentDto,
  EventIncidentReportDto,
  IncidentDashboardReportOverviewDto,
  EventNamesQueryParams,
  IncidentChangelogQueryParamsDto,
  CreateCommentDto,
  CreateImageDto,
  DispatchIncidentDto,
  LinkIncidentDto,
  RemoveIncidentDepartmentDto,
  GetDispatchLogsDto,
  UploadIncidentDto,
  IncidentOverviewStatsQueryParamsDto,
  DashboardPdfDto,
  UnLinkIncidentDto,
  IncidentQueryParamsForMapDto,
  GetIncidentCountMobileDto,
  UpdateIncidentLegalStatusDto,
  MarkCommentRead,
} from './dto';
import {
  isIncidentExist,
  incidentDashboardStats,
  getDtoObjectsForReport,
  getIncidentResolvedTimeWithNullZones,
  getIncidentsOrder,
  isUpperRoles,
  cloneDepartments,
  checkDepartmentStaffExist,
  createChangelogForUnlinkDispatchedStaff,
  sendAlertEmailAndSmsOnPriorityChange,
  sendAlertEmailAndSmsOnIncidentTypeChange,
  uploadIncidentsValidations,
  getDispatchLogForUser,
  formatDispatchMessageWithUsers,
  checkAllValidationsForUpdateAndCreateIncident,
  availableDivisionIncidentIds,
  unAvailableDivisionIncidentIds,
  uploadIncidentCompiler,
  csvToArrayParser,
  transformIncidentCountsData,
  formatIncidentCounts,
  dispatchStaffSerializer,
  updateUserCommentStatus,
  getIncidentCountsForLegal,
  getLegalCompanyContacts,
  sendLegalPrivilegeEmail,
  createScanAfterIncidentUpdate,
  mobileOverviewApiQueryParams,
} from './helpers';
import {
  activeIncidentsCount,
  commentedBy,
  commentedByCamper,
  createdBy,
  divisionLockEditAccess,
  divisionlockWithRestrictedVisibility,
  divisionRawInclude,
  editorName,
  getAllIncidentsRawQueries,
  getIncidentCountsByStatusAndPriority,
  getResolvedIncidentNoteCounts,
  getScanType,
  getStatusNameByKeyInclude,
  incidentScans,
  reporter,
  serialiserForAllIncident,
  updatedBy,
} from './helpers/queries';
import {
  getIncidentWhereQuery,
  incidentDashboardStatsWhereQuery,
  incidentChangeLogWhere,
  getDispatchLogsWhere,
  getEventNameSearch,
  getIncidentsForMapWhereQuery,
  getMobileCountWhere,
} from './helpers/where';
import {
  hasUnreadComments,
  incidentCommonAttributes,
} from './helpers/attributes';
import {
  getIncidentsListQueryInclude,
  getIncidentsIncludeForIds,
  getIncidentsListQueryForMapInclude,
  EventUserModel,
  getIncidentsIncludeForIdsV2,
} from './helpers/includes';
import {
  formatAndGenerateCsv,
  generatePdfForEventIncidentReport,
  generatePdfForDashboard,
  getTypesZonesDivisionsOverviewPdf,
  csvDownload,
} from './helpers/csv-pdf';
import {
  sendIncidentUpdate,
  sendIncidentsDashboardOverviewUpdate,
  sendDashboardListingsUpdates,
  sendDispatchLogUpdate,
  sendLinkedIncidentUpdate,
  sendDispatchedStaffData,
  sendIncidentCountUpdate,
  sendIncidentLegalUpdate,
} from './helpers/sockets';

@Injectable()
export class IncidentService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly pusherService: PusherService,
    private readonly analyticCommunicationService: AnalyticCommunicationService,
    private readonly communicationService: CommunicationService,
    private readonly incidentDivisionService: IncidentDivisionService,
    private readonly incidentZones: IncidentZoneService,
    private readonly referenceMapService: ReferenceMapService,
    private readonly translateService: TranslateService,

    @Inject(forwardRef(() => SourceService))
    private readonly sourceService: SourceService,

    @Inject(forwardRef(() => IncidentTypeService))
    private readonly incidentTypes: IncidentTypeService,

    @Inject(forwardRef(() => AlertService))
    private readonly alertsService: AlertService,

    private readonly changeLogService: ChangeLogService,
    private readonly imageService: ImageService,
    private readonly queueService: QueueService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async createIncident(
    createIncidentDto: CreateIncidentDto,
    user: User,
    req: Request,
  ): Promise<Incident> {
    const {
      department_id,
      event_id,
      location_attributes,
      incident_type_id,
      priority,
      // status,
    } = createIncidentDto;

    let _priority: IncidentPriority =
      IncidentPriority[priority.toUpperCase() as keyof typeof IncidentPriority];

    // Check if user has access to this event or not based on its company or subcompany
    const [, divisionLockService] = await withCompanyScope(user, event_id);

    if (department_id) {
      await isDepartmentExist(department_id);
    }

    await isEventExist(event_id);

    const incidentType = await IncidentType.findByPk(incident_type_id, {
      attributes: ['name'],
    });

    const url = `${this.configService.get('RAILS_BASE_URL')}/incidents`;

    if (priority === PriorityFilterBothConventionString.MEDIUM) {
      _priority = customPriorityMap[PriorityFilter.NORMAL];
    } else if (priority === PriorityFilterBothConventionString.HIGH) {
      _priority = customPriorityMap[PriorityFilter.IMPORTANT];
    }

    const body = {
      ...createIncidentDto,
      incident_type: incidentType?.name,
      location_attributes,
      created_by: user.id,
      created_by_type: 'User',
      reporter_id: department_id || null,
      priority: _priority,
    };

    const response = await postRequest(
      req.headers.authorization || '',
      this.httpService,
      body,
      url,
    );

    if (response) {
      // This is for sending update to dashboard/analytics service
      withTryCatch(
        () => {
          this.analyticCommunicationService.analyticCommunication(
            { eventId: event_id, incidentId: response.data.id },
            'update-incident',
            user,
          );
        },
        'createIncident',
        'analyticCommunicationService',
      );
    }

    sendIncidentCountUpdate(event_id, this.pusherService);

    const createdIncident = await this.getIncidentById(
      response.data.id,
      event_id,
      user,
      false,
      { useMaster: true },
    );

    sendIncidentUpdate(
      createdIncident,
      event_id,
      true, // isNew flag
      this.pusherService,
      false, // isUpload flag
      divisionLockService,
    );

    //Socket for incident dashboard
    sendIncidentsDashboardOverviewUpdate(
      event_id,
      this.pusherService,
      await this.getIncidentOverviewStats(user, {
        event_id,
      } as IncidentOverviewStatsQueryParamsDto),
    );

    return response.data as Incident;
  }

  async createIncidentV1(
    createIncidentDto: CreateIncidentDto,
    user: User,
  ): Promise<Incident> {
    const {
      department_id,
      event_id,
      location_attributes,
      incident_type_id,
      priority,
      status,
      incident_division_ids,
      incident_zone_id,
      source_type,
      images,
      department_staff,
    } = createIncidentDto;

    const { latitude, longitude } = location_attributes;
    let createdImages: Image[] = [];

    const [company_id, divisionLockService] = await withCompanyScope(
      user,
      event_id,
    );
    let incident!: Incident; // "!" tell the system that value will be assigned on runtime

    const { incidentType } =
      await checkAllValidationsForUpdateAndCreateIncident(
        company_id,
        createIncidentDto,
        user,
        true,
      );

    const _priority: number =
      priority &&
      PriorityFilterBothConventionNumber[
        priority.toUpperCase() as keyof typeof PriorityFilterBothConventionNumber
      ];
    const humanizeNewPriority: string = priorityMap[_priority] || '';

    const transaction = await this.sequelize.transaction();

    try {
      incident = await Incident.create(
        {
          ...createIncidentDto,
          source_type:
            source_type &&
            SourceTypeNumber[
              source_type.toUpperCase() as keyof typeof SourceTypeNumber
            ],
          incident_type: incidentType?.name,
          incident_type_id: incidentType?.id,
          location_attributes,
          reporter_id: department_id || null,
          priority: _priority,
          status:
            IncidentStatusType[
              status.toUpperCase() as keyof typeof IncidentStatusType
            ],
          company_id,
          created_by: user.id,
          created_by_type: PolymorphicType.USER,
          updated_by: user.id,
          updated_by_type: PolymorphicType.USER,
          logged_date_time: moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & { editor: Editor },
      );

      if (createIncidentDto?.incident_division_ids?.length) {
        for (const incident_division_id of createIncidentDto.incident_division_ids) {
          await IncidentMultipleDivision.findOrCreate({
            where: {
              incident_id: incident.id,
              incident_division_id,
            },
            transaction,
            useMaster: true,
          });
        }
      }

      if (location_attributes) {
        await Location.create(
          {
            locationable_id: incident.id,
            locationable_type: PolymorphicType.INCIDENT,
            longitude,
            latitude,
          },
          { transaction },
        );
      }

      if (images?.length) {
        createdImages = await this.imageService.createBulkImage(
          images.map((image) => ({
            imageable_id: incident.id,
            imageable_type: PolymorphicType.INCIDENT,
            url: image.url,
            name: extractPlainFileNameFromS3Url(image.url) || '',
            capture_at: image.capture_at,
          })),
          user,
          transaction,
        );
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }

    // This function is for dispatching users while creating incidents
    if (department_staff?.length) {
      withTryCatch(
        () =>
          this.dispatchStaff(user, {
            incident_id: incident.id,
            department_staff,
            event_id,
          } as DispatchIncidentDto),
        'dispatchStaff',
      );
    }

    const createdIncident = await this.getIncidentById(
      incident.id,
      event_id,
      user,
      true,
      { useMaster: true },
    );

    withTryCatch(
      () =>
        sendIncidentUpdate(
          createdIncident,
          event_id,
          true, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        ),
      'createIncidentV1',
      'sendIncidentUpdate',
    );

    withTryCatch(
      async () =>
        sendIncidentsDashboardOverviewUpdate(
          event_id,
          this.pusherService,
          await this.getIncidentOverviewStats(user, {
            event_id,
          } as IncidentOverviewStatsQueryParamsDto),
        ),
      'createIncidentV1',
      'sendIncidentsDashboardOverviewUpdate',
    );

    withTryCatch(
      () =>
        sendDashboardListingsUpdates(
          incident_type_id,
          incident_zone_id,
          incident_division_ids,
          event_id,
          company_id,
          this.pusherService,
          this.sequelize,
        ),
      'createIncidentV1',
      'sendDashboardListingsUpdates',
    );

    withTryCatch(
      () => sendIncidentCountUpdate(event_id, this.pusherService),
      'createIncidentV1',
      'sendIncidentCountUpdate',
    );

    withTryCatch(
      () =>
        sendAlertEmailAndSmsOnPriorityChange(
          '',
          event_id,
          humanizeNewPriority,
          createdIncident,
          this.communicationService,
        ),
      'createIncidentV1',
      'sendAlertEmailAndSmsOnPriorityChange',
    );

    withTryCatch(
      () =>
        sendAlertEmailAndSmsOnIncidentTypeChange(
          event_id,
          incident_type_id,
          createdIncident,
          this.communicationService,
        ),
      'createIncidentV1',
      'sendAlertEmailAndSmsOnIncidentTypeChange',
    );

    // This is for sending update to dashboard/analytics service
    withTryCatch(
      () =>
        this.analyticCommunicationService.analyticCommunication(
          { incident_id: createdIncident.id, is_new_incident: true },
          'update-incident',
          user,
        ),
      'createIncidentV1',
      'sendAlertEmailAndSmsOnIncidentTypeChange',
    );

    // Sending a push notification to the dispatchers upon attachment upload.
    if (createdImages.length) {
      await Image.sendIncidentImagePushNotification(
        createdImages[0],
        this.communicationService,
      );
    }

    return createdIncident;
  }

  async getEventIncidentReport(
    eventIncidentReportDto: EventIncidentReportDto,
    user: User,
    req: Request,
    res: Response,
  ): Promise<Response> {
    const {
      event_id,
      incident_id: id,
      with_changelogs,
    } = eventIncidentReportDto;

    // Check if user has access to this event or not based on its company or subcompany
    const [company_id, , timezone] = await withCompanyScope(user, event_id);

    const company: Company = (await checkIfSingleRecordExist(
      Company,
      { id: company_id },
      ['default_lang'],
    )) as Company;

    const incident = await Incident.findOne({
      where: { id, event_id },
      attributes: [
        'id',
        'description',
        [Incident.getStatusNameByKey, 'status'],
        [Incident.getDashboardPriorityNameByKey, 'priority'],
        'resolved_time',
        'created_at',
        'updated_at',
        'logged_date_time',
        'has_comment',
        'has_image',
        'row',
        'seat',
        'section',
        [reporter, 'reporter'],
        [createdBy, 'created_by'],
        [updatedBy, 'updated_by'],
      ],
      include: [
        {
          model: Event,
          attributes: [
            'id',
            'name',
            [
              this.sequelize.literal(`to_char(start_date, 'FMMM/FMDD/YY')`),
              'start_date',
            ],
            [
              this.sequelize.literal(`to_char(end_date, 'FMMM/FMDD/YY')`),
              'end_date',
            ],
            'event_location',
            'time_zone',
            'event_category',
          ],
        },
        {
          model: IncidentZone,
          attributes: ['id', 'name'],
        },
        {
          model: Source,
          attributes: ['id', 'name'],
        },
        {
          model: Image,
          attributes: [
            'id',
            'name',
            'url',
            'createdAt',
            [Sequelize.literal(`"images->created_by"."name"`), 'createdBy'],
          ],
          include: [
            {
              model: User,
              as: 'created_by',
              attributes: [],
            },
          ],
        },
        {
          model: ChangeLog,
          attributes: [
            'column',
            'old_value',
            'new_value',
            'formatted_log_text',
            'parent_changed_at',
            'created_at',
            [editorName, 'editor_name'],
          ],
          required: false,
        },
        {
          model: Comment,
          attributes: ['text', 'created_at', [commentedBy, 'commented_by']],
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
          model: IncidentDepartmentUsers,
          attributes: ['id', 'created_at'],
          include: [
            {
              model: User,
              attributes: ['name'],
              include: [
                {
                  model: Scan,
                  where: { incident_id: id },
                  attributes: [
                    [Sequelize.literal(getScanType), 'scan_type'],
                    'created_at',
                  ],
                  required: false,
                },
              ],
            },
            {
              model: Department,
              attributes: ['name'],
            },
          ],
        },
        {
          model: IncidentType,
          as: 'incident_types',
          attributes: ['name'],
          include: [
            {
              model: IncidentTypeTranslation,
              where: {
                language: company.default_lang,
              },
              attributes: ['translation'],
            },
          ],
        },
      ],
      order: [
        [{ model: ChangeLog, as: 'incident_logs' }, 'created_at', SortBy.DESC],
        [{ model: Comment, as: 'comments' }, 'created_at', SortBy.DESC],
        [
          { model: IncidentDepartmentUsers, as: 'incident_department_users' },
          { model: User, as: 'user' },
          { model: Scan, as: 'scans' },
          'created_at',
          SortBy.DESC,
        ],
      ],
      subQuery: false,
    });
    if (!incident) throw new NotFoundException(RESPONSES.notFound('Incident'));

    return await generatePdfForEventIncidentReport({
      incident,
      req,
      res,
      httpService: this.httpService,
      withChangelogs: with_changelogs,
      timezone,
    });
  }

  async getEventIncidentDashboardOverview(
    incidentDashboardReportOverviewDto: IncidentDashboardReportOverviewDto,
    user: User,
    req: Request,
    res: Response,
  ): Promise<Response> {
    const { event_id, image_url } = incidentDashboardReportOverviewDto;

    // Check if user has access to this event or not based on its company or subcompany
    const [company_id] = await withCompanyScope(user, event_id);

    const company = await isCompanyExist(company_id);

    const event = await Event.findOne({
      where: { id: event_id },
      attributes: ['name', 'start_date', 'end_date', 'event_location'],
    });

    const { incidentDivisionsParams, incidentTypeParams, incidentZoneParams } =
      getDtoObjectsForReport(event_id);

    const incidentTypes = await getIncidentTypeWithResolvedTime(
      incidentTypeParams,
      company_id,
      company.default_lang,
      this.sequelize,
    );

    const { rows: incidentDivisions } =
      await getIncidentDivisionsWithResolvedTime(
        incidentDivisionsParams,
        company_id,
        this.sequelize,
      );

    const incidentZone = await getIncidentZoneWithResolvedTime(
      incidentZoneParams,
      this.sequelize,
    );

    const getResolvedTimeForNullZones =
      await getIncidentResolvedTimeWithNullZones(event_id, this.sequelize);

    incidentZone.push({
      name: 'Field Location Logged',
      resolved_avg_time:
        getResolvedTimeForNullZones['Field Location Logged'][
          'avg_resolved_time'
        ],
      incidents_count:
        getResolvedTimeForNullZones['Field Location Logged']['incident_count'],
    });

    // Api call to lambda for getting pdf
    const response = await getReportsFromLambda(
      req.headers.authorization || '',
      this.httpService,
      {
        incidentTypes,
        incidentDivisions,
        incidentZone: incidentZone.sort(
          (a, b) => b.incidents_count - a.incidents_count,
        ),
        image_url,
        event,
      },
      CsvOrPdf.PDF,
      PdfTypes.INCIDENT_DASHBOARD_REPORT,
    );

    return res.send(response.data);
  }

  async cloneIncidentSetupModule(
    user: User,
    cloneDto: CloneDto,
  ): Promise<void> {
    const { current_event_id, clone_event_id } = cloneDto;

    await checkEventOfSameCompany(user, clone_event_id, current_event_id);

    await this.incidentDivisionService.cloneIncidentDivision(user, cloneDto);
    await this.incidentZones.cloneAllIncidentLocation({
      ...cloneDto,
      copy_all_zones: true,
      copy_camera_zones: true,
      copy_main_zones: true,
      copy_sub_zone: true,
    });
    await this.referenceMapService.cloneReferenceMap(user, cloneDto);
    await this.sourceService.cloneEventSource(cloneDto);
    await this.incidentTypes.cloneEventIncidentTypes(cloneDto);
    await cloneDepartments(cloneDto);

    const alertPriorityGuide = {
      ...cloneDto,
      alertable_type: AlertableType.PRIORITY_GUIDE,
    };

    const alertIncidentType = {
      ...cloneDto,
      alertable_type: AlertableType.INCIDENT_TYPE,
    };

    await this.alertsService.cloneAlerts(user, alertPriorityGuide);
    await this.alertsService.cloneAlerts(user, alertIncidentType);
  }

  async createComment(
    user: User,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const { text, incident_id } = createCommentDto;

    const incident = await isIncidentExist(incident_id, user);

    const { event_id } = incident;

    const [, divisionLockService] = await withCompanyScope(user, event_id);

    const createdComment = await this.communicationService.communication(
      {
        text,
        event_id: event_id,
        commentable_type: CommentableTypes.INCIDENT,
        commentable_id: incident_id,
      },
      'create-comment',
      user,
    );

    await Incident.update(
      { has_comment: true },
      { where: { id: incident_id } },
    );

    await updateUserCommentStatus(user.id, incident_id, this.sequelize);

    const updatedIncident = await this.getIncidentById(
      incident.id,
      event_id,
      user,
      false,
      { useMaster: true },
    );

    withTryCatch(
      () =>
        sendIncidentUpdate(
          updatedIncident,
          event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        ),
      'IncidentService',
      'createComment',
    );

    await Comment.sendIncidentCommentPushNotification(
      createdComment,
      this.communicationService,
    );

    return createdComment;
  }

  async dispatchStaff(
    currentUser: User,
    dispatchIncidentDto: DispatchIncidentDto,
  ): Promise<{ message: string }> {
    const { event_id, incident_id, department_staff } = dispatchIncidentDto;
    const alreadyDispatchedUsers: number[] = [];

    const [, divisionLockService] = await withCompanyScope(
      currentUser,
      event_id,
    );

    const incident: Incident = await isIncidentExist(
      incident_id,
      currentUser,
      undefined,
      true,
    );

    const users = await checkDepartmentStaffExist(department_staff);

    const transaction = await this.sequelize.transaction();

    try {
      for (const departmentStaff of department_staff) {
        const { user_id, department_id } = departmentStaff;

        const [, isCreated] = await IncidentDepartmentUsers.findOrCreate({
          where: {
            department_id,
            user_id,
            incident_id,
          },
          transaction,
          useMaster: true,
        });

        if (!isCreated) {
          alreadyDispatchedUsers.push(user_id);
        }
        // Create scan
        const [scan, created] = await Scan.findOrCreate({
          where: {
            user_id,
            department_id,
            incident_id,
            event_id,
            scan_type: ScanTypeNumber.DISPATCHED,
          },
          defaults: {
            created_by: currentUser.id,
          },
          transaction,
          useMaster: true,
        });

        // If the record was found and `created_by` is not set, update it
        if (!created && !scan.created_by) {
          await scan.update({ created_by: currentUser.id }, { transaction });
        }
      }
      if (
        (incident.status as unknown as string) ==
        humanizeTitleCase(StatusFilter.OPEN)
      ) {
        await Incident.update({ status: IncidentStatusType.DISPATCHED }, {
          where: { id: incident_id },
          individualHooks: true,
          hook_triggered: false,
          transaction,
          editor: { editor_id: currentUser.id, editor_name: currentUser.name },
        } as UpdateOptions & { editor: Editor });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    const filteredDepartmentStaff = department_staff.filter(
      (depStaff) => !alreadyDispatchedUsers.includes(depStaff.user_id),
    );

    withTryCatch(async () => {
      if (filteredDepartmentStaff.length) {
        const { messageBody, userNumbers, notificationBody } =
          await formatDispatchMessageWithUsers(
            event_id,
            incident,
            filteredDepartmentStaff.map(({ user_id }) => user_id),
          );

        const event = await Event.findByPk(event_id, {
          attributes: ['name', 'company_id', 'incident_future_v2'],
          useMaster: true,
        });

        if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

        const onlyCells: string[] = userNumbers.map(
          (item) => item.onlyCells as string,
        );

        const _notificationBody = pushNotificationJsonFormater(
          onlyCells,
          notificationBody,
          'ONTRACK DISPATCH\nASSIGNED INCIDENT FROM',
          {
            messageBody,
            event_id,
            incident,
            company_id: event.company_id,
            incident_id: incident.id,
            type: 'incident',
            incident_v2: event['incident_future_v2'],
          },
          event,
          IosInterruptionLevel.CRITICAL,
        );

        await sendPushNotificationAndSMS(
          messageBody,
          _notificationBody,
          userNumbers,
          this.communicationService,
          MessageableType.INCIDENT,
        );
      }
    }, 'IncidentService');

    withTryCatch(async () => {
      for (const departmentStaff of filteredDepartmentStaff) {
        const { user_id, department_id } = departmentStaff;

        const user: User = users.find((user) => {
          return user.id === user_id;
        }) as User;

        await createChangelogForDispatchStaff(
          currentUser,
          incident_id,
          department_id,
          event_id,
          user,
          this.changeLogService,
        );
      }
    }, 'IncidentService');

    withTryCatch(
      async () => {
        sendDispatchLogUpdate(
          incident_id,
          users
            .map((user) => user.id)
            .filter((id) => !alreadyDispatchedUsers.includes(id)),
          event_id,
          this.pusherService,
          true,
        );
      },
      'IncidentService',
      'sendDispatchLogUpdate',
    );

    //Socket for incident dashboard
    withTryCatch(
      async () => {
        sendIncidentsDashboardOverviewUpdate(
          event_id,
          this.pusherService,
          await this.getIncidentOverviewStats(currentUser, {
            event_id,
          } as IncidentOverviewStatsQueryParamsDto),
        );
      },
      'IncidentService',
      'sendIncidentsDashboardOverviewUpdate',
    );

    withTryCatch(
      async () => {
        const updatedIncident = await this.getIncidentById(
          incident_id,
          event_id,
          currentUser,
        );

        sendIncidentUpdate(
          updatedIncident,
          event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        );
      },
      'IncidentService',
      'sendIncidentUpdate',
    );

    withTryCatch(
      async () => {
        sendDispatchedStaffData(
          users
            .map((user) => user.id)
            .filter((id) => !alreadyDispatchedUsers.includes(id)),
          event_id,
          this.pusherService,
        );
      },
      'IncidentService',
      'sendDispatchedStaffData',
    );

    return { message: 'Staff Has Been Dispatched Successfully' };
  }

  async uploadIncident(
    uploadIncidentDto: UploadIncidentDto,
    currentUser: User,
  ): Promise<
    | {
        message: string;
      }
    | undefined
  > {
    const { event_id, incidents } = uploadIncidentDto;
    const [companyId, divisionLockService] = await withCompanyScope(
      currentUser,
      event_id,
    );

    const incidentsData = [];

    const { incidentTypes, incidentZones } = await uploadIncidentsValidations(
      incidents,
      companyId,
      event_id,
    );

    const transaction = await this.sequelize.transaction();

    try {
      for (const incident of incidents) {
        // Fetch the IncidentZone for the given incident's zone ID
        const incidentZone = incidentZones.find(
          (incidentZone) => incidentZone.id == incident.incident_zone_id,
        );

        // If the incident zone is not found, handle the error appropriately
        if (!incidentZone) {
          throw new Error(
            `Incident Zone not found for id: ${incident.incident_zone_id}`,
          );
        }

        // Extract latitude and longitude from the fetched incident zone
        const { latitude, longitude } = incidentZone;

        // Prepare the incident data
        const newIncidentData = {
          ...incident,
          status:
            IncidentStatusType[
              incident.status.toUpperCase() as keyof typeof IncidentStatusType
            ],
          priority:
            Priority[incident.priority.toUpperCase() as keyof typeof Priority],
          incident_type: incidentTypes.find(
            (incidentType) => incidentType.id === incident.incident_type_id,
          )?.name,
          incident_multiple_division: incident.incident_division_ids?.map(
            (incident_division_id) => ({ incident_division_id }),
          ),
          location: [
            // Associating location data directly
            {
              locationable_type: PolymorphicType.INCIDENT,
              longitude,
              latitude,
            },
          ],
          event_id,
          company_id: companyId,
          created_by: currentUser.id,
          created_by_type: PolymorphicType.USER,
          updated_by: currentUser.id,
          updated_by_type: PolymorphicType.USER,
          source_type: SourceTypeNumber.FE,
          logged_date_time:
            incident.logged_date_time ||
            moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        };

        // Push the prepared incident data to the incidents array
        incidentsData.push(newIncidentData);
      }

      if (incidentsData.length > 250) {
        this.queueService.uploadCSVInitiator(
          uploadIncidentDto,
          incidentsData,
          event_id,
          currentUser,
          divisionLockService,
        );
        return {
          message:
            "Processing your CSV with over 250 rows. We'll notify you when it's ready.",
        };
      }
      return await uploadIncidentCompiler(
        uploadIncidentDto,
        this.pusherService,
        incidentsData,
        event_id,
        currentUser,
        transaction,
      );
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }
  }

  async markCommentRead(
    user: User,
    markCommentRead: MarkCommentRead,
  ): Promise<Incident> {
    const { incident_id, event_id } = markCommentRead;

    await withCompanyScope(user, event_id);

    await updateUserCommentStatus(user.id, incident_id, this.sequelize);

    const incident = await this.getIncidentById(
      incident_id,
      event_id,
      user,
      false,
      {
        useMaster: true,
      },
    );

    withTryCatch(
      () =>
        sendIncidentUpdate(
          incident,
          event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
        ),
      'IncidentService',
      'markCommentRead',
    );

    return incident;
  }

  async createImage(
    user: User,
    createImageDto: CreateImageDto,
  ): Promise<Image> {
    const { incident_id, url, name } = createImageDto;

    const { event_id } = await isIncidentExist(incident_id, user);
    const [, divisionLockService] = await withCompanyScope(user, event_id);

    const image = await this.imageService.createImage(
      incident_id,
      PolymorphicType.INCIDENT,
      url,
      name,
      user.id,
      event_id,
    );

    if (image) {
      await Incident.update(
        { has_image: true },
        { where: { id: incident_id } },
      );

      const updatedIncident = await this.getIncidentById(
        incident_id,
        event_id,
        user,
        false,
        { useMaster: true },
      );

      withTryCatch(
        () => {
          sendIncidentUpdate(
            updatedIncident,
            event_id,
            false, // isNew flag
            this.pusherService,
            false, // isUpload flag
            divisionLockService,
          );
        },
        'createImage',
        'sendIncidentUpdate',
      );

      await Image.sendIncidentImagePushNotification(
        image,
        this.communicationService,
      );
    }

    return image;
  }

  async getIncidentOverviewStats(
    user: User,
    incidentOverviewStatsQueryParamsDto: IncidentOverviewStatsQueryParamsDto,
    options?: Options,
  ): Promise<{
    counts: {
      incidentCounts: number;
    };
    data: IncidentDashboardStats;
  }> {
    const { event_id, incident_division_ids, department_ids } =
      incidentOverviewStatsQueryParamsDto;
    let reporterIds!: number[];

    const [, , timezone] = await withCompanyScope(user, event_id);

    if (department_ids) {
      reporterIds = getQueryListParam(department_ids);
    }

    const incidents = (await Incident.findAll({
      where: await incidentDashboardStatsWhereQuery(
        incidentOverviewStatsQueryParamsDto,
      ),
      attributes: [
        [
          Sequelize.fn(
            'EXTRACT',
            Sequelize.literal(
              `HOUR FROM "Incident"."logged_date_time" AT TIME ZONE 'UTC' AT TIME ZONE '${timezone}'`,
            ),
          ),
          'hour',
        ],
        [Incident.getPriorityNameByKeyNewMapping, 'priority'],
        [Incident.getDashboardStatusNameByKey, 'status'],
        [
          Sequelize.cast(
            Sequelize.fn(
              'COUNT',
              Sequelize.literal('DISTINCT "Incident"."id"'),
            ),
            'integer',
          ),
          'incidentCounts',
        ],
      ],
      include: [
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: [],
          include: [
            { model: Department, through: { attributes: [] }, attributes: [] },
          ],
        },
        {
          model: IncidentDivision,
          as: 'incident_divisions',
          through: { attributes: [] },
          attributes: [],
          required: !!incident_division_ids?.length,
        },
        {
          model: ResolvedIncidentNote,
          attributes: [],
          required: false,
        },
        ...(reporterIds?.length
          ? [
              {
                model: Department,
                as: 'reporter',
                attributes: [],
                where: { id: { [Op.in]: reporterIds } },
              },
            ]
          : []),
      ],
      group: [
        'hour',
        `"Incident"."status"`,
        'priority',
        `"Incident"."created_at"`,
      ],
      order: ['hour'],
      raw: true,
      ...options,
    })) as (Incident & { incidentCounts: number })[];

    const totalIncidentCount: number = incidents.reduce(
      (total: number, incident) => total + incident['incidentCounts'],
      0,
    );

    return {
      counts: { incidentCounts: totalIncidentCount || 0 },
      data: incidentDashboardStats(incidents as unknown as IncidentDashboard[]),
    };
  }

  async getIncidentOverviewStatsMobile(
    user: User,
    incidentOverviewStatsQueryParamsDto: IncidentOverviewStatsQueryParamsDto,
    authorization?: string,
  ): Promise<Incident | undefined> {
    const { event_id } = incidentOverviewStatsQueryParamsDto;

    await withCompanyScope(user, event_id);

    const queryParams = mobileOverviewApiQueryParams(
      incidentOverviewStatsQueryParamsDto,
    );

    try {
      const res = await axios.get(
        `https://api-${this.configService.get(
          'ENV',
        )}.ontracktechgroup.com/api/incidents/daily_incidents_overview_stats?${queryParams.toString()}`, // Append query string
        {
          headers: {
            Authorization: authorization?.split(' ')[1], // Include the token
          },
        },
      );
      return res.data as Incident;
    } catch (err) {
      throwCatchError(err);
    }
  }

  async getIncidentModuleCounts(
    event_id: number,
    options?: Options,
  ): Promise<{
    incidentSourceCount: number;
    incidentTypesCount: number;
    incidentZoneCount: number;
    incidentSubZoneCount: number;
  }> {
    const { company_id } = await isEventExist(event_id);

    const incidentSourceCount = await Source.count({
      where: { company_id },
      ...options,
    });

    const incidentTypesCount = await IncidentType.count({
      where: { company_id },
      ...options,
    });

    const incidentZoneCount = await IncidentZone.count({
      where: {
        event_id,
        parent_id: {
          [Op.eq]: null,
        },
      },
      ...options,
    });

    const incidentSubZoneCount = await IncidentZone.count({
      where: {
        event_id,
        parent_id: {
          [Op.not]: null,
        },
      },
      ...options,
    });

    return {
      incidentSourceCount,
      incidentTypesCount,
      incidentZoneCount,
      incidentSubZoneCount,
    };
  }

  async getAllEventNames(
    eventNameQuery: EventNamesQueryParams,
    user: User,
  ): Promise<{
    data: Event[];
    pagination: PaginationInterface;
  }> {
    const { page, page_size, keyword, company_id } = eventNameQuery;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const event = await Event.findAndCountAll({
      where: await getEventNameSearch(keyword, company_id),
      attributes: ['id', 'name'],
      include: !isUpperRoles(getUserRole(user))
        ? [EventUserModel(user.id)]
        : [],
      limit: _page_size || undefined,
      offset: _page_size && _page ? _page_size * _page : undefined,
      order: [['createdAt', SortBy.DESC]],
      subQuery: false,
    });

    const { rows, count } = event;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size || 0, _page || 0),
    };
  }

  async getDashboardPdf(
    dashboardPdfDto: DashboardPdfDto,
    user: User,
    req: Request,
    res: Response,
  ): Promise<Response> {
    const { event_id, image_url } = dashboardPdfDto;

    const event = await getEventForPdfs(event_id, this.sequelize);

    // Extract the year from the event or use the current year
    const year = new Date().getFullYear().toString();

    // Construct the file name in the desired format
    const file_name = `${event.name}-${year}-IncidentOverview`;

    const [company_id] = await withCompanyScope(user, event_id);

    const graphData: GraphDataInterface = await this.getIncidentOverviewStats(
      user,
      {
        event_id,
      } as IncidentOverviewStatsQueryParamsDto,
    );

    const { incidentDivisions, incidentTypes, incidentZones } =
      await getTypesZonesDivisionsOverviewPdf(
        event_id,
        company_id,
        this.sequelize,
      );

    return await generatePdfForDashboard({
      graphData,
      event,
      incidentTypes,
      incidentZones,
      incidentDivisions,
      filename: file_name,
      imageUrl: image_url,
      req,
      res,
      httpService: this.httpService,
    });
  }

  async getAllIncidents(
    incidentQueryParamsDto: IncidentQueryParamsDto,
    user: User,
  ): Promise<{
    data: Incident[];
    pagination: PaginationInterface;
  }> {
    // Destructure query parameters from the DTO
    const {
      page,
      page_size,
      event_id,
      incident_division_ids,
      incident_division_id,
      priorities,
      incident_id,
      division_not_available,
      multiple_divisions_filter,
    } = incidentQueryParamsDto;

    // Process the query parameters
    let incidentDivisionIds!: number[];
    let linkedIncidentIds!: number[];
    let availableDivisionIds!: number[];
    let unAvailableDivisionIds!: number[];

    const _priorities = getQueryListParam(priorities);

    // Set default values for pagination
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    // Retrieve the company ID with the given user and event context
    const [company_id] = await withCompanyScope(user, event_id);

    // Additional Params for Multiple Divisions
    if (incident_division_ids || incident_division_id) {
      incidentDivisionIds = getQueryListParam(
        incident_division_ids || incident_division_id,
      );
    }

    // for iOS API
    if (multiple_divisions_filter) {
      incidentDivisionIds = csvToArrayParser(
        multiple_divisions_filter,
      ) as number[];
    }

    // Fetch available division IDs if incidentDivisionIds is provided
    if (incidentDivisionIds) {
      availableDivisionIds =
        await availableDivisionIncidentIds(incidentDivisionIds);
    }

    // Fetch unavailable division IDs if division_not_available is true
    if (division_not_available) {
      unAvailableDivisionIds = await unAvailableDivisionIncidentIds(event_id);
    }

    // Retrieve incidents ids for pagination matching the query parameters
    const incidentsIds = await Incident.findAll({
      attributes: ['id'],
      where: await getIncidentWhereQuery(
        incidentQueryParamsDto,
        company_id,
        user,
        _priorities,
        false,
        availableDivisionIds,
        unAvailableDivisionIds,
        false,
        incidentDivisionIds,
      ),
      include: getIncidentsIncludeForIds(
        incidentDivisionIds,
        division_not_available,
      ),
      subQuery: false,
      order: getIncidentsOrder(incidentQueryParamsDto, true),
      group: [`"Incident"."id"`],
      benchmark: true,
    });

    // Extract plain incident IDs from the query result
    let plainIncidentIds = incidentsIds
      .map((incident) => incident.get({ plain: true }))
      .map(({ id }) => id);

    // Handle linked incidents if incident_id is provided
    if (incident_id) {
      const linkedIncidents = await this.getAllLinkedIncidents(
        incident_id,
        event_id,
        user,
      );

      linkedIncidentIds = linkedIncidents.map((data) => data.id);
      linkedIncidentIds.push(incident_id);

      plainIncidentIds = plainIncidentIds.filter(
        (id) => !linkedIncidentIds.includes(id),
      );
    }

    // Calculate the offset for pagination
    const array_offset = _page && _page_size ? _page * _page_size : 50;

    // Slice the incident IDs based on pagination parameters
    const filteredIncidentIds = plainIncidentIds
      .map((incident) => incident)
      .slice(array_offset, array_offset + (_page_size || 1));

    // Fetch detailed incidents data based on the filtered incident IDs
    const incidents = await Incident.findAll({
      where: { id: { [Op.in]: filteredIncidentIds } },
      attributes: [
        ...incidentCommonAttributes,
        ...getAllIncidentsRawQueries(),
        ...divisionLockEditAccess(user),
      ],
      include: getIncidentsListQueryInclude(
        incidentDivisionIds,
        undefined,
        division_not_available,
      ),
      subQuery: false,
      order: getIncidentsOrder(incidentQueryParamsDto),
      benchmark: true,
    });

    // Return the incidents along with pagination details
    return {
      data: incidents,
      pagination: calculatePagination(
        plainIncidentIds?.length || 0,
        _page_size || 50,
        _page || 1,
      ),
    };
  }

  async getAllIncidentsForMap(
    incidentQueryParamsDto: IncidentQueryParamsForMapDto,
    user: User,
  ): Promise<{
    data: Incident[];
  }> {
    // Destructure query parameters from the DTO
    const { event_id } = incidentQueryParamsDto;

    // Retrieve the company ID with the given user and event context
    const [company_id] = await withCompanyScope(user, event_id);

    const incidents = await Incident.findAll({
      where: getIncidentsForMapWhereQuery(event_id, user, company_id),
      attributes: [
        ...incidentCommonAttributes,
        [Sequelize.literal(`"incident_types"."name"`), 'incident_type'],
      ],
      include: getIncidentsListQueryForMapInclude(),
    });

    return {
      data: incidents,
    };
  }

  async getIncidentsCsv(
    incidentQueryParamsDto: IncidentQueryParamsDto,
    user: User,
    req: Request,
    res: Response,
  ): Promise<Response> {
    const { event_id } = incidentQueryParamsDto;

    const [company_id, , timezone] = await withCompanyScope(user, event_id);

    const incidents = await csvDownload(
      incidentQueryParamsDto,
      user,
      company_id,
    );

    return await formatAndGenerateCsv({
      incidents,
      timezone,
      req,
      res,
      httpService: this.httpService,
    });
  }

  async getIncidentsByFilterCommunication(
    incidentQueryParamsDto: IncidentQueryParamsDto,
    user: User,
  ): Promise<Incident[]> {
    const { event_id } = incidentQueryParamsDto;

    const [company_id] = await withCompanyScope(user, event_id);

    const incidents = await csvDownload(
      incidentQueryParamsDto,
      user,
      company_id,
    );

    return incidents;
  }

  async getAllLinkedIncidents(
    id: number,
    event_id: number,
    user: User,
  ): Promise<FormattedIncidentData[]> {
    const [company_id] = await withCompanyScope(user, event_id);
    const _incident = await isIncidentExist(id, user, event_id);

    const _where = isLowerRoleIncludingOperationManager(getUserRole(user))
      ? isWithRestrictedVisibility(getUserRole(user))
        ? divisionlockWithRestrictedVisibility(user.id)
        : divisionRawInclude(user.id)
      : {};

    const incidents = await Incident.findAndCountAll({
      attributes: [...incidentCommonAttributes, 'department_id'],
      where: {
        [Op.or]: [{ id: _incident.parent_id }, { parent_id: id }],
        ..._where,
      },
      include: getIncidentsIncludeForIdsV2(user),
      order: [
        Incident.orderByStatusSequence,
        Sequelize.literal(`"Incident"."created_at" ${SortBy.DESC}`),
      ],
      group: [
        `"Incident"."id"`,
        `"resolved_incident_note"."id"`,
        `"event"."name"`,
        `"legal_group"."id"`,
      ],
      subQuery: false,
      benchmark: true,
    });

    return await serialiserForAllIncident(
      incidents.rows,
      company_id,
      event_id,
      user,
    );
  }

  async getIncidentCounts(
    incidentQueryParamsDto: IncidentQueryParamsDto,
    user: User,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const {
      event_id,
      incident_division_ids,
      priorities,
      division_not_available,
      department_ids,
    } = incidentQueryParamsDto;

    const [company_id] = await withCompanyScope(user, event_id);

    const incidentDivisionIds = getQueryListParam(incident_division_ids);
    let availableDivisionIds!: number[];
    let unAvailableDivisionIds!: number[];
    let reporterIds!: number[];

    const _priorities = getQueryListParam(priorities);

    if (incident_division_ids)
      availableDivisionIds =
        await availableDivisionIncidentIds(incidentDivisionIds);

    if (division_not_available)
      unAvailableDivisionIds = await unAvailableDivisionIncidentIds(event_id);

    if (department_ids) {
      reporterIds = getQueryListParam(department_ids);
    }

    const incidents = await getIncidentCountsByStatusAndPriority(
      incidentQueryParamsDto,
      event_id,
      company_id,
      user,
      _priorities,
      false,
      availableDivisionIds,
      unAvailableDivisionIds,
      true,
      reporterIds,
    );

    const [groupedIncident, incidentIds] =
      transformIncidentCountsData(incidents);

    const resolvedIncidentNoteCounts = await getResolvedIncidentNoteCounts(
      event_id,
      incidentIds,
    );

    return formatIncidentCounts(
      groupedIncident as unknown as IncidentByPriorityAndStatus[],
      resolvedIncidentNoteCounts as ResolvedIncidentNote[],
    );
  }

  async getIncidentCountsMobile(
    incidentCountMobileDto: GetIncidentCountMobileDto,
    user: User,
  ): Promise<{
    total_incident_count: number;
  }> {
    const { event_id, created_or_dispatched_by_current_user, department_ids } =
      incidentCountMobileDto;
    let reporterIds: number[] = [];

    let total_incident_count = 0;
    const countsByStatus: ObjectWithNumbersValue = {};

    const [company_id] = await withCompanyScope(user, event_id);

    if (department_ids) {
      reporterIds = getQueryListParam(department_ids);
    }

    const incidentIds = (
      await Incident.findAll({
        where: await getMobileCountWhere(
          user,
          event_id,
          company_id,
          created_or_dispatched_by_current_user,
        ),
        attributes: ['id'],
        include: [
          {
            model: User,
            as: 'users',
            through: { attributes: [] },
            attributes: [],
          },
          {
            model: Event,
            attributes: [],
          },
          ...(isLowerRoleIncludingOperationManager(getUserRole(user))
            ? [
                {
                  model: IncidentDivision,
                  as: 'incident_divisions',
                  through: { attributes: [] },
                  attributes: [],
                  include: [
                    {
                      model: UserIncidentDivision,
                      attributes: [],
                    },
                  ],
                },
              ]
            : []),
          ...(reporterIds?.length
            ? [
                {
                  model: Department,
                  as: 'reporter',
                  attributes: [],
                  where: { id: { [Op.in]: reporterIds } },
                },
              ]
            : []),
        ],
      })
    ).map((incident) => incident.id);

    const incidentCounts = (await Incident.findAll({
      where: {
        id: { [Op.in]: incidentIds },
      },
      attributes: [
        [Incident.getStatusNameByKey, 'status'],
        [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
      ],
      group: [`"Incident"."status"`],
      raw: true,
    })) as (Incident & { count: number; status: string })[];

    for (const statusCount of incidentCounts) {
      const st = statusCount.status as string;
      countsByStatus[st] = statusCount.count;
      total_incident_count += statusCount.count;
    }

    return {
      ...Object.values(StatusFilter)
        .filter((status) => status !== StatusFilter.ALL)
        .reduce((acc: ObjectWithNumbersValue, status: string) => {
          acc[status] = countsByStatus[status] || 0; // Use count from incidents or default to 0
          return acc;
        }, {}),
      total_incident_count,
    };
  }

  async getIncidentChangelogs(
    id: number,
    incidentChangelogQueryParamsDto: IncidentChangelogQueryParamsDto,
    user: User,
  ): Promise<{
    data: ChangeLog[];
    pagination: PaginationInterface;
  }> {
    const { event_id, page, page_size, order, sort_column } =
      incidentChangelogQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , timezone] = await withCompanyScope(user, event_id);

    await isIncidentExist(id, user);

    const changelogs = await ChangeLog.findAndCountAll({
      where: incidentChangeLogWhere(id, incidentChangelogQueryParamsDto),
      attributes: [
        'column',
        'old_value',
        'new_value',
        [Sequelize.literal(`"formatted_log_text"`), 'text'],
        'parent_changed_at',
        'created_at',
        [commentedByCamper, 'commented_by'],
        'additional_values',
      ],
      order: [[sort_column || 'created_at', order || SortBy.DESC]],
      limit: _page_size,
      offset: _page_size && _page ? _page_size * _page : undefined,
    });

    const { rows, count } = changelogs;

    const translatedChangelogs =
      await this.translateService.translateChangeLogs(
        user,
        rows,
        PolymorphicType.INCIDENT,
        timezone,
      );

    return {
      data: translatedChangelogs as ChangeLog[],
      pagination: calculatePagination(count, _page_size || 50, _page || 1),
    };
  }

  async getIncidentImages(id: number, user: User): Promise<Image[]> {
    const incident = await isIncidentExist(id, user);

    await withCompanyScope(user, incident.event_id);

    const images = await Image.findAll({
      where: { imageable_id: id, imageable_type: PolymorphicType.INCIDENT },
      attributes: [
        'id',
        'name',
        'url',
        'createdAt',
        'thumbnail',
        'capture_at',
        'creator_id',
        [Sequelize.literal(`"created_by"."name"`), 'createdBy'],
      ],
      include: [
        {
          model: User,
          as: 'created_by',
          attributes: [],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
    });

    return images;
  }

  async getIncidentComments(
    id: number,
    paginationDto: PaginationDto,
    user: User,
  ): Promise<{
    data: Comment[];
    pagination: PaginationInterface;
  }> {
    const { page, page_size } = paginationDto;

    const incident = await isIncidentExist(id, user);

    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, incident.event_id);

    // all comments against task
    const data = {
      id,
      page,
      page_size,
      event_id: incident.event_id,
      type: CommentableTypes.INCIDENT,
    };

    return (await this.communicationService.communication(
      data,
      'get-comment-list',
      user,
    )) as {
      data: Comment[];
      pagination: PaginationInterface;
    };
  }

  async getIncidentDispatchLogs(
    id: number,
    getDispatchLogsDto: GetDispatchLogsDto,
    user: User,
  ): Promise<Incident | null> {
    const incident = await isIncidentExist(id, user);

    // Check if user has access to this event or not based on its company or subcompany
    const [company_id] = await withCompanyScope(user, incident.event_id);

    const dispatchLogs = await Incident.findByPk(id, {
      attributes: ['id'],
      include: [
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          where: getDispatchLogsWhere(getDispatchLogsDto),
          required: false,
          attributes: [
            'id',
            'name',
            'first_name',
            'last_name',
            'cell',
            'country_code',
            [
              Sequelize.literal(`"users->users_companies_roles->role"."name"`),
              'role',
            ],
            [Sequelize.literal(User.getStatusByKey), 'status'],
            [
              activeIncidentsCount(id, incident.event_id),
              'activeIncidentsCount',
            ],
            [incidentScans, 'incident_scans'],
            [
              Sequelize.literal(
                `CAST("users->incident_department_users"."id" AS INTEGER)`,
              ),
              'user_incident_department_id',
            ],
          ],
          include: [
            {
              model: IncidentDepartmentUsers,
              where: { incident_id: id },
              attributes: {
                include: [
                  [
                    Sequelize.literal(
                      `CAST("users->incident_department_users"."id" AS INTEGER)`,
                    ),
                    'id',
                  ],
                ],
              },
            },
            ...userRoleInclude(company_id),
          ],
        },
      ],
    });

    return dispatchLogs;
  }

  async getIncidentById(
    id: number,
    event_id: number,
    user: User,
    exemptEditAccess = false,
    options?: Options,
  ): Promise<Incident> {
    // Check if user has access to this event or not based on its company or subcompany
    const [company_id] = await withCompanyScope(user, event_id);

    const incident = await Incident.findOne({
      attributes: [
        ...incidentCommonAttributes,
        ...getAllIncidentsRawQueries(),
        ...divisionLockEditAccess(user),
        ...hasUnreadComments(`"Incident"."id"`, user.id),
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "comments"
            WHERE "comments"."commentable_id" = "Incident"."id" AND "comments"."commentable_type" = '${PolymorphicType.INCIDENT}'
          )`),
          'comments_count',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "chats" AS c
            INNER JOIN "legal_groups" AS lg ON "lg"."id" = "c"."legal_group_id"
            WHERE "lg"."incident_id" = "Incident"."id"
          )`),
          'legal_logs_count',
        ],
      ],
      where: { id, event_id },
      include: getIncidentsListQueryInclude(undefined, company_id),
      subQuery: false,
      ...options,
    });
    if (!incident) throw new NotFoundException(RESPONSES.notFound('Incident'));

    const incidentPlain = incident.get({ plain: true });

    if (
      !exemptEditAccess &&
      !incidentPlain['hasEditAccess'] &&
      isLowerRoleIncludingOperationManager(getUserRole(user))
    )
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    incident.dataValues['dispatch_department_staff'] = dispatchStaffSerializer({
      users: incident.users.map((user) => user.dataValues),
    } as Incident);

    // calculate resolved_at if status is resolved and status change is created [iOS Request to add resolved_at in socket response]
    if (incidentPlain['status'] === StatusFilter.RESOLVED) {
      const statusChange = await StatusChange.findOne({
        attributes: ['createdAt'],
        where: {
          status_changeable_id: id,
          status_changeable_type: PolymorphicType.INCIDENT,
          status: StatusFilter.RESOLVED,
        },
        order: [['createdAt', 'DESC']],
      });

      incident.dataValues['resolved_at'] = statusChange?.createdAt;
    }

    return incident;
  }

  async getIncidentByIdiOS(
    id: number,
    event_id: number,
    user: User,
    authorization?: string,
  ): Promise<Incident | undefined> {
    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, event_id);

    const incident = await Incident.findOne({
      attributes: ['id'],
      where: { id, event_id },
    });
    if (!incident) throw new NotFoundException(RESPONSES.notFound('Incident'));

    try {
      const res = await axios.get(
        `https://api-${this.configService.get(
          'ENV',
        )}.ontracktechgroup.com/api/incidents/${id}?event_id=${event_id}`,
        {
          headers: {
            Authorization: authorization?.split(' ')[1], // Include the token
          },
        },
      );
      return res.data as Incident;
    } catch (e) {
      throwCatchError(e);
      return;
    }
  }

  async linkIncidents(
    linkIncidentDto: LinkIncidentDto,
    user: User,
  ): Promise<{
    message: string;
  }> {
    const { incident_id, link_incident_ids, resolve, event_id } =
      linkIncidentDto;

    await isIncidentExist(incident_id, user);

    const linkedIncidents = await Incident.findAll({
      where: {
        id: { [Op.in]: link_incident_ids },
        event_id,
      },
      attributes: ['id', 'parent_id'],
    });

    if (linkedIncidents.map((i) => i.id).includes(incident_id))
      throw new BadRequestException(_ERRORS.INCIDENT_LINK_ITSELF);

    if (linkedIncidents.length !== link_incident_ids.length)
      throw new NotFoundException(_ERRORS.SOME_OF_INCIDENTS_ARE_NOT_FOUND);

    if (
      linkedIncidents.length !==
      linkedIncidents.filter((i) => !i.parent_id).length
    ) {
      throw new NotFoundException(_ERRORS.SOME_OF_INCIDENTS_ARE_ALREADY_LINKED);
    }

    const updateData: LinkIncidentData = {
      parent_id: incident_id,
    };

    if (resolve) {
      updateData.status = 2; //2 status is resloved
    }

    await Incident.update(updateData, {
      where: {
        id: { [Op.in]: link_incident_ids },
        event_id: event_id,
      },
    });

    sendLinkedIncidentUpdate(
      link_incident_ids,
      incident_id,
      event_id,
      this.pusherService,
      user,
      'linkIncidents',
    );

    if (resolve) {
      //Socket for incident dashboard
      sendIncidentsDashboardOverviewUpdate(
        event_id,
        this.pusherService,
        await this.getIncidentOverviewStats(user, {
          event_id,
        } as IncidentOverviewStatsQueryParamsDto),
      );
    }

    return { message: 'Incident Linked Successfully' };
  }

  async unLinkIncidents(
    unLinkIncidentDto: UnLinkIncidentDto,
    user: User,
  ): Promise<{
    message: string;
  }> {
    const { incident_id, unlink_incident_id, event_id } = unLinkIncidentDto;

    await isIncidentExist(incident_id, user);

    await isIncidentExist(unlink_incident_id, user);

    const incident = await Incident.findOne({
      where: {
        [Op.or]: [
          {
            // Condition 1: link_incident_id has a parent_id of incident_id
            id: unlink_incident_id,
            parent_id: incident_id,
          },
          {
            // Condition 2: incident_id has a parent_id of unlink_incident_id
            id: incident_id,
            parent_id: unlink_incident_id,
          },
        ],
        event_id: event_id,
      },
    });

    if (!incident) throw new NotFoundException(ERRORS.INCIDENT_NOT_FOUND);

    await incident.update({ parent_id: null });

    sendLinkedIncidentUpdate(
      [unlink_incident_id],
      incident_id,
      event_id,
      this.pusherService,
      user,
      'unlinkIncidents',
    );

    return { message: 'Incident UnLinked Successfully' };
  }

  async updateIncident(
    id: number,
    updateIncidentDto: UpdateIncidentDto,
    user: User,
    req: Request,
  ): Promise<UpdateIncidentDto> {
    const {
      event_id,
      status,
      priority,
      incident_division_ids,
      description,
      location_attributes,
      logged_date_time,
      source_id,
      reporter_id,
      incident_zone_id,
      locator_code,
      row,
      seat,
      section,
    } = updateIncidentDto;
    let _priority = priority as unknown as keyof typeof PriorityFilter;
    // Check if user has access to this event or not based on its company or subcompany
    const [, divisionLockService] = await withCompanyScope(user, event_id);

    // checking is incident exist or not
    const incident = await isIncidentExist(id, user, event_id);

    const url = `${this.configService.get('RAILS_BASE_URL')}/incidents/${id}`;

    if (priority === PriorityFilterBothConventionString.MEDIUM) {
      _priority = customPriorityMap[
        PriorityFilter.NORMAL
      ] as unknown as keyof typeof PriorityFilter;
    } else if (priority === PriorityFilterBothConventionString.HIGH) {
      _priority = customPriorityMap[
        PriorityFilter.IMPORTANT
      ] as unknown as keyof typeof PriorityFilter;
    }

    const body = {
      event_id,
      status,
      priority: _priority,
      incident_type: incident['incident_type'],
      incident_division_ids,
      description,
      location_attributes,
      logged_date_time,
      source_id,
      reporter_id,
      incident_zone_id,
      locator_code,
      row,
      seat,
      section,
    };

    await putRequest(
      req.headers.authorization || '',
      this.httpService,
      body,
      url,
    );

    const updatedIncident = await this.getIncidentById(id, event_id, user);

    sendIncidentUpdate(
      updatedIncident,
      event_id,
      false, // isNew flag
      this.pusherService,
      false, // isUpload flag
      divisionLockService,
    );

    //Socket for incident dashboard
    sendIncidentsDashboardOverviewUpdate(
      event_id,
      this.pusherService,
      await this.getIncidentOverviewStats(
        user,
        {
          event_id,
        } as IncidentOverviewStatsQueryParamsDto,
        { useMaster: true },
      ),
    );

    return updateIncidentDto;
  }

  async updateIncidentV1(
    id: number,
    updateIncidentDto: UpdateIncidentDto,
    user: User,
  ): Promise<Incident> {
    const {
      event_id,
      status,
      priority,
      incident_division_ids,
      location_attributes,
      resolved_status,
      note,
      affected_person,
      incident_type_id,
      incident_zone_id,
      images,
    } = updateIncidentDto;

    let incidentDivisionIdsToDelete: number[] = [];
    let createdImages: Image[] = [];

    // Check if user has access to this event or not based on its company or subcompany
    const [companyId, divisionLockService] = await withCompanyScope(
      user,
      event_id,
    );

    const { incident, incidentType } =
      await checkAllValidationsForUpdateAndCreateIncident(
        companyId,
        updateIncidentDto,
        user,
        false,
        id,
      );

    const {
      incident_type_id: oldIncidentTypeId,
      priority: oldPriority,
      incident_zone_id: oldIncidentZoneId,
      // USING "ANY" BECAUSE OF DATA IS TOTALLY A CUSTOM QUERY
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = incident as any;

    const _status =
      status &&
      IncidentStatusType[
        status.toUpperCase() as keyof typeof IncidentStatusType
      ];
    const _priority =
      priority &&
      PriorityFilterBothConventionNumber[
        priority.toUpperCase() as keyof typeof PriorityFilterBothConventionNumber
      ];

    const humanizeNewPriority = priorityMap[_priority];

    const transaction = await this.sequelize.transaction();

    const incidentPayload = {
      ...updateIncidentDto,
      status: _status,
      priority: _priority,
      updated_by_type: 'User',
      updated_by: user.id,
    };

    if (incidentType) {
      incidentPayload['incident_type_id'] = incidentType.id;
    }

    try {
      await Incident.update(incidentPayload, {
        where: { id },
        transaction,
        individualHooks: true,
        hook_triggered: false,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & { editor: Editor });

      if (incident_division_ids) {
        for (const incident_division_id of incident_division_ids) {
          await IncidentMultipleDivision.findOrCreate({
            where: {
              incident_id: id,
              incident_division_id,
            },
            transaction,
          });
        }

        incidentDivisionIdsToDelete = (
          await IncidentMultipleDivision.findAll({
            where: {
              incident_id: id,
              incident_division_id: { [Op.notIn]: incident_division_ids },
            },
            attributes: ['id', 'incident_division_id'],
          })
        ).map((incidentDivisions) => incidentDivisions.incident_division_id);

        if (incidentDivisionIdsToDelete.length) {
          await IncidentMultipleDivision.destroy({
            where: {
              incident_division_id: { [Op.in]: incidentDivisionIdsToDelete },
              incident_id: id,
            },
            transaction,
          });
        }
      }

      if (location_attributes) {
        const [, created] = await Location.findOrCreate({
          where: {
            locationable_id: id,
            locationable_type: PolymorphicType.INCIDENT,
          },
          defaults: {
            longitude: location_attributes.longitude,
            latitude: location_attributes.latitude,
          },
          transaction,
        });

        if (!created) {
          await Location.update(
            {
              longitude: location_attributes.longitude,
              latitude: location_attributes.latitude,
            },
            {
              where: {
                locationable_id: id,
                locationable_type: PolymorphicType.INCIDENT,
              },
              transaction,
            },
          );
        }
      }

      if (incident_zone_id && oldIncidentZoneId !== incident_zone_id) {
        const incidentZone = await isIncidentZoneExist(
          incident_zone_id,
          undefined,
          {
            useMaster: true,
          },
        );

        await Location.update(
          {
            longitude: incidentZone.longitude,
            latitude: incidentZone.latitude,
          },
          {
            where: {
              locationable_id: id,
              locationable_type: PolymorphicType.INCIDENT,
            },
            transaction,
          },
        );
      }

      if (resolved_status) {
        await ResolvedIncidentNote.findOrCreate({
          where: { event_id, incident_id: id },
          defaults: {
            status:
              ResolvedIncidentNoteStatusDb[
                resolved_status.toUpperCase() as keyof typeof ResolvedIncidentNoteStatusDb
              ],
            note,
            affected_person,
          },
          transaction,
        });
        // when some one update the incident status to other status then delete the resolved note
        if (status !== StatusFilter.RESOLVED) {
          await ResolvedIncidentNote.destroy({
            where: { event_id, incident_id: id },
            transaction,
          });
        }
      }

      if (images?.length) {
        createdImages = await this.imageService.createBulkImage(
          images.map((image) => ({
            imageable_id: id,
            imageable_type: PolymorphicType.INCIDENT,
            url: image.url,
            name: extractPlainFileNameFromS3Url(image.url) || '',
            capture_at: image.capture_at,
          })),
          user,
          transaction,
        );

        await Incident.update(
          { has_image: true },
          { where: { id }, transaction },
        );
      }

      if (_status === IncidentStatusType.RESOLVED) {
        await createScanAfterIncidentUpdate(id, event_id, user);
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }

    const updatedIncident = await this.getIncidentById(
      id,
      event_id,
      user,
      true,
      {
        useMaster: true,
      },
    );

    withTryCatch(
      () => {
        sendIncidentUpdate(
          updatedIncident,
          event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        );
      },
      'updateIncidentV1',
      'sendIncidentUpdate',
    );

    //sending incident update against company
    withTryCatch(
      () => {
        sendIncidentLegalUpdate(
          updatedIncident,
          false, // isNew flag
          this.pusherService,
        );
      },
      'updateIncidentV1',
      'sendIncidentUpdate',
    );

    //Socket for incident dashboard
    withTryCatch(
      async () => {
        sendIncidentsDashboardOverviewUpdate(
          event_id,
          this.pusherService,
          await this.getIncidentOverviewStats(
            user,
            {
              event_id,
            } as IncidentOverviewStatsQueryParamsDto,
            { useMaster: true },
          ),
        );
      },
      'updateIncidentV1',
      'sendIncidentsDashboardOverviewUpdate',
    );

    withTryCatch(
      () => {
        sendDashboardListingsUpdates(
          incident_type_id,
          incident_zone_id,
          incident_division_ids,
          event_id,
          companyId,
          this.pusherService,
          this.sequelize,
          oldIncidentTypeId,
          oldIncidentZoneId,
          incidentDivisionIdsToDelete,
        );
      },
      'updateIncidentV1',
      'sendDashboardListingsUpdates',
    );

    withTryCatch(
      () => {
        if (
          humanizeNewPriority &&
          (oldPriority as unknown as string) != humanizeNewPriority
        ) {
          sendAlertEmailAndSmsOnPriorityChange(
            oldPriority as unknown as string,
            event_id,
            humanizeNewPriority,
            updatedIncident,
            this.communicationService,
          );
        }
      },
      'updateIncidentV1',
      'sendAlertEmailAndSmsOnPriorityChange',
    );

    withTryCatch(
      () => {
        if (incident_type_id && oldIncidentTypeId != incident_type_id) {
          sendAlertEmailAndSmsOnIncidentTypeChange(
            event_id,
            incident_type_id,
            updatedIncident,
            this.communicationService,
          );
        }
      },
      'updateIncidentV1',
      'sendAlertEmailAndSmsOnIncidentTypeChange',
    );

    withTryCatch(
      () => {
        this.analyticCommunicationService.analyticCommunication(
          { incident_id: updatedIncident.id, is_new_incident: false },
          'update-incident',
          user,
        );
      },
      'updateIncidentV1',
      'analyticCommunicationService',
    );

    // Sending a push notification to the dispatchers upon attachment upload.
    if (createdImages.length) {
      await Image.sendIncidentImagePushNotification(
        createdImages[0],
        this.communicationService,
      );
    }

    return updatedIncident;
  }

  async updateIncidentLegalStatus(
    id: number,
    updateIncidentLegalStatusDto: UpdateIncidentLegalStatusDto,
    user: User,
  ): Promise<Incident> {
    let legalGroupCreated = false;
    let legalGroup;
    let legalCompanyEmails: string[] = [];
    const { event_id } = updateIncidentLegalStatusDto;

    await isIncidentExist(id, user, event_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [companyId, divisionLockService] = await withCompanyScope(
      user,
      event_id,
    );

    // If any incident is added for review in legal_group
    legalCompanyEmails = await getLegalCompanyContacts(companyId);

    const transaction = await this.sequelize.transaction();

    try {
      // Create or find an existing legal group for this incident
      const [createdLegalGroup, created] = await LegalGroup.findOrCreate({
        where: { incident_id: id },
        defaults: {
          thread_id: uuidv4(),
          company_id: companyId,
          participants: legalCompanyEmails,
        },
        transaction,
      });

      legalGroupCreated = created;
      legalGroup = createdLegalGroup;

      await Incident.update(
        {
          legal_changed_at: Date.now(),
          ...updateIncidentLegalStatusDto,
        },
        {
          where: { id },
          individualHooks: true,
          hook_triggered: false,
          editor: { editor_id: user.id, editor_name: user.name },
          transaction,
        } as UpdateOptions & { editor: Editor },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    if (legalGroup && legalGroupCreated) {
      await sendLegalPrivilegeEmail(
        this.communicationService,
        legalCompanyEmails,
        legalGroup,
      );
    }

    const updatedIncident = await this.getIncidentById(
      id,
      event_id,
      user,
      true,
      {
        useMaster: true,
      },
    );

    // getting company and subcompany ids of current logged in user
    const companyIds = !(user as UserWithCompanyId).is_super_admin
      ? await getSubCompaniesOfGlobalAdmin(user)
      : [];

    // Get the legal count for the company`
    const legalCount = await getIncidentCountsForLegal(companyIds);

    withTryCatch(
      () => {
        sendIncidentUpdate(
          updatedIncident,
          event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        );
      },
      'updateIncidentV1',
      'sendIncidentUpdate',
    );

    //sending incident update against company
    withTryCatch(
      () => {
        sendIncidentLegalUpdate(
          updatedIncident,
          false, // isNew flag
          this.pusherService,
          legalCount,
          true, // legalFlag for notification
        );
      },
      'updateIncidentV1',
      'sendIncidentUpdate',
    );

    return updatedIncident;
  }

  async unlinkDispatchUser(
    removeIncidentDepartmentDto: RemoveIncidentDepartmentDto,
    user: User,
  ): Promise<{
    message: string;
  }> {
    const { incident_id, user_id } = removeIncidentDepartmentDto;

    const { event_id } = await isIncidentExist(incident_id, user);
    const [, divisionLockService] = await withCompanyScope(user, event_id);

    const incidentDepartmentUser = await IncidentDepartmentUsers.findOne({
      where: { user_id, incident_id },
      attributes: ['id', 'user_id', 'department_id'],
    });

    if (!incidentDepartmentUser)
      throw new NotFoundException(RESPONSES.notFound('Dispatched Staff'));

    const unlinkedUserId = incidentDepartmentUser.user_id;

    const transaction = await this.sequelize.transaction();

    const dispatchLogs = (
      await getDispatchLogForUser(incident_id, [unlinkedUserId], event_id)
    )?.get({ plain: true });

    try {
      await incidentDepartmentUser.destroy({ transaction });

      await Incident.update(
        {
          updated_by: user.id,
          updated_by_type: 'User',
        },
        { where: { id: incident_id }, transaction },
      );

      // Remove scans
      await Scan.destroy({
        where: {
          user_id: unlinkedUserId,
          incident_id,
          department_id: incidentDepartmentUser.department_id,
          event_id,
        },
        transaction,
      });

      // TODO: scan hooks

      // send user message for un-linking
      const { country_code, cell, sender_cell, name } =
        await isUserExist(unlinkedUserId);

      // Create changelog
      createChangelogForUnlinkDispatchedStaff(
        user,
        incident_id,
        name,
        this.changeLogService,
      );

      const userNumbers = [{ cell: country_code + cell, sender_cell }];

      const messageBody = `You have been removed from ticket #${incident_id}`;

      // send message to user who is unlinked from incident.

      withTryCatch(
        async () => {
          await this.communicationService.communication(
            {
              messageBody,
              userNumbers,
              messageableType: MessageableType.INCIDENT,
            },
            'send-message',
          );
        },
        'unLinkDispatchUser',
        'sendIncidentUpdate',
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    sendDispatchLogUpdate(
      incident_id,
      [unlinkedUserId],
      event_id,
      this.pusherService,
      false,
      true,
      dispatchLogs,
    );

    const updatedIncident = await this.getIncidentById(
      incident_id,
      event_id,
      user,
      undefined,
      { useMaster: true },
    );

    withTryCatch(
      () => {
        sendIncidentUpdate(
          updatedIncident,
          event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        );
      },
      'unLinkDispatchUser',
      'sendIncidentUpdate',
    );

    return { message: 'Staff Has Been Unlinked Successfully' };
  }

  async removeImage(
    id: number,
    image_id: number,
    user: User,
  ): Promise<{
    message: string;
  }> {
    const { event_id } = await isIncidentExist(id, user);
    const [, divisionLockService] = await withCompanyScope(user, event_id);

    const images = await Image.findAll({
      where: {
        imageable_id: id,
        imageable_type: PolymorphicType.INCIDENT,
      },
      attributes: ['id', 'creator_id'],
    });

    const imageDetails = images.map((image) => ({
      id: image.id,
      creator_id: image.creator_id,
    }));

    const targetImage = imageDetails.find((image) => image.id === image_id);

    if (!targetImage) {
      throw new NotFoundException(RESPONSES.notFound('Image'));
    }

    // Check if user has a restricted role
    const isRestrictedRole = restrictedDeleteImageRolesIncidentModule(
      getUserRole(user),
    );

    // Apply deletion logic based on role restrictions
    if (isRestrictedRole && targetImage.creator_id !== user.id) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    const transaction = await this.sequelize.transaction();

    try {
      // Delete the image
      await Image.destroy({ where: { id: image_id }, transaction });

      // Update the incident's has_image field
      await Incident.update(
        { has_image: imageDetails.length > 1 },
        { where: { id }, transaction },
      );

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }

    const updatedIncident = await this.getIncidentById(
      id,
      event_id,
      user,
      undefined,
      { useMaster: true },
    );

    withTryCatch(
      () => {
        sendIncidentUpdate(
          updatedIncident,
          event_id,
          false, // isNew flag
          this.pusherService,
          false, // isUpload flag
          divisionLockService,
        );
      },
      '',
      'sendIncidentUpdate',
    );

    return { message: RESPONSES.destroyedSuccessfully('Image') };
  }
}
