import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Op, QueryTypes } from 'sequelize';
import NodeGeocoder from 'node-geocoder';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { of } from 'rxjs';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {
  calculatePagination,
  decryptData,
  getPageAndPageSize,
  getPageAndPageSizeWithDefault,
  getQueryListParam,
  getRegionsAndSubRegions,
  getScopeAndCompanyIds,
  isEventExist,
  successInterceptorResponseFormat,
  userRegionsWhere,
} from '@ontrack-tech-group/common/helpers';
import {
  CsvOrPdf,
  DashboardScope,
  ERRORS,
  IncidentStatusDashboardType,
  PdfTypes,
  PinableType,
  Priority,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  PusherService,
  createUserPinsMultiple,
  deleteUserMultiplePins,
  getReportsFromLambda,
  updateUserPinsMultiple,
} from '@ontrack-tech-group/common/services';
import {
  Alert,
  Company,
  CompanyContact,
  Department,
  Event,
  EventContact,
  Incident,
  IncidentDepartmentUsers,
  IncidentDivision,
  IncidentType,
  IncidentZone,
  Location,
  PriorityGuide,
  User,
  UserPins,
  ResolvedIncidentNote,
} from '@ontrack-tech-group/common/models';
import { EventIdsBodyDto } from '@ontrack-tech-group/common/dto';
import { formatIncidentsByPriority, formatTime } from '@Common/helpers';
import {
  DashboardTopFilter,
  IncidentByPriorityAndStatus,
  LINE_CHART_VALUES,
  StatusChangesType,
  StatusCount,
  TEST_INCIDENT_TYPES,
  UpdateIncidentMessage,
} from '@Common/constants';
import {
  CommonFiltersDto,
  ComparisonDto,
  ComparisonEventGraphCsvPdfDto,
  ComparisonEventGraphPdfDto,
  ComparisonEventLineGraphDto,
  ComparisonEventPieGraphDto,
  ComparisonEventsDataDto,
  EventsByStatusQueryDto,
  GetLegendDataDto,
  GetMapPointsDto,
  GraphComparisonDto,
  IncidentListDto,
  IncidentWebhookDto,
  IncidentsByTypeDto,
  IncidentsByTypeMobileDto,
  LiveEventListingDto,
  PinDashboardEventDto,
  PinnedEventDataDto,
  PinnedEventsIncidentsDto,
  WebhookResolvedIncidentNoteDto,
} from './dto';
import {
  checkAllEventIds,
  checkCompanyOrEventId,
  checkEventId,
  checkEventIds,
  eventActiveModulesAttributes,
  formatStatusCount,
  generateCsvOrPdfForIncidentListing,
  getAlertsInclude,
  getCityOrCountryByEventLocation,
  getCompaniesMapPoints,
  getCompaniesMapPointsHelper,
  getCompanyCommonAttributes,
  getCsvForComparison,
  getEventAndCompanyWhere,
  getEventByStatusQuery,
  getEventInclude,
  getEventPins,
  getEventPinsWhere,
  getEventPinsWithOrder,
  getEventStatusWhere,
  getEventsByStatusWhere,
  getIncidentListWhere,
  getIncidentTypeInclude,
  getMapIncidentList,
  getMapPointEventsWhere,
  getParentIds,
  getPriorityCountAttributes,
  getResolvedIncidentNoteByIdHelper,
  getStatusFormat,
  getSubcompaniesCountWhere,
  getSubcompanyIds,
  getTotalListingCountsByTypes,
  getUniqueCompanyIdsAgainstPinnedEvents,
  liveEventsWhere,
  pinnedEventIncidentsAttributes,
  pinnedEventIncidentsOrder,
  pinnedEventsIncidentsWhere,
  singleEventAttributes,
  getIncidentIdsForGraphs,
  formatIncidentsByPriorityCount,
  getUniqueCompanyIdsAgainstEventIds,
  comparisonLineGraphEventsIncidentsWhere,
  getFormattedIncidentsDataForCsv,
  getFiltersForGraphs,
  getLabelForChart,
  sendIncidentCountUpdate,
} from './helper';

@Injectable()
export class DashboardService {
  private geocoder: NodeGeocoder;

  constructor(
    private readonly httpService: HttpService,
    private readonly pusherService: PusherService,
    private readonly configService: ConfigService,
    private readonly sequelize: Sequelize,
    @InjectModel(Company)
    private readonly company: typeof Company,
    @InjectModel(Event)
    private readonly event: typeof Event,
    @InjectModel(Incident)
    private readonly incident: typeof Incident,
    @InjectModel(CompanyContact)
    private readonly companyContact: typeof CompanyContact,
    @InjectModel(IncidentType)
    private readonly incidentType: typeof IncidentType,
    @InjectModel(Alert)
    private readonly alert: typeof Alert,
    @InjectModel(EventContact)
    private readonly eventContact: typeof EventContact,
    @InjectModel(User)
    private readonly user: typeof User,
    @InjectModel(PriorityGuide)
    private readonly priorityGuide: typeof PriorityGuide,
    @InjectModel(Location)
    private readonly location: typeof Location,
    @InjectModel(UserPins)
    private readonly userPins: typeof UserPins,
    @InjectModel(IncidentDivision)
    private readonly incidentDivision: typeof IncidentDivision,
    @InjectModel(Department)
    private readonly department: typeof Department,
    @InjectModel(IncidentZone)
    private readonly incidentZone: typeof IncidentZone,
    @InjectModel(IncidentDepartmentUsers)
    private readonly incidentDepartmentUsers: typeof IncidentDepartmentUsers,
    @InjectModel(ResolvedIncidentNote)
    private readonly resolvedIncidentNote: typeof ResolvedIncidentNote,
  ) {
    // using NodeGeocoder for extracting City, State, Country from Whole Location string
    const options: NodeGeocoder.Options = {
      provider: 'google',
      apiKey: this.configService.get('GOOGLE_MAPS_API_KEY'),
      formatter: null,
    };
    this.geocoder = NodeGeocoder(options);
  }

  async isIncidentCreateOrUpdate(incidentWebhookDto: IncidentWebhookDto) {
    try {
      const { incident_id, is_new_incident } = incidentWebhookDto;

      if (incident_id) {
        const incident = await this.incident.findOne({
          where: { id: incident_id },
          attributes: [
            'id',
            'incident_type',
            'company_id',
            'event_id',
            [this.incident.getDashboardStatusNameByKey, 'status'],
            [this.incident.getDashboardPriorityNameByKey, 'priority'],
            [Sequelize.literal('location.latitude'), 'latitude'],
            [Sequelize.literal('location.longitude'), 'longitude'],
            [Sequelize.literal('event.region'), 'event_region'],
            [Sequelize.literal('event.time_zone'), 'time_zone'],
            [Sequelize.literal('company.region'), 'company_region'],
            [
              Sequelize.literal(`DATE_PART('year', "Incident"."created_at")`),
              'year',
            ],
          ],
          include: [
            await getEventInclude(this.event, undefined, undefined, true),
            getIncidentTypeInclude(this.incidentType),
            {
              model: this.location,
              attributes: [],
            },
            {
              model: this.company,
              attributes: [],
            },
          ],
        });

        if (incident) {
          incident.dataValues['is_new_incident'] = is_new_incident;

          this.pusherService.sendDashboardIncident(incident);

          this.incidentUpdated({
            body: { eventId: incident.event_id, incidentId: incident_id },
          });

          const pinnedEventData = await this.getPinnedEventData({
            event_id: incident.event_id,
          });

          this.pusherService.sendPinnedEventData(pinnedEventData);
          //pusher for updating count of incident on event listing
          sendIncidentCountUpdate(incident.event_id, this.pusherService);
        }
      }
    } catch (e) {
      console.log(e);
    }

    return { message: 'Success' };
  }

  async companyCreatedOrUpdated(data: { body: string; user: string }) {
    const decryptedBody: {
      companyId: number;
      isNewCompany: boolean;
    } = decryptData(data.body) as unknown as {
      companyId: number;
      isNewCompany: boolean;
    };

    try {
      const { companyId, isNewCompany } = decryptedBody;

      let parentCompany = null;

      const company = await this.company.findOne({
        where: { id: companyId },
        attributes: [
          ...getCompanyCommonAttributes(),
          [Sequelize.literal('"parent"."id"'), 'parent_id'],
        ],
        include: [
          {
            model: this.company,
            as: 'parent',
            attributes: [],
          },
        ],
        group: [`"Company"."id"`, `"parent"."id"`],
      });

      if (isNewCompany && company?.parent_id) {
        parentCompany = await this.company.findOne({
          where: { id: company.parent_id },
          attributes: [...getCompanyCommonAttributes()],
          group: [`"Company"."id"`],
        });
      }

      if (company) {
        this.pusherService.sendCompanyMapPoint(company);
      }
      if (parentCompany) {
        this.pusherService.sendCompanyMapPoint(parentCompany);
      }
    } catch (e) {
      console.log(e);
    }

    return of({ message: 'Success' });
  }

  async eventCreatedOrUpdated(data: { body: string; user: string }) {
    const decryptedBody: {
      eventId: number;
      isNewEvent: boolean;
    } = decryptData(data.body) as unknown as {
      eventId: number;
      isNewEvent: boolean;
    };

    try {
      const { eventId } = decryptedBody;

      const event = await this.event.findOne({
        where: { id: eventId },
        attributes: [
          'id',
          'name',
          'location',
          'region',
          'region_id',
          'event_category',
          [Sequelize.literal('company.id'), 'company_id'],
          [Sequelize.literal('"company->parent"."id"'), 'parent_id'],
          [Sequelize.literal('company.name'), 'company_name'],
          [
            Sequelize.literal(
              `(SELECT count("Incident"."id") AS "count" FROM "incidents" AS "Incident" INNER JOIN "incident_types" AS "i_t" ON "Incident"."incident_type_id"="i_t"."id" 
              WHERE "Incident"."event_id" = ${
                eventId ? eventId : `"Event"."id"`
              }
             )::INTEGER`,
            ),
            'incidents_count',
          ],
          [
            Sequelize.literal(`DATE_PART('year', "Event"."start_date")`),
            'start_year',
          ],
          [
            Sequelize.literal(`DATE_PART('year', "Event"."end_date")`),
            'end_year',
          ],
        ],
        include: [
          {
            model: this.company,
            attributes: [],
            include: [
              {
                model: this.company,
                as: 'parent',
                attributes: [],
              },
            ],
          },
        ],
        group: [
          `"Event"."id"`,
          `"company"."name"`,
          `"company"."id"`,
          '"company->parent"."id"',
        ],
      });

      if (event) {
        this.pusherService.sendEventMapPoint(event);

        const pinnedEventData = await this.getPinnedEventData({
          event_id: event.id,
        });
        this.pusherService.sendPinnedEventData(pinnedEventData);
      }
    } catch (e) {
      console.log(e);
    }

    return of({ message: 'Success' });
  }

  async incidentUpdated(
    data: { body: string; user?: string } | UpdateIncidentMessage,
  ) {
    try {
      let decryptedBody: {
        eventId: number;
        incidentId: number;
      } = null;
      let eventId: number, incidentId: number;

      if (typeof data.body == 'string') {
        decryptedBody = decryptData(data.body) as unknown as {
          eventId: number;
          incidentId: number;
        };
        eventId = decryptedBody.eventId;
        incidentId = decryptedBody.incidentId;
      } else {
        eventId = data.body.eventId;
        incidentId = data.body.incidentId;
      }

      const incident = await this.incident.findOne({
        where: {
          event_id: eventId,
          id: incidentId,
        },
        attributes: [
          ...pinnedEventIncidentsAttributes,
          [this.incident.getStatusNameByKey, 'status'],
          [this.incident.getDashboardPriorityNameByKey, 'priority'],
        ],
        include: [
          getIncidentTypeInclude(this.incidentType),
          await getEventInclude(this.event),
          {
            model: this.department,
            as: 'department',
            attributes: [],
          },
          {
            model: this.incidentZone,
            attributes: [],
          },
          {
            model: this.incidentType,
            attributes: [],
          },
          {
            model: this.incidentDepartmentUsers,
            attributes: [],
            order: [['id', 'DESC']],
            include: [
              {
                model: this.user,
                attributes: [],
              },
            ],
          },
          {
            model: this.resolvedIncidentNote,
            attributes: {
              exclude: ['createdAt', 'updatedAt'],
              include: [
                [
                  Sequelize.cast(
                    Sequelize.col('resolved_incident_note.id'),
                    'integer',
                  ),
                  'id',
                ],
                [ResolvedIncidentNote.getStatusNameByKeyInclude, 'status'],
              ],
            },
          },
          {
            model: this.incidentDivision,
            as: 'incident_divisions',
            through: { attributes: [] },
            attributes: [
              [
                Sequelize.cast(
                  Sequelize.col('incident_divisions.id'),
                  'integer',
                ),
                'id',
              ],
              'name',
            ],
          },
        ],
        subQuery: false,
      });

      if (incident) {
        this.pusherService.sendPinnedEventIncidentUpdate(incident);
      }
    } catch (e) {
      console.log(e);
    }

    return of({ message: 'Success' });
  }

  async resolvedIncidentNoteUpdated(data: { body: string; user: string }) {
    const decryptedBody: {
      id: number;
      is_new_resolved_note: boolean;
    } = decryptData(data.body) as unknown as {
      id: number;
      is_new_resolved_note: boolean;
    };

    const { id, is_new_resolved_note } = decryptedBody;

    await this.isResolvedIncidentNoteCreateOrUpdate({
      id,
      is_new_resolved_note,
    });

    return of({ message: 'Success' });
  }

  async isResolvedIncidentNoteCreateOrUpdate(
    webhookResolvedIncidentNoteDto: WebhookResolvedIncidentNoteDto,
  ) {
    const { id } = webhookResolvedIncidentNoteDto;

    try {
      const resolvedIncidentNote = await getResolvedIncidentNoteByIdHelper(id);

      if (resolvedIncidentNote) {
        this.incidentUpdated({
          body: {
            eventId: resolvedIncidentNote.event_id,
            incidentId: resolvedIncidentNote.incident_id,
          },
        });
      }
    } catch (e) {
      console.log(e);
    }

    return { message: 'Success' };
  }

  async getAllComparisonEventsData(
    comparisonEventsDataDto: ComparisonEventsDataDto,
    user: User,
  ) {
    const { event_ids } = comparisonEventsDataDto;
    const { companyIds } = await getScopeAndCompanyIds(user);

    await checkEventIds(companyIds, user, event_ids);

    const result = await this.sequelize.query(
      `SELECT * FROM get_graph_comparison_events_data(VARIADIC ARRAY[${[
        event_ids,
      ]}])`,
      {
        type: QueryTypes.SELECT,
      },
    );

    const response: any[] = result[0]['get_graph_comparison_events_data'];

    return response.map((eventData: any) => ({
      incidentsByType: eventData.incidentsbytype || [],
      totalIncidents: eventData.totalincidents,
      criticalIncidents: eventData.criticalincidents,
      singleEvent: eventData.singleevent,
    }));
  }

  async getComparisonEventsIncidentsGraph(
    comparisonEventLineGraphDto: ComparisonEventLineGraphDto,
    user: User,
  ) {
    const { event_ids, day = null } = comparisonEventLineGraphDto;
    const chartDataSet = [];

    const incidents = await getIncidentIdsForGraphs(
      comparisonEventLineGraphDto,
      user,
    );

    if (incidents.length) {
      const result = await this.sequelize.query(
        `SELECT * FROM get_comparison_events_line_graph_all_days_count(${day},ARRAY[${event_ids}], ARRAY[${incidents}])`,
        {
          type: QueryTypes.SELECT,
        },
      );

      const { incidentsByHour, eventsDetail, maxDays } =
        result[0]['get_comparison_events_line_graph_all_days_count'];

      event_ids.forEach((eventId) => {
        chartDataSet.push({
          data: incidentsByHour[`${eventId}`].map((time) => time[1]),
          label: eventsDetail[`${eventId}`].name,
        });
      });

      return { chartDataSet, labels: LINE_CHART_VALUES, maxDays, eventsDetail };
    }

    return [];
  }

  async getComparisonEventsIncidentsGraphPie(
    comparisonEventPieGraphDto: ComparisonEventPieGraphDto,
    user: User,
  ) {
    const incidentIds = await getIncidentIdsForGraphs(
      comparisonEventPieGraphDto,
      user,
    );

    if (incidentIds.length) {
      const incidentsByPriority = await this.incident.findAll({
        where: {
          id: { [Op.in]: incidentIds },
        },
        attributes: [
          [this.incident.getPriorityNameByKey, 'priority'],
          [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
        ],
        group: [`"Incident"."priority"`],
        raw: true,
      });

      return formatIncidentsByPriorityCount(
        incidentsByPriority
          .map((priorityCount) => ({
            [priorityCount['priority']]: priorityCount['count'],
          }))
          .reduce((obj, item) => ({ ...obj, ...item }), {}),
      );
    } else return { low: 0, normal: 0, important: 0, critical: 0 };
  }

  async getComparisonEventsIncidentsCsv(
    comparisonEventGraphCsvPdfDto: ComparisonEventGraphCsvPdfDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { incident_division_ids, incident_type_ids, event_ids } =
      comparisonEventGraphCsvPdfDto;

    const { companyIds } = await getScopeAndCompanyIds(user);
    await checkEventIds(companyIds, user, event_ids);

    const incidentDivisionIds = getQueryListParam(incident_division_ids);
    const incidentTypeIds = getQueryListParam(incident_type_ids);

    const incidents = await this.incident.findAll({
      where: {
        ...comparisonLineGraphEventsIncidentsWhere(
          comparisonEventGraphCsvPdfDto,
          companyIds,
        ),
        event_id: { [Op.in]: event_ids },
      },
      attributes: [
        'id',
        'event_id',
        'created_at',
        'logged_date_time',
        'description',
        [this.incident.getStatusNameByKey, 'status'],
        [this.incident.getDashboardPriorityNameByKey, 'priority'],
        [Sequelize.literal('event.name'), 'event_name'],
        [Sequelize.literal('event.time_zone'), 'time_zone'],
        [Sequelize.literal('incident_zone.name'), 'incident_zone_name'],
        [Sequelize.literal('incident_types.name'), 'incident_type'],
        [
          Sequelize.literal('"incident_department_users->user"."name"'),
          'dispatch_user',
        ],
      ],
      include: [
        getIncidentTypeInclude(this.incidentType),
        await getEventInclude(this.event, user),
        {
          model: this.incidentZone,
          attributes: [],
        },
        {
          model: this.incidentType,
          attributes: [],
          where: incidentTypeIds?.length
            ? { id: { [Op.in]: incidentTypeIds } }
            : {},
        },
        {
          model: this.incidentDepartmentUsers,
          attributes: [],
          order: [['id', 'DESC']],
          include: [
            {
              model: this.user,
              attributes: [],
            },
          ],
        },
        {
          model: this.resolvedIncidentNote,
          attributes: {
            exclude: ['createdAt', 'updatedAt'],
            include: [
              [
                Sequelize.cast(
                  Sequelize.col('resolved_incident_note.id'),
                  'integer',
                ),
                'id',
              ],
              [ResolvedIncidentNote.getStatusNameByKeyInclude, 'status'],
            ],
          },
        },
        {
          model: this.incidentDivision,
          as: 'incident_divisions',
          through: { attributes: [] },
          required: !!incidentDivisionIds?.length,
          where: incidentDivisionIds
            ? Sequelize.literal(
                `"Incident"."id" IN (SELECT "incident_id" FROM "incident_multiple_divisions" WHERE "incident_division_id" IN (${incidentDivisionIds}))`,
              )
            : {},
          attributes: [
            [
              Sequelize.cast(Sequelize.col('incident_divisions.id'), 'integer'),
              'id',
            ],
            'name',
          ],
        },
      ],
      order: [['created_at', SortBy.DESC]],
      subQuery: false,
    });

    const _incidents = incidents.map((incident) =>
      incident.get({ plain: true }),
    );

    // Formatting data for csv
    const formattedIncidentForCsv = getFormattedIncidentsDataForCsv(_incidents);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      this.httpService,
      formattedIncidentForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set(
      'Content-Disposition',
      'attachment; filename="Graph comparison.csv"',
    );

    return res.send(response.data);
  }

  async getComparisonEventsIncidentsPdf(
    comparisonEventGraphPdfDto: ComparisonEventGraphPdfDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_ids, file_name, day } = comparisonEventGraphPdfDto;
    let pieChartData = { low: 0, normal: 0, important: 0, critical: 0 };
    const chartDataSet = [];

    const filters = await getFiltersForGraphs(comparisonEventGraphPdfDto);

    const { companyIds } = await getScopeAndCompanyIds(user);
    await checkEventIds(companyIds, user, event_ids);

    const incidents = await getIncidentIdsForGraphs(
      comparisonEventGraphPdfDto,
      user,
    );

    if (incidents.length) {
      const result = await this.sequelize.query(
        `SELECT * FROM get_comparison_events_line_graph_all_days_count(${day},ARRAY[${event_ids}], ARRAY[${incidents}])`,
        {
          type: QueryTypes.SELECT,
        },
      );

      const { incidentsByHour, eventsDetail } =
        result[0]['get_comparison_events_line_graph_all_days_count'];

      event_ids.forEach((eventId) => {
        chartDataSet.push({
          data: incidentsByHour[`${eventId}`].map((time) => time[1]),
          label: getLabelForChart(eventsDetail[`${eventId}`], day),
        });
      });

      const incidentsByPriority = await this.incident.findAll({
        where: {
          id: { [Op.in]: incidents },
        },
        attributes: [
          [this.incident.getPriorityNameByKey, 'priority'],
          [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
        ],
        group: [`"Incident"."priority"`],
        raw: true,
      });

      pieChartData = formatIncidentsByPriorityCount(
        incidentsByPriority
          .map((priorityCount) => ({
            [priorityCount['priority']]: priorityCount['count'],
          }))
          .reduce((obj, item) => ({ ...obj, ...item }), {}),
      );
    }

    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      this.httpService,
      {
        filters,
        pieChartData,
        chartDataSet,
        labels: LINE_CHART_VALUES,
      },
      CsvOrPdf.PDF,
      PdfTypes.COMPARISON_GRAPH,
      file_name,
    );

    return res.send(successInterceptorResponseFormat(response.data));
  }

  async getDivisionNamesByEventIds(
    eventIdsBodyDto: EventIdsBodyDto,
    user: User,
  ) {
    const { event_ids } = eventIdsBodyDto;

    const companyIds = await getUniqueCompanyIdsAgainstEventIds(
      user,
      this.event,
      event_ids,
    );

    const allDivisionNames = await IncidentDivision.findAll({
      where: { company_id: { [Op.in]: companyIds } },
      attributes: [
        [Sequelize.literal('CAST("IncidentDivision"."id" AS INTEGER)'), 'id'],
        'name',
      ],
      order: [['name', SortBy.ASC]],
    });

    return allDivisionNames;
  }

  async getAllIncidentTypeNamesByEventIds(
    eventIdsBodyDto: EventIdsBodyDto,
    user: User,
  ) {
    const { event_ids } = eventIdsBodyDto;

    const companyIds = await getUniqueCompanyIdsAgainstEventIds(
      user,
      this.event,
      event_ids,
    );

    const incidentTypes = await IncidentType.findAll({
      where: { company_id: { [Op.in]: companyIds } },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      order: [['name', SortBy.ASC]],
    });

    return incidentTypes;
  }

  async findAllDepartmentNamesByEventByEventIds(
    eventIdsBodyDto: EventIdsBodyDto,
    user: User,
  ) {
    const { event_ids } = eventIdsBodyDto;

    const companyIds = await getUniqueCompanyIdsAgainstEventIds(
      user,
      this.event,
      event_ids,
    );

    const departments = await Department.findAll({
      where: { company_id: { [Op.in]: companyIds } },
      attributes: ['id', 'name'],
      order: [['name', SortBy.ASC]],
    });

    return departments;
  }

  async getAllIncidentsByType(
    incidentsByTypeDto: IncidentsByTypeDto,
    user: User,
  ) {
    const {
      page,
      page_size,
      dashboard_top_filter,
      year,
      event_id,
      company_id,
      region_ids,
    } = incidentsByTypeDto;
    let [_page, _page_size] = getPageAndPageSize(page, page_size);

    // TODO DEFAULT PAGINATION THROUGH FUNCTION
    _page = _page || +this.configService.get('PAGE');
    _page_size = _page_size || +this.configService.get('PAGE_LIMIT');

    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    await checkCompanyOrEventId(
      companyIds,
      user,
      year,
      event_id,
      company_id,
      dashboard_top_filter,
      region_ids,
    );

    const incidentsByType = await this.incident.findAll({
      where: await getEventAndCompanyWhere(
        incidentsByTypeDto,
        companyIds,
        scope,
        region_ids,
        user,
      ),
      attributes: [
        'incident_type',
        [Sequelize.literal('COUNT("incident_type")::INTEGER'), 'count'],
      ],
      include: [
        await getEventInclude(this.event, user, region_ids),
        getIncidentTypeInclude(this.incidentType),
      ],
      group: [`"Incident"."incident_type"`],
      order: [['count', SortBy.DESC]],
      limit: _page_size,
      offset: _page_size * _page,
      raw: true,
    });

    // Get total count (without pagination)
    const totalCount = await this.incident.count({
      where: await getEventAndCompanyWhere(
        incidentsByTypeDto,
        companyIds,
        scope,
        region_ids,
        user,
      ),
      include: [
        await getEventInclude(this.event, user, region_ids),
        getIncidentTypeInclude(this.incidentType),
      ],
      distinct: true,
      col: 'incident_type',
    });

    return {
      data: incidentsByType,
      pagination: calculatePagination(totalCount, _page_size, _page),
    };
  }

  async getAllIncidentsByTypeMobile(
    incidentsByTypeMobileDto: IncidentsByTypeMobileDto,
    user: User,
  ) {
    const { dashboard_top_filter, year, event_id, company_id, region_ids } =
      incidentsByTypeMobileDto;

    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    await checkCompanyOrEventId(
      companyIds,
      user,
      year,
      event_id,
      company_id,
      dashboard_top_filter,
      region_ids,
    );

    const incidentsByType = await this.incident.findAll({
      where: await getEventAndCompanyWhere(
        incidentsByTypeMobileDto,
        companyIds,
        scope,
        region_ids,
        user,
      ),
      attributes: [
        'incident_type',
        [Sequelize.literal('COUNT("incident_type")::INTEGER'), 'count'],
      ],
      include: [
        await getEventInclude(this.event, user, region_ids),
        getIncidentTypeInclude(this.incidentType),
      ],
      group: [`"Incident"."incident_type"`],
      order: [['count', SortBy.DESC]],
      limit: 10,
      offset: 0,
      raw: true,
    });

    // getting total Incident counts of Event
    const totalIncidentsOfEvent = await Incident.count({ where: { event_id } });

    // Calculate percentages for each incident type within the top 10
    const incidentsWithPercentage = incidentsByType.map((incident) => ({
      incident_type: incident.incident_type,
      count: incident['count'],
      percentage: Number(
        ((incident['count'] / totalIncidentsOfEvent) * 100).toFixed(2),
      ),
    }));

    const criticalIncidentsByType = await this.incident.findAll({
      where: {
        ...(await getEventAndCompanyWhere(
          incidentsByTypeMobileDto,
          companyIds,
          scope,
          region_ids,
          user,
        )),
        priority: Priority.CRITICAL,
      },
      attributes: [
        'incident_type',
        [Sequelize.literal('COUNT("incident_type")::INTEGER'), 'count'],
      ],
      include: [
        await getEventInclude(this.event, user, region_ids),
        getIncidentTypeInclude(this.incidentType),
      ],
      group: [`"Incident"."incident_type"`],
      order: [['count', SortBy.DESC]],
      raw: true,
    });

    // Calculate total count for critical incident type | getting total Critical Incident counts of Event
    const totalCriticalIncidentsOfEvent = await Incident.count({
      where: { event_id, priority: Priority.CRITICAL },
    });

    // Calculate percentages for each critical incident type
    const criticalIncidentsWithPercentage = criticalIncidentsByType.map(
      (incident) => ({
        incident_type: incident.incident_type,
        count: incident['count'],
        percentage: Number(
          ((incident['count'] / totalCriticalIncidentsOfEvent) * 100).toFixed(
            2,
          ),
        ),
      }),
    );

    return {
      incidentsWithPercentage,
      criticalIncidentsWithPercentage,
    };
  }

  async getAllIncidentsByPriority(
    commonFiltersDto: CommonFiltersDto,
    user: User,
  ) {
    const { dashboard_top_filter, year, event_id, company_id, region_ids } =
      commonFiltersDto;
    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    await checkCompanyOrEventId(
      companyIds,
      user,
      year,
      event_id,
      company_id,
      dashboard_top_filter,
      region_ids,
    );

    const incidentsByPriority = await this.incident.findAll({
      where: {
        ...(await getEventAndCompanyWhere(
          commonFiltersDto,
          companyIds,
          scope,
          region_ids,
          user,
        )),
      },
      attributes: [
        [this.incident.getDashboardStatusNameByKey, 'status'],
        [this.incident.getDashboardPriorityNameByKey, 'priority'],
        [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
      ],
      include: [
        await getEventInclude(this.event, user, region_ids),
        getIncidentTypeInclude(this.incidentType),
      ],
      group: [`"Incident"."status"`, `"Incident"."priority"`],
      order: [['status', SortBy.ASC]],
      raw: true,
    });

    return formatIncidentsByPriority(
      incidentsByPriority as unknown as IncidentByPriorityAndStatus[],
    );
  }

  async getLegendData(getLegendDataDto: GetLegendDataDto, user: User) {
    const { event_id, company_id, dashboard_top_filter, year, region_ids } =
      getLegendDataDto;

    let eventStatusCount = null;
    let singleEvent: Event = null;
    let subcompaniesCount: number = null;
    let parentCompaniesCount: number = null;
    let allEventAttendances = null;
    let totalIncidents = 0;
    let criticalIncidents = 0;
    let avgResolvedTime: any = '00:00:00';

    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    await checkCompanyOrEventId(
      companyIds,
      user,
      year,
      event_id,
      company_id,
      dashboard_top_filter,
      region_ids,
    );

    // We don't need to find total incidents, critical incidents, avg resolved time if no dashboard top filter is applied.
    // Because this data will show on side bar whcih only appears in case of selected top filter.
    if (dashboard_top_filter) {
      totalIncidents = await this.incident.count({
        where: {
          ...(await getEventAndCompanyWhere(
            getLegendDataDto,
            companyIds,
            scope,
            region_ids,
            user,
          )),
        },
        include: [
          await getEventInclude(this.event, user, region_ids),
          getIncidentTypeInclude(this.incidentType),
        ],
      });

      criticalIncidents = await this.incident.count({
        where: {
          ...(await getEventAndCompanyWhere(
            getLegendDataDto,
            companyIds,
            scope,
            region_ids,
            user,
          )),
          priority: Priority.CRITICAL,
        },
        include: [
          await getEventInclude(this.event, user, region_ids),
          getIncidentTypeInclude(this.incidentType),
        ],
      });

      avgResolvedTime = await this.incident.findAll({
        where: {
          ...(await getEventAndCompanyWhere(
            getLegendDataDto,
            companyIds,
            scope,
            region_ids,
            user,
          )),
          status: IncidentStatusDashboardType.RESOLVED,
        },
        attributes: [
          [
            Sequelize.fn(
              'AVG',
              Sequelize.literal(`
             (SELECT
                    CASE
                      WHEN "status_changes"."status" = 'resolved' THEN
                        EXTRACT(EPOCH FROM "status_changes"."created_at" - "Incident"."created_at")
                    END
                  FROM status_changes
                  WHERE "Incident"."id" = "status_changes"."status_changeable_id"
                    AND "status_changes"."status_changeable_type" = '${StatusChangesType.INCIDENT}'
                  ORDER BY "status_changes"."created_at" DESC
                  LIMIT 1)
          `),
            ),
            'avgResolvedTime',
          ],
        ],
        include: [
          await getEventInclude(this.event, user, region_ids),
          getIncidentTypeInclude(this.incidentType),
        ],
        raw: true,
      });
    }

    // if not single event is selected then we need to find status counts for events and there attendances as well.
    if (!event_id) {
      eventStatusCount = await this.event.findAll({
        where: {
          ...(await getEventStatusWhere(
            getLegendDataDto,
            companyIds,
            scope,
            user,
          )),
        },
        attributes: [
          [this.event.getStatusNameByKey, 'status'],
          [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
        ],
        group: [`"Event"."status"`],
        raw: true,
      });

      if (dashboard_top_filter) {
        const events = await this.event.findAll({
          where: {
            ...(await getEventStatusWhere(
              getLegendDataDto,
              companyIds,
              scope,
              user,
            )),
          },
          attributes: ['id'],
        });

        const eventIds = events.map(({ id }) => id);

        if (eventIds.length) {
          allEventAttendances = await this.event.findAll({
            where: {
              id: { [Op.in]: eventIds },
            },
            attributes: [
              [
                Sequelize.literal(
                  `(SELECT name FROM events WHERE events.id IN(${eventIds}) AND expected_attendance = (SELECT MAX(expected_attendance) FROM events WHERE events.id IN(${eventIds})) LIMIT 1)`,
                ),
                'eventNameWithMaxAttendance',
              ],
              [
                Sequelize.literal(
                  `(SELECT name FROM events WHERE events.id IN(${eventIds}) AND expected_attendance = (SELECT MIN(expected_attendance) FROM events WHERE events.id IN(${eventIds})) LIMIT 1)`,
                ),
                'eventNameWithMinAttendance',
              ],
              [Sequelize.literal('MAX(expected_attendance)'), 'maxAttendance'],
              [Sequelize.literal('MIN(expected_attendance)'), 'minAttendance'],
              [
                Sequelize.literal(`(
              SELECT name
              FROM events WHERE events.id IN(${eventIds})
              ORDER BY ABS(expected_attendance - (SELECT AVG(expected_attendance) FROM events WHERE events.id IN(${eventIds})))
              LIMIT 1
            )`),
                'eventNameClosestToAverage',
              ],
              [
                Sequelize.literal(`(
              SELECT expected_attendance
              FROM events WHERE events.id IN(${eventIds})
              ORDER BY ABS(expected_attendance - (SELECT AVG(expected_attendance) FROM events WHERE events.id IN(${eventIds})))
              LIMIT 1
            )`),
                'expectedAttendanceClosestToAverage',
              ],
            ],
          });
        }
      }
    } else if (event_id && dashboard_top_filter === DashboardTopFilter.EVENT) {
      // If specific event is selected then we need to find its details and only its attendances
      singleEvent = await this.event.findOne({
        where: {
          ...(await getEventStatusWhere(
            getLegendDataDto,
            companyIds,
            scope,
            user,
          )),
        },
        attributes: [
          'name',
          'key_genre',
          'genre',
          'sub_genre',
          'expected_attendance',
          'daily_attendance',
          'venue_name',
          [Sequelize.literal('company.name'), 'company'],
          [
            Sequelize.literal(
              'CASE WHEN CAST(EXTRACT(DAY FROM AGE(public_end_date, public_start_date)) AS INTEGER) = 0 THEN 0 ELSE expected_attendance / CAST(EXTRACT(DAY FROM AGE(public_end_date, public_start_date)) AS INTEGER) END',
            ),
            'average_attendance',
          ],
        ],
        include: [
          {
            model: this.company,
            attributes: [],
          },
        ],
        raw: true,
      });
    }

    // In case of universal or global view we need to find subcompanies count.
    // In case of parent or not selected top filter we need to find this count in universal view.
    // In case of global view, if it not event filter selected then we need to find this count as well.
    if (
      !dashboard_top_filter ||
      dashboard_top_filter === DashboardTopFilter.PARENT ||
      (scope !== DashboardScope.ADMIN &&
        dashboard_top_filter !== DashboardTopFilter.EVENT)
    ) {
      if (scope === DashboardScope.GLOBAL) {
        subcompaniesCount = (
          await getSubcompanyIds(companyIds, this.company, user, region_ids)
        ).length;
      } else
        subcompaniesCount = await this.company.count({
          where: await getSubcompaniesCountWhere(company_id, region_ids, user),
        });
    }

    // In case of universal or global view we need to find parent companies count.
    // In case of not selected top filter it should be calculated.
    if (!dashboard_top_filter && scope !== DashboardScope.ADMIN) {
      if (scope === DashboardScope.GLOBAL) {
        parentCompaniesCount = (
          await getParentIds(companyIds, this.company, region_ids, user)
        ).length;
      } else {
        let _where = {};

        // getting regions and subregions
        const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

        if (region_ids) {
          _where['region_id'] = { [Op.in]: regionsAndSubRegions };
        }

        _where = {
          ..._where,
          ...(await userRegionsWhere(
            user,
            false,
            true,
            null,
            null,
            region_ids,
          )),
        };

        parentCompaniesCount = await this.company.count({
          where: { parent_id: null, ..._where },
        });
      }
    }

    return {
      totalIncidents,
      criticalIncidents,
      statusCounts: eventStatusCount
        ? formatStatusCount(eventStatusCount as unknown as StatusCount[])
        : null,
      totalEvents: eventStatusCount
        ? eventStatusCount.reduce((total, status) => total + status['count'], 0)
        : null,
      singleEvent,
      subcompaniesCount:
        scope === DashboardScope.ADMIN ? null : subcompaniesCount,
      parentCompaniesCount,
      allEventAttendances,
      avgResolutionTime: formatTime(avgResolvedTime[0].avgResolvedTime),
    };
  }

  async getEventsByCount(
    eventsByStatusQueryDto: EventsByStatusQueryDto,
    user: User,
    res: Response,
  ) {
    const { year, region_ids, page, page_size } = eventsByStatusQueryDto;
    let parent_companies = [];
    let subcompanies = [];
    let events: any = [{ grouped_events: {} }];

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    const eventStatusCount = await this.event.findAll({
      where: {
        ...(await getEventsByStatusWhere(
          eventsByStatusQueryDto,
          companyIds,
          scope,
          user,
        )),
      },
      attributes: [
        [this.event.getStatusNameByKey, 'status'],
        [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
      ],
      group: [`"Event"."status"`],
      raw: true,
    });

    // Get query string to fetch events grouped by statuses
    const query = await getEventByStatusQuery(
      eventsByStatusQueryDto,
      companyIds,
      scope,
      user,
      _page,
      _page_size,
    );

    events = await this.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    const { on_hold, in_progress, upcoming, completed } =
      events[0]['grouped_events'];

    [parent_companies, subcompanies] = await getCompaniesMapPointsHelper(
      eventsByStatusQueryDto,
      companyIds,
      scope,
      this.company,
      user,
    );

    // If due to year filter if subcompany is found then we need to send its parent company as well,
    // even if its not in that year.
    if (
      scope === DashboardScope.GLOBAL &&
      subcompanies.length &&
      !parent_companies.length &&
      year
    ) {
      const parentIds = await getParentIds(
        companyIds,
        this.company,
        region_ids,
        user,
      );

      parent_companies = await getCompaniesMapPoints(
        { dashboard_top_filter: DashboardTopFilter.GLOBAL, region_ids },
        this.company,
        parentIds,
        scope,
        user,
        true,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: {
          events: {
            on_hold: !on_hold ? [] : on_hold,
            in_progress: !in_progress ? [] : in_progress,
            completed: !completed ? [] : completed,
            upcoming: !upcoming ? [] : upcoming,
          },
          parent_companies,
          subcompanies,
        },
        counts: {
          ...formatStatusCount(
            eventStatusCount as unknown as StatusCount[],
            _page,
            _page_size,
          ),
          total_events: eventStatusCount.reduce(
            (total, status) => total + status['count'],
            0,
          ),
          companies_count: parent_companies.length,
          subcompanies_count: subcompanies.length,
        },
      }),
    );
  }

  async getMapPointsData(
    getMapPointsDto: GetMapPointsDto,
    user: User,
    res: Response,
  ) {
    const { dashboard_top_filter, event_id, year, company_id, region_ids } =
      getMapPointsDto;
    let events = null;
    let parentCompanies = null;
    let subcompanies = null;
    let statusCount = null;
    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    await checkCompanyOrEventId(
      companyIds,
      user,
      year,
      event_id,
      company_id,
      dashboard_top_filter,
      region_ids,
    );

    // We need to get map points for event only if event is selected from top filter or if not top filter is selected
    if (
      dashboard_top_filter === DashboardTopFilter.EVENT ||
      !dashboard_top_filter
    ) {
      events = await this.event.findAll({
        where: await getMapPointEventsWhere(
          getMapPointsDto,
          companyIds,
          scope,
          user,
        ),
        attributes: [
          'id',
          'name',
          'location',
          'event_location',
          'short_event_location',
          [this.event.getStatusNameByKey, 'status'],
          [Sequelize.literal('company.name'), 'company_name'],
          [
            Sequelize.literal(`(
              SELECT count("Incident"."id") AS "count" FROM "incidents" AS "Incident"
              INNER JOIN "incident_types" AS "i_t" ON "Incident"."incident_type_id"="i_t"."id"
              WHERE "Incident"."event_id" = ${
                event_id ? event_id : `"Event"."id"`
              })::INTEGER
             `),
            'incidents_count',
          ],
          [
            Sequelize.literal(`(
              SELECT count("Incident"."id") AS "count" FROM "incidents" AS "Incident"
              INNER JOIN "incident_types" AS "i_t" ON "Incident"."incident_type_id"="i_t"."id"
              WHERE "Incident"."event_id" = ${
                event_id ? event_id : `"Event"."id"`
              }
              AND "Incident"."priority" = ${Priority.CRITICAL})::INTEGER
             `),
            'critical_incidents_count',
          ],
        ],
        include: [
          {
            model: this.company,
            attributes: [],
          },
        ],
        group: [`"Event"."id"`, `"company"."name"`, `"company"."id"`],
      });

      const _statusCount = await Event.findAll({
        where: await getMapPointEventsWhere(
          getMapPointsDto,
          companyIds,
          scope,
          user,
        ),
        attributes: [
          [
            Sequelize.literal(`CASE
              WHEN status = 3 OR status IS NULL THEN 'upcoming'
              WHEN status = 2 THEN 'in_progress'
              WHEN status = 1 THEN 'completed'
              WHEN status = 0 THEN 'on_hold'
            END`),
            'status',
          ],
          [Sequelize.fn('COUNT', Sequelize.col('*')), 'count'],
        ],
        include: [
          {
            model: Company,
            attributes: ['id'],
          },
        ],
        group: ['status', 'company.id'],
        raw: true,
      });

      statusCount = getStatusFormat(_statusCount);
    }

    // We need to get map points for parent companies only if parent is selected from top filter or if not top filter is selected
    // In case of global view, if global is selected then we need to get this.
    if (
      dashboard_top_filter === DashboardTopFilter.PARENT ||
      !dashboard_top_filter ||
      (scope === DashboardScope.GLOBAL &&
        DashboardTopFilter.GLOBAL === dashboard_top_filter)
    ) {
      const filters = getMapPointsDto;
      const parentIds = await getParentIds(
        companyIds,
        this.company,
        region_ids,
        user,
      );
      if (!dashboard_top_filter) {
        filters.dashboard_top_filter = DashboardTopFilter.PARENT;
      }

      if (
        (scope === DashboardScope.GLOBAL &&
          filters.company_id &&
          parentIds.includes(filters.company_id)) ||
        scope === DashboardScope.UNIVERSAL ||
        (scope === DashboardScope.GLOBAL && !filters.company_id)
      ) {
        parentCompanies = await getCompaniesMapPoints(
          filters,
          this.company,
          parentIds,
          scope,
          user,
        );
      }
    }

    // We need to get map points for sub-companies only if child is selected from top filter or if not top filter is selected
    // In case of global view, if global is selected then we need to get this as well.
    if (
      dashboard_top_filter === DashboardTopFilter.CHILD ||
      !dashboard_top_filter ||
      (scope === DashboardScope.GLOBAL &&
        DashboardTopFilter.GLOBAL === dashboard_top_filter)
    ) {
      const filters = getMapPointsDto;
      const subcompanyIds = await getSubcompanyIds(
        companyIds,
        this.company,
        user,
        region_ids,
      );
      if (!dashboard_top_filter) {
        filters.dashboard_top_filter = DashboardTopFilter.CHILD;
      }
      if (
        (scope === DashboardScope.GLOBAL &&
          filters.company_id &&
          subcompanyIds.includes(filters.company_id)) ||
        scope === DashboardScope.UNIVERSAL ||
        (scope === DashboardScope.GLOBAL && !filters.company_id)
      ) {
        subcompanies = await getCompaniesMapPoints(
          filters,
          this.company,
          subcompanyIds,
          scope,
          user,
        );
      }
    }

    return res.send(
      successInterceptorResponseFormat({
        data: { events, parentCompanies, subcompanies },
        counts: statusCount,
      }),
    );
  }

  async getIncidentDetail(incidentId: number, user: User) {
    let priorityGuideAlerts = [];
    let incidentTypeAlerts = [];

    const incident = await this.incident.findByPk(incidentId, {
      attributes: [
        'id',
        'incident_type',
        'logged_date_time',
        'created_at',
        'event_id',
        'priority',
        [this.incident.getStatusNameByKey, 'status'],
        [this.incident.getDashboardPriorityNameByKey, 'priority_name'],
        [Sequelize.literal('event.name'), 'event_name'],
        [Sequelize.literal('event.time_zone'), 'event_timezone'],
      ],
      include: [
        await getEventInclude(this.event, user),
        getIncidentTypeInclude(this.incidentType),
        {
          model: this.company,
          attributes: [
            'name',
            'contact_name',
            'contact_email',
            'contact_phone',
          ],
          include: [
            {
              model: this.companyContact,
              attributes: ['name', 'email', 'number'],
            },
          ],
        },
      ],
    });

    if (!incident) throw new NotFoundException(RESPONSES.notFound('Incident'));

    const incidentType = await this.incidentType.findOne({
      where: {
        name: incident.incident_type,
      },
      attributes: ['id', 'name'],
      include: [
        ...getAlertsInclude(
          incident.event_id,
          this.alert,
          this.user,
          this.eventContact,
        ),
      ],
    });

    if (incidentType) {
      incidentTypeAlerts = incidentType.incident_type_alerts;
    }

    const priorityGuide = await this.priorityGuide.findOne({
      where: { event_id: incident.event_id, priority: incident.priority },
      attributes: ['id'],
      include: [
        ...getAlertsInclude(
          incident.event_id,
          this.alert,
          this.user,
          this.eventContact,
        ),
      ],
    });

    if (priorityGuide) {
      priorityGuideAlerts = priorityGuide.priority_guide_alerts;
    }

    return {
      incident,
      alerts: [...incidentTypeAlerts, ...priorityGuideAlerts],
    };
  }

  async getCriticalIncidentsList(incidentListDto: IncidentListDto, user: User) {
    const {
      order,
      sort_column,
      page,
      page_size,
      dashboard_top_filter,
      year,
      event_id,
      company_id,
      region_ids,
    } = incidentListDto;
    let [_page, _page_size] = getPageAndPageSize(page, page_size);

    // TODO DEFAULT PAGINATION THROUGH FUNCTION
    _page = _page || +this.configService.get('PAGE');
    _page_size = _page_size || +this.configService.get('PAGE_LIMIT');

    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    await checkCompanyOrEventId(
      companyIds,
      user,
      year,
      event_id,
      company_id,
      dashboard_top_filter,
      region_ids,
    );

    const incidents = await this.incident.findAndCountAll({
      where: await getIncidentListWhere(
        incidentListDto,
        true,
        companyIds,
        scope,
        user,
      ),
      attributes: [
        'id',
        'created_at',
        'logged_date_time',
        'incident_type',
        [this.incident.getDashboardStatusNameByKey, 'status'],
        [Sequelize.literal('event.name'), 'event_name'],
        [Sequelize.literal('event.time_zone'), 'time_zone'],
        [Sequelize.literal('company.name'), 'company_name'],
        [
          Sequelize.literal(`
            TO_CHAR(
              interval '1 second' * (
                SELECT
                  CASE
                    WHEN "status_changes"."status" = 'resolved' THEN
                      EXTRACT(EPOCH FROM "status_changes"."created_at" - "Incident"."created_at")
                    ELSE
                      EXTRACT(EPOCH FROM NOW() AT TIME ZONE 'UTC' - "Incident"."created_at")
                  END
                FROM status_changes
                WHERE "Incident"."id" = "status_changes"."status_changeable_id"
                  AND "status_changes"."status_changeable_type" = '${StatusChangesType.INCIDENT}'
                ORDER BY "status_changes"."created_at" DESC
                LIMIT 1
              ),
              'HH24:MI:SS'
            )
          `),
          'formatted_resolution_time',
        ],
        [
          Sequelize.literal(`
            (
              SELECT
                CASE
                  WHEN "status_changes"."status" = 'resolved' THEN
                    EXTRACT(EPOCH FROM "status_changes"."created_at" - "Incident"."created_at")
                  ELSE
                    EXTRACT(EPOCH FROM NOW() AT TIME ZONE 'UTC' - "Incident"."created_at")
                END
              FROM status_changes
              WHERE "Incident"."id" = "status_changes"."status_changeable_id"
                AND "status_changes"."status_changeable_type" = '${StatusChangesType.INCIDENT}'
              ORDER BY "status_changes"."created_at" DESC
              LIMIT 1
            )
          `),
          'resolution_time',
        ],
        [
          Sequelize.literal(`(SELECT JSON_AGG(JSON_BUILD_OBJECT(
          'user_name', "incident_types->incident_type_alerts->user"."name",
          'contact_name', "incident_types->incident_type_alerts->event_contact"."contact_name"
          ))
          FROM
            "incidents" AS "Incident1"
            LEFT OUTER JOIN "incident_types" AS "incident_types" ON "Incident1"."incident_type_id" = "incident_types"."id"
            LEFT OUTER JOIN "alerts" AS "incident_types->incident_type_alerts" ON "incident_types"."id" = "incident_types->incident_type_alerts"."alertable_id"
            AND "incident_types->incident_type_alerts"."alertable_type" = 'IncidentType' AND "incident_types->incident_type_alerts"."event_id" = "Incident"."event_id"
            LEFT OUTER JOIN "users" AS "incident_types->incident_type_alerts->user" ON "incident_types->incident_type_alerts"."user_id" = "incident_types->incident_type_alerts->user"."id"
            LEFT OUTER JOIN "event_contacts" AS "incident_types->incident_type_alerts->event_contact" ON "incident_types->incident_type_alerts"."event_contact_id" = "incident_types->incident_type_alerts->event_contact"."id"
          WHERE
            "Incident1"."id" = "Incident"."id")`),
          'incident_type_contact_names',
        ],
        [
          Sequelize.literal(`(SELECT JSON_AGG ( JSON_BUILD_OBJECT ( 'user_name', "priority_guide_alerts->user"."name", 'contact_name', "priority_guide_alerts->event_contact"."contact_name" ) )
            FROM
              "incidents" AS "Incident1"
              LEFT OUTER JOIN "alerts" AS "priority_guide_alerts" ON ( SELECT pg.ID FROM priority_guides AS pg WHERE pg."event_id" = "Incident"."event_id" AND pg."priority" = "Incident"."priority" ) = "priority_guide_alerts"."alertable_id"
              AND "priority_guide_alerts"."alertable_type" = 'PriorityGuide'
              AND "priority_guide_alerts"."event_id" = "Incident"."event_id"
              LEFT OUTER JOIN "users" AS "priority_guide_alerts->user" ON "priority_guide_alerts"."user_id" = "priority_guide_alerts->user"."id"
              LEFT OUTER JOIN "event_contacts" AS "priority_guide_alerts->event_contact" ON "priority_guide_alerts"."event_contact_id" = "priority_guide_alerts->event_contact"."id"
            WHERE
              "Incident1"."id" = "Incident"."id" )`),
          'priority_guide_contact_names',
        ],
      ],
      include: [
        await getEventInclude(this.event, user, region_ids),
        getIncidentTypeInclude(this.incidentType),
        {
          model: this.company,
          attributes: [],
        },
      ],
      limit: _page_size,
      offset: _page_size * _page,
      order: [[sort_column || 'created_at', order || SortBy.ASC]],
    });

    const { rows, count } = incidents;

    const counts = await this.incident.findAll({
      where: await getIncidentListWhere(
        incidentListDto,
        false,
        companyIds,
        scope,
        user,
      ),
      attributes: [
        [this.incident.getDashboardStatusNameByKey, 'status'],
        [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
      ],
      include: [
        await getEventInclude(this.event, user, region_ids),
        getIncidentTypeInclude(this.incidentType),
        {
          model: this.company,
          attributes: [],
        },
      ],
      group: [`"Incident"."status"`],
    });

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
      counts: {
        ...getTotalListingCountsByTypes(
          counts.map((count) =>
            count.get({ plain: true }),
          ) as unknown as StatusCount[],
        ),
      },
    };
  }

  async getMapIncidentsList(eventId: number, user: User) {
    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    await checkEventId(companyIds, user, null, eventId);

    const incidents = await this.incident.findAll({
      where: await getMapIncidentList(eventId, companyIds, scope),
      attributes: [
        'id',
        'created_at',
        'incident_type',
        'description',
        'logged_date_time',
        [this.incident.getStatusNameByKey, 'status'],
        [this.incident.getDashboardPriorityNameByKey, 'priority'],
        [Sequelize.literal('location.latitude'), 'latitude'],
        [Sequelize.literal('location.longitude'), 'longitude'],
        [Sequelize.literal('department.name'), 'department_name'],
        [
          Sequelize.literal(
            `(SELECT name FROM "departments" WHERE "Incident"."reporter_id" = "departments"."id")`,
          ),
          'reporter_name',
        ],
        [Sequelize.literal('event.time_zone'), 'time_zone'],
      ],
      include: [
        await getEventInclude(this.event, user),
        getIncidentTypeInclude(this.incidentType),
        {
          model: this.location,
          attributes: [],
        },
        {
          model: this.incidentZone,
          attributes: [
            [
              Sequelize.cast(Sequelize.col('incident_zone.id'), 'integer'),
              'id',
            ],
            'name',
            'color',
          ],
        },
        {
          model: this.department,
          as: 'department',
          attributes: [],
        },
      ],
      order: [['created_at', SortBy.ASC]],
    });

    return incidents;
  }

  async getCsvComparison(
    comparisonDto: ComparisonDto,
    req: Request,
    res: Response,
    user: User,
  ) {
    const { first_event_id, second_event_id } = comparisonDto;
    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    const events = await this.event.findAll({
      where: {
        id: { [Op.in]: [first_event_id, second_event_id] },
        [Op.or]: [
          { demo_event: { [Op.is]: null } },
          { demo_event: { [Op.eq]: false } },
        ],
      },
      attributes: [
        'id',
        'name',
        'venue_name',
        'event_location',
        'short_event_location',
        'start_date',
        'end_date',
        'expected_attendance',
        'daily_attendance',
        [
          Sequelize.literal(
            '(SELECT COUNT(*)::INTEGER FROM "incidents" LEFT OUTER JOIN "incident_types" AS "incident_types" ON "incidents"."incident_type_id" = "incident_types"."id"  WHERE "incidents"."event_id" = "Event"."id")',
          ),
          'incident_count',
        ],
        [Sequelize.literal('company.name'), 'company_name'],
        [
          Sequelize.literal(`
          (
            SELECT JSON_AGG("incident_type_name") 
            FROM (
              SELECT
                "incident_types"."name" AS "incident_type_name"
              FROM "incidents" AS "Incident" 
              LEFT OUTER JOIN "incident_types" AS "incident_types" 
              ON "Incident"."incident_type_id" = "incident_types"."id" 
              WHERE "Incident"."event_id" = "Event"."id"
              GROUP BY "incident_types"."name" 
              ORDER BY COUNT(*) DESC 
              LIMIT 5
            ) AS "IC"
          )
        `),
          'top_incident_types',
        ],
        ...getPriorityCountAttributes(),
      ],
      include: [
        {
          model: this.company,
          where:
            scope === DashboardScope.UNIVERSAL
              ? {}
              : { id: { [Op.in]: companyIds } },
          attributes: [],
        },
      ],
      raw: true,
    });

    if (events.length < 2)
      throw new NotFoundException(RESPONSES.notFound('Some Of The Events Are'));

    const _events = await Promise.all(
      events.map(async (event) => ({
        ...event,
        ...(await getCityOrCountryByEventLocation(
          event.event_location,
          this.geocoder,
        )),
      })),
    );

    return await getCsvForComparison(_events, req, res, this.httpService);
  }

  async getGraphComparison(comparisonDto: GraphComparisonDto, user: User) {
    const { first_event_id, second_event_id, hour_difference } = comparisonDto;
    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    const events = await this.event.findAll({
      where: {
        id: { [Op.in]: [first_event_id, second_event_id] },
        [Op.or]: [
          { demo_event: { [Op.is]: null } },
          { demo_event: { [Op.eq]: false } },
        ],
      },
      include: [
        {
          model: this.company,
          where:
            scope === DashboardScope.UNIVERSAL
              ? {}
              : { id: { [Op.in]: companyIds } },
          attributes: [],
        },
      ],
      attributes: ['id', 'region_id'],
    });

    if (events.length < 2)
      throw new NotFoundException(RESPONSES.notFound('Some Of The Events Are'));

    const result = await this.sequelize.query(
      `SELECT * FROM get_incidents_by_event_and_hour(${first_event_id},${second_event_id},${hour_difference})`,
      {
        type: QueryTypes.SELECT,
      },
    );

    return result[0]['get_incidents_by_event_and_hour'];
  }

  async liveEventsListing(
    liveEventListingDto: LiveEventListingDto,
    user: User,
  ) {
    const { page, page_size, sort_column, order, operational } =
      liveEventListingDto;

    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);
    const { companyIds } = await getScopeAndCompanyIds(user);

    const events = await this.event.findAndCountAll({
      where: await liveEventsWhere(liveEventListingDto, companyIds, user),
      attributes: [
        'id',
        'name',
        'demo_event',
        'short_event_location',
        'location',
        'venue_name',
        'time_zone',
        [Sequelize.literal(`"company"."name"`), 'company_name'],
        [
          Sequelize.literal(
            `CASE WHEN ${!!operational} THEN TO_CHAR("start_date", 'YYYY-MM-DD')
            ELSE TO_CHAR("public_start_date", 'YYYY-MM-DD') END`,
          ),
          'start_date',
        ],
        [
          Sequelize.literal(
            `CASE WHEN ${!!operational} THEN TO_CHAR("end_date", 'YYYY-MM-DD')
            ELSE TO_CHAR("public_end_date", 'YYYY-MM-DD') END`,
          ),
          'end_date',
        ],
        [
          Sequelize.literal(
            `CASE WHEN ${!!operational} THEN start_time
            ELSE public_start_time END`,
          ),
          'start_time',
        ],
        [
          Sequelize.literal(`EXISTS (
            SELECT 1
            FROM "user_pins"
            WHERE "user_pins"."pinable_id" = "Event"."id" 
            AND "user_pins"."pinable_type" = 'DashboardEvent' 
            AND "user_pins"."user_id" = ${user.id}
          )`),
          'isPinned',
        ],
        [Sequelize.literal('"user_dashboard_pin_events"."order"'), 'order'],
        ...eventActiveModulesAttributes,
      ],
      include: [
        {
          model: this.company,
          attributes: [],
        },
        {
          model: this.userPins,
          as: 'user_dashboard_pin_events',
          where: { user_id: user.id },
          attributes: [],
          required: false,
        },
      ],
      limit: _page_size,
      offset: _page_size * _page,
      order: [
        [
          { model: UserPins, as: 'user_dashboard_pin_events' },
          'pinable_id',
          SortBy.ASC,
        ],
        [sort_column || 'name', order || SortBy.ASC],
      ],
      subQuery: false,
    });

    const { rows, count } = events;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getPinnedEventData(
    pinnedEventDataDto: PinnedEventDataDto,
    user?: User,
  ) {
    const { event_id } = pinnedEventDataDto;

    if (user) {
      const { companyIds, scope } = await getScopeAndCompanyIds(user);

      if (scope !== DashboardScope.UNIVERSAL) {
        await checkEventId(companyIds, user, null, event_id);
      }

      const pinnedEventIds = await getEventPins(user);

      if (!pinnedEventIds?.includes(event_id)) {
        throw new NotFoundException(RESPONSES.notFound('Pinned Event'));
      }
    }

    const incidentsByType = await this.incident.findAll({
      where: { event_id },
      attributes: [
        'incident_type',
        [Sequelize.literal('COUNT("incident_type")::INTEGER'), 'count'],
      ],
      include: [
        await getEventInclude(this.event, user),
        getIncidentTypeInclude(this.incidentType),
      ],
      group: [`"Incident"."incident_type"`],
      order: [['count', SortBy.DESC]],
      limit: 10,
    });

    const incidentsByPriority = await this.incident.findAll({
      where: { event_id },
      attributes: [
        [this.incident.getDashboardStatusNameByKey, 'status'],
        [this.incident.getDashboardPriorityNameByKey, 'priority'],
        [Sequelize.literal('COUNT(*)::INTEGER'), 'count'],
      ],
      include: [
        await getEventInclude(this.event, user),
        getIncidentTypeInclude(this.incidentType),
      ],
      group: [`"Incident"."status"`, `"Incident"."priority"`],
      order: [['status', SortBy.ASC]],
      raw: true,
    });

    const totalIncidents = await this.incident.count({
      where: { event_id },
      include: [
        await getEventInclude(this.event, user),
        getIncidentTypeInclude(this.incidentType),
      ],
    });

    const criticalIncidents = await this.incident.count({
      where: {
        event_id,
        priority: Priority.CRITICAL,
      },
      include: [
        await getEventInclude(this.event, user),
        getIncidentTypeInclude(this.incidentType),
      ],
    });

    const avgResolvedTime: any = await this.incident.findAll({
      where: {
        event_id,
        status: IncidentStatusDashboardType.RESOLVED,
      },
      attributes: [
        [
          Sequelize.fn(
            'AVG',
            Sequelize.literal(`
             (SELECT
                    CASE
                      WHEN "status_changes"."status" = 'resolved' THEN
                        EXTRACT(EPOCH FROM "status_changes"."created_at" - "Incident"."created_at")
                    END
                  FROM status_changes
                  WHERE "Incident"."id" = "status_changes"."status_changeable_id"
                    AND "status_changes"."status_changeable_type" = '${StatusChangesType.INCIDENT}'
                  ORDER BY "status_changes"."created_at" DESC
                  LIMIT 1)
          `),
          ),
          'avgResolvedTime',
        ],
      ],
      include: [
        await getEventInclude(this.event, user),
        getIncidentTypeInclude(this.incidentType),
      ],
      raw: true,
    });

    const singleEvent = await this.event.findOne({
      where: {
        id: event_id,
      },
      attributes: singleEventAttributes(user, this.event),
      include: user
        ? [
            {
              model: UserPins,
              as: 'user_dashboard_pin_events',
              where: { user_id: user.id },
              attributes: [],
            },
          ]
        : null,
    });

    return {
      incidentsByType,
      incidentsByPriority: formatIncidentsByPriority(
        incidentsByPriority as unknown as IncidentByPriorityAndStatus[],
      ),
      totalIncidents,
      criticalIncidents,
      avgResolvedTime: formatTime(avgResolvedTime[0].avgResolvedTime),
      singleEvent,
    };
  }

  async getAllPinnedEventsData(user: User) {
    const pinnedEventIds = await getEventPins(user);

    if (pinnedEventIds.length) {
      const result = await this.sequelize.query(
        `SELECT * FROM get_all_pinned_events_data(${user.id}, VARIADIC ARRAY[${[
          pinnedEventIds,
        ]}])`,
        {
          type: QueryTypes.SELECT,
        },
      );

      const response: any[] = result[0]['get_all_pinned_events_data'];

      return response
        .sort(
          (event1, event2) =>
            event1.singleevent.order - event2.singleevent.order,
        )
        .map((eventData: any) => ({
          incidentsByType: eventData.incidentsbytype || [],
          incidentsByPriority: formatIncidentsByPriority(
            eventData.incidentsbypriority ||
              ([] as unknown as IncidentByPriorityAndStatus[]),
          ),
          totalIncidents: eventData.totalincidents,
          criticalIncidents: eventData.criticalincidents,
          avgResolvedTime: formatTime(eventData.resolvedtime),
          singleEvent: eventData.singleevent,
        }));
    }

    return [];
  }

  async pinDashboardEvents(
    pinDashboardEventDto: PinDashboardEventDto,
    user: User,
  ) {
    const { event_orders } = pinDashboardEventDto;
    const event_ids = event_orders.map(({ event_id }) => event_id);
    const { companyIds, scope } = await getScopeAndCompanyIds(user);

    // Initialize arrays for records to update, create, and delete
    const toBeUpdated = [];
    const toBeCreated = [];
    const toBeDeleted = [];

    if (scope !== DashboardScope.UNIVERSAL) {
      await checkAllEventIds(companyIds, user, event_ids);
    }

    // getting user pins with its order
    const userPinsWithOrder = await getEventPinsWithOrder(user);

    // Create maps for quick lookup
    const eventMap = new Map(
      event_orders.map(({ event_id, order }) => [event_id, order]),
    );
    const userMap = new Map(
      userPinsWithOrder.map(({ event_id, order }) => [event_id, order]),
    );

    // Compare the arrays
    for (const [event_id, newOrder] of eventMap) {
      if (userMap.has(event_id)) {
        const existingOrder = userMap.get(event_id);
        if (existingOrder !== newOrder) {
          toBeUpdated.push({ event_id, order: newOrder });
        }
      } else {
        toBeCreated.push({ event_id, order: newOrder });
      }
    }

    for (const [event_id] of userMap) {
      if (!eventMap.has(+event_id)) {
        toBeDeleted.push({ event_id, order: userMap.get(event_id) });
      }
    }

    if (toBeCreated.length) {
      await createUserPinsMultiple(
        toBeCreated.map(({ event_id, order }) => ({
          order,
          pinable_id: event_id,
          user_id: user.id,
          pinable_type: PinableType.DASHBOARD_EVENT,
        })),
      );
    }

    if (toBeUpdated.length) {
      await updateUserPinsMultiple(
        toBeUpdated.map(({ event_id, order }) => ({
          order,
          pinable_id: event_id,
          user_id: user.id,
          pinable_type: PinableType.DASHBOARD_EVENT,
        })),
      );
    }

    if (toBeDeleted.length) {
      await deleteUserMultiplePins(
        toBeDeleted.map(({ event_id }) => event_id),
        user.id,
        PinableType.DASHBOARD_EVENT,
      );
    }

    return { success: true };
  }

  async getPinnedEventsMapPoints(user: User) {
    let pinnedEventsMapPoints = [];

    const pinnedEventIds = await getEventPins(user);

    if (pinnedEventIds.length) {
      pinnedEventsMapPoints = await this.event.findAll({
        where: getEventPinsWhere(pinnedEventIds),
        attributes: [
          'id',
          'name',
          'location',
          [
            Sequelize.literal(`(
              SELECT count("Incident"."id") AS "count" FROM "incidents" AS "Incident" 
              INNER JOIN "incident_types" AS "i_t" ON "Incident"."incident_type_id"="i_t"."id" 
              WHERE "Incident"."event_id" = "Event"."id"
            )::INTEGER`),
            'incidents_count',
          ],
        ],
      });
    }

    return pinnedEventsMapPoints;
  }

  async getPinnedEvents(user: User) {
    let pinnedEvents = [];

    const pinnedEventIds = await getEventPins(user);

    if (pinnedEventIds.length) {
      pinnedEvents = await this.event.findAll({
        where: getEventPinsWhere(pinnedEventIds),
        attributes: [
          'id',
          'name',
          'company_id',
          [Sequelize.literal('"user_dashboard_pin_events"."order"'), 'order'],
        ],
        include: [
          {
            model: UserPins,
            as: 'user_dashboard_pin_events',
            where: { user_id: user.id },
            attributes: [],
          },
        ],
        order: [
          [
            Sequelize.literal('"user_dashboard_pin_events"."order"'),
            SortBy.ASC,
          ],
        ],
      });
    }

    return pinnedEvents;
  }

  async getPinnedEventsIncidents(
    pinnedEventsIncidentsDto: PinnedEventsIncidentsDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const {
      page,
      page_size,
      incident_division_ids,
      incident_type_ids,
      csv_pdf,
    } = pinnedEventsIncidentsDto;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    const { companyIds } = await getScopeAndCompanyIds(user);

    const pinnedEventIds = await getEventPins(user);

    const incidentDivisionIds = getQueryListParam(incident_division_ids);
    const incidentTypeIds = getQueryListParam(incident_type_ids);

    let incidents = null;
    let _incidents = [];
    let count = 0;

    if (pinnedEventIds.length) {
      incidents = await this.incident.findAndCountAll({
        where: {
          ...pinnedEventsIncidentsWhere(pinnedEventsIncidentsDto, companyIds),
          event_id: { [Op.in]: pinnedEventIds },
        },
        attributes: ['id', 'created_at'],
        include: [
          getIncidentTypeInclude(this.incidentType),
          await getEventInclude(this.event, user),
          {
            model: this.incidentZone,
            attributes: [],
          },
          {
            model: this.incidentType,
            attributes: [],
            where: incidentTypeIds?.length
              ? { id: { [Op.in]: incidentTypeIds } }
              : {},
          },
          {
            model: this.incidentDepartmentUsers,
            attributes: [],
            order: [['id', 'DESC']],
            include: [
              {
                model: this.user,
                attributes: [],
              },
            ],
          },
          {
            model: this.incidentDivision,
            as: 'incident_divisions',
            through: { attributes: [] },
            required: !!incidentDivisionIds?.length,
            where: incidentDivisionIds
              ? Sequelize.literal(
                  `"Incident"."id" IN (SELECT "incident_id" FROM "incident_multiple_divisions" WHERE "incident_division_id" IN (${incidentDivisionIds}))`,
                )
              : {},
            attributes: ['id', 'name'],
          },
        ],
        limit: !page_size && csv_pdf ? undefined : _page_size,
        offset: !page && csv_pdf ? undefined : _page_size * _page,
        order: [...pinnedEventIncidentsOrder(pinnedEventsIncidentsDto)],
        subQuery: false,
        distinct: true,
      });

      const incidentIds = incidents.rows.map((incident) => incident.id);

      _incidents = await this.incident.findAll({
        where: {
          id: { [Op.in]: incidentIds },
        },
        attributes: [
          'id',
          'event_id',
          'created_at',
          'logged_date_time',
          'description',
          [this.incident.getStatusNameByKey, 'status'],
          [this.incident.getDashboardPriorityNameByKey, 'priority'],
          [Sequelize.literal('event.name'), 'event_name'],
          [Sequelize.literal('event.time_zone'), 'time_zone'],
          [Sequelize.literal('incident_zone.name'), 'incident_zone_name'],
          [Sequelize.literal('incident_types.name'), 'incident_type'],
          [
            Sequelize.literal('"incident_department_users->user"."name"'),
            'dispatch_user',
          ],
        ],
        include: [
          getIncidentTypeInclude(this.incidentType),
          await getEventInclude(this.event, user),
          {
            model: this.incidentZone,
            attributes: [],
          },
          {
            model: this.incidentType,
            attributes: [],
            where: incidentTypeIds?.length
              ? { id: { [Op.in]: incidentTypeIds } }
              : {},
          },
          {
            model: this.incidentDepartmentUsers,
            attributes: [],
            order: [['id', 'DESC']],
            include: [
              {
                model: this.user,
                attributes: [],
              },
            ],
          },
          {
            model: this.resolvedIncidentNote,
            attributes: {
              exclude: ['createdAt', 'updatedAt'],
              include: [
                [
                  Sequelize.cast(
                    Sequelize.col('resolved_incident_note.id'),
                    'integer',
                  ),
                  'id',
                ],
                [ResolvedIncidentNote.getStatusNameByKeyInclude, 'status'],
              ],
            },
          },
          {
            model: this.incidentDivision,
            as: 'incident_divisions',
            through: { attributes: [] },
            required: !!incidentDivisionIds?.length,
            where: incidentDivisionIds
              ? Sequelize.literal(
                  `"Incident"."id" IN (SELECT "incident_id" FROM "incident_multiple_divisions" WHERE "incident_division_id" IN (${incidentDivisionIds}))`,
                )
              : {},
            attributes: [
              [
                Sequelize.cast(
                  Sequelize.col('incident_divisions.id'),
                  'integer',
                ),
                'id',
              ],
              'name',
            ],
          },
        ],
        order: [...pinnedEventIncidentsOrder(pinnedEventsIncidentsDto)],
        subQuery: false,
      });

      count = incidents?.count || count;
    }

    if (csv_pdf) {
      return await generateCsvOrPdfForIncidentListing(
        pinnedEventsIncidentsDto,
        _incidents,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: _incidents,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getDivisionNames(user: User) {
    const [pinnedEventIds, companyIds] =
      await getUniqueCompanyIdsAgainstPinnedEvents(user, this.event);

    if (pinnedEventIds.length) {
      const allDivisionNames = await IncidentDivision.findAll({
        where: { company_id: { [Op.in]: companyIds } },
        attributes: [
          [Sequelize.literal('CAST("IncidentDivision"."id" AS INTEGER)'), 'id'],
          'name',
        ],
        order: [['name', SortBy.ASC]],
      });

      return allDivisionNames;
    }

    return [];
  }

  async getAllIncidentTypeNames(user: User) {
    const [pinnedEventIds, companyIds] =
      await getUniqueCompanyIdsAgainstPinnedEvents(user, this.event);

    if (pinnedEventIds.length) {
      const incidentTypes = await IncidentType.findAll({
        where: { company_id: { [Op.in]: companyIds } },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [['name', SortBy.ASC]],
      });

      return incidentTypes;
    }

    return [];
  }

  async findAllDepartmentNamesByEvent(user: User) {
    const [pinnedEventIds, companyIds] =
      await getUniqueCompanyIdsAgainstPinnedEvents(user, this.event);

    if (pinnedEventIds.length) {
      const departments = await Department.findAll({
        where: { company_id: { [Op.in]: companyIds } },
        attributes: ['id', 'name'],
        order: [['name', SortBy.ASC]],
      });

      return departments;
    }

    return [];
  }

  async getEventById(event_id: number) {
    await isEventExist(event_id);

    return await Event.findOne({
      where: { id: event_id },
      attributes: [
        'id',
        'name',
        'start_date',
        'start_time',
        'location',
        'event_location',
        'short_event_location',
        'venue_name',
        'expected_attendance',
      ],
    });
  }

  /**
   * Below are scripts for db.
   */

  // scripts for creating coordinates of company address
  async getLocationCoordinates() {
    const companies = await this.company.findAll({
      attributes: ['id', 'location'],
    });
    const _response = [];
    await Promise.all(
      companies.map(async (company) => {
        try {
          if (company.location && company.location != '') {
            const encodedAddress = encodeURIComponent(company.location);

            const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${this.configService.get(
              'GOOGLE_MAPS_API_KEY',
            )}&address=${encodedAddress}`;

            const response = await firstValueFrom(
              this.httpService.get(url).pipe(
                catchError((error: any) => {
                  console.log(error.message);
                  throw new InternalServerErrorException(
                    ERRORS.SOMETHING_WENT_WRONG,
                  );
                }),
              ),
            );
            if (response.status === 200) {
              _response.push({
                id: company.id,
                ...response.data.results[0].geometry.location,
              });
            }
          } else {
            console.log(company.id);
          }
        } catch (e) {}
      }),
    );

    for (const coordinates of _response) {
      const { id, lat, lng } = coordinates;

      // Perform the update for each record
      await this.company.update(
        {
          coordinates: {
            latitude: '' + lat,
            longitude: '' + lng,
          },
        },
        {
          where: { id },
        },
      );
    }
    return _response;
  }

  // scripts for adding ids of incident_type_id on based of type name in incidents
  async mappingIncidentTypeIds() {
    const incidents = await this.incident.findAll({
      where: { incident_type_id: null },
      attributes: ['id', 'incident_type', 'company_id'],
      limit: 1000,
    });

    await Promise.all(
      incidents.map(async ({ id, incident_type, company_id }) => {
        try {
          const incidentType = await this.incidentType.findOne({
            where: { company_id, name: incident_type },
            attributes: ['id', 'name'],
          });

          if (incidentType) {
            await this.incident.update(
              { incident_type_id: incidentType.id },
              { where: { id } },
            );
          }
        } catch (e) {
          console.log(e);
        }
      }),
    );

    return { success: true };
  }

  // scripts for adding ids of incident_type_id on based of type name in incidents
  async createIncidentTypes() {
    const distinctIncidents = await this.incident.findAll({
      attributes: ['company_id', 'incident_type'],
      where: {
        incident_type_id: null,
      },
      group: ['company_id', 'incident_type'],
    });

    const createdIncidentTypes = await this.incidentType.bulkCreate(
      distinctIncidents.map(({ company_id, incident_type }) => ({
        company_id,
        name: incident_type,
        is_test: TEST_INCIDENT_TYPES.includes(incident_type),
      })),
    );

    createdIncidentTypes.forEach(async (incidentType) => {
      await this.incident.update(
        { incident_type_id: incidentType.id },
        {
          where: {
            company_id: incidentType.company_id,
            incident_type: incidentType.name,
          },
        },
      );
    });
    return { createdIncidentTypes };
  }
}
