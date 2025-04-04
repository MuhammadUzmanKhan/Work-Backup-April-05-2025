import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  CameraZone,
  Image,
  Incident,
  IncidentZone,
  User,
} from '@ontrack-tech-group/common/models';
import {
  CsvOrPdf,
  Options,
  PolymorphicType,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
  successInterceptorResponseFormat,
  throwCatchError,
  withCompanyScope,
  getEventForPdfs,
  checkIfNameAlreadyExistModel,
} from '@ontrack-tech-group/common/helpers';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import {
  getReportsFromLambda,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { CsvForLocation, SocketTypes, _ERRORS } from '@Common/constants';
import { customSearch } from '@Common/helpers';
import {
  CameraZoneQueryParamsDto,
  CreateIncidentCameraZoneDto,
  IncidentMainZoneQueryParamsDto,
  IncidentSubZoneQueryParamsDto,
  CreateIncidentZoneDto,
  UpdateIncidentZoneDto,
  CreateIncidentSubZoneDto,
  UpdateIncidentSubZoneDto,
  CloneIncidentZoneDto,
  UploadIncidentMainZoneDto,
  UploadIncidentCameraZoneDto,
  UploadIncidentSubZoneDto,
} from './dto';
import {
  getCameraZoneWhereQuery,
  getCsvForAllCameraListing,
  getIncidentSubZoneWhereQuery,
  getIncidentZoneWhereQuery,
  incidentSubZoneValidation,
  incidentMainZoneValidation,
  isIncidentCameraZoneExist,
  isIncidentZoneExist,
  pushDataHelperForIncidentZone,
  sendIncidentZonesUpdate,
  getIncidentNoZonesAvailable,
  getIncidentZoneById,
  getCsvPdfForAllZoneListing,
  getIncidentSubZone,
  checkZoneWithSameName,
} from './helpers';

@Injectable()
export class IncidentZoneService {
  constructor(
    private readonly httpService: HttpService,
    private sequelize: Sequelize,
    private pusherService: PusherService,
  ) {}

  async createIncidentZone(
    createIncidentZoneDto: CreateIncidentZoneDto,
    user: User,
  ) {
    const { event_id, name } = createIncidentZoneDto;
    await withCompanyScope(user, event_id);

    await checkZoneWithSameName(name, event_id);

    let incidentZone = await IncidentZone.create({
      ...createIncidentZoneDto,
      event_id,
    });

    incidentZone = await getIncidentZoneById(
      incidentZone.id,
      event_id,
      this.sequelize,
      { useMaster: true },
    );

    const count = await this.getAllCountForLocation(event_id, {
      useMaster: true,
    });

    pushDataHelperForIncidentZone(
      { incidentZone, count },
      event_id,
      'new',
      SocketTypes.INCIDENT_MAIN_ZONE,
      true,
      this.pusherService,
    );

    return incidentZone;
  }

  async createIncidentSubZone(
    createIncidentSubZoneDto: CreateIncidentSubZoneDto,
    user: User,
  ) {
    const { event_id, parent_id, name } = createIncidentSubZoneDto;
    await withCompanyScope(user, event_id);
    await isIncidentZoneExist(parent_id, event_id);

    await checkZoneWithSameName(name, event_id, parent_id);

    let incidentSubZone = await IncidentZone.create({
      ...createIncidentSubZoneDto,
    });

    incidentSubZone = await getIncidentZoneById(
      incidentSubZone.id,
      event_id,
      this.sequelize,
      { useMaster: true },
    );

    const count = await this.getAllCountForLocation(event_id, {
      useMaster: true,
    });

    pushDataHelperForIncidentZone(
      { incidentSubZone, count },
      event_id,
      'new',
      SocketTypes.INCIDENT_SUB_ZONE,
      true,
      this.pusherService,
    );

    return incidentSubZone;
  }

  async createIncidentCameraZone(
    createCameraZoneDto: CreateIncidentCameraZoneDto,
    user: User,
  ) {
    const { event_id, name } = createCameraZoneDto;

    await withCompanyScope(user, event_id);

    await checkIfNameAlreadyExistModel(
      CameraZone,
      'Camera Name',
      name,
      null,
      event_id,
    );

    const cameraZone = await CameraZone.create({
      ...createCameraZoneDto,
    });

    const count = await this.getAllCountForLocation(event_id, {
      useMaster: true,
    });

    pushDataHelperForIncidentZone(
      { cameraZone, count },
      event_id,
      'new',
      SocketTypes.INCIDENT_CAMERA_ZONE,
      true,
      this.pusherService,
    );

    return cameraZone;
  }

  async updateIncidentZone(
    id: number,
    updateIncidentZoneDto: UpdateIncidentZoneDto,
    user: User,
  ) {
    const { event_id, name } = updateIncidentZoneDto;
    await withCompanyScope(user, event_id);

    const incidentZone = await IncidentZone.findOne({
      where: {
        id,
        event_id,
      },
    });
    if (!incidentZone) throw new NotFoundException(_ERRORS.ZONE_NOT_FOUND);

    if (name) {
      await checkZoneWithSameName(name, event_id, null, id);
    }

    await incidentZone.update({ ...updateIncidentZoneDto });

    const updatedIncidentZone = await getIncidentZoneById(
      id,
      event_id,
      this.sequelize,
      { useMaster: true },
    );

    const count = await this.getAllCountForLocation(event_id, {
      useMaster: true,
    });

    pushDataHelperForIncidentZone(
      { incidentZone, count },
      event_id,
      'update',
      SocketTypes.INCIDENT_MAIN_ZONE,
      false,
      this.pusherService,
    );

    return updatedIncidentZone;
  }

  async updateIncidentSubZone(
    id: number,
    updateIncidentSubZoneDto: UpdateIncidentSubZoneDto,
    user: User,
  ) {
    const { event_id, parent_id, reorganize, name } = updateIncidentSubZoneDto;
    await withCompanyScope(user, event_id);

    const incidentSubZone = await isIncidentZoneExist(id);

    if (name) {
      await checkZoneWithSameName(name, event_id, parent_id, id);
    }

    if (parent_id) {
      const subZone = await getIncidentSubZone(id);

      if (subZone.length)
        throw new UnprocessableEntityException(_ERRORS.PARENT_ZONE_FOUND);
    }

    if (parent_id) await isIncidentZoneExist(parent_id);

    await incidentSubZone.update({ ...updateIncidentSubZoneDto });

    const updatedIncidentSubZone = await getIncidentZoneById(
      id,
      event_id,
      this.sequelize,
      { useMaster: true },
    );

    const count = await this.getAllCountForLocation(event_id, {
      useMaster: true,
    });

    pushDataHelperForIncidentZone(
      { incidentSubZone, count },
      event_id,
      reorganize ? 'reorganize' : 'update',
      SocketTypes.INCIDENT_SUB_ZONE,
      false,
      this.pusherService,
    );

    return updatedIncidentSubZone;
  }

  async getIncidentCameraZoneById(
    id: number,
    event_id: number,
    user: User,
    options?: Options,
  ) {
    await withCompanyScope(user, event_id);

    const cameraZone = await CameraZone.findOne({
      where: {
        id,
        event_id,
      },
      ...options,
    });
    if (!cameraZone) throw new NotFoundException(_ERRORS.CAMERA_ZONE_NOT_FOUND);

    return cameraZone;
  }

  async updateIncidentCameraZone(
    id: number,
    updateIncidentCameraZoneDto: CreateIncidentCameraZoneDto,
    user: User,
  ) {
    const { event_id, name } = updateIncidentCameraZoneDto;
    await withCompanyScope(user, event_id);

    const incidentCameraZone = await isIncidentCameraZoneExist(id, event_id);

    if (name)
      await checkIfNameAlreadyExistModel(
        CameraZone,
        'Camera Name',
        name,
        null,
        event_id,
        id,
      );

    await incidentCameraZone.update({
      ...updateIncidentCameraZoneDto,
    });

    const updatedIncidentCameraZone = await this.getIncidentCameraZoneById(
      id,
      event_id,
      user,
      { useMaster: true },
    );

    const count = await this.getAllCountForLocation(event_id, {
      useMaster: true,
    });

    pushDataHelperForIncidentZone(
      { cameraZone: incidentCameraZone, count },
      event_id,
      'update',
      SocketTypes.INCIDENT_CAMERA_ZONE,
      false,
      this.pusherService,
    );

    return updatedIncidentCameraZone;
  }

  /**
   * The function calls IncidentZone.findAll() with the specified where condition generated by the getIncidentZoneWhereQuery function.
   * It includes the Image and Incident models to fetch associated image and incident data, respectively.
   * It also includes the IncidentZone model as incidentSubZones to retrieve incident sub-zones and their corresponding incident counts.
   * If incidentZoneQueryParams.return_resolved_time is true, the function proceeds to calculate the resolved average time for each incident zone and its sub-zones.
   * For each incident sub-zone within an incident zone, the resolved average time is also calculated using the same resolvedAvgTime function.
   * @param incidentZoneQueryParams
   * @returns It retrieves all incident zones based on the provided query parameters and includes additional information such as incident counts and resolved average time.
   */
  async getAllIncidentZones(
    incidentZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
    res: Response,
    req: Request,
    user: User,
  ) {
    const {
      return_resolved_time,
      page,
      page_size,
      sort_column,
      order,
      csv_pdf,
      event_id,
      zone_not_available,
    } = incidentZoneQueryParamsDto;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    let incidentZonesWithResolvedAverageTime = [];

    const [company_id] = await withCompanyScope(user, event_id);

    const incidentZone = await IncidentZone.findAndCountAll({
      benchmark: true,
      logging: (...msg) =>
        console.log(
          `Incident Find & Count All Query [OLD] (Load Time): `,
          msg[1] + 'ms',
        ),
      where: getIncidentZoneWhereQuery(incidentZoneQueryParamsDto),
      attributes: ['id'],
      order: [['id', SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = incidentZone;
    const incidentZoneIds = rows.map((user) => user.id);

    const incidentZonesData = await IncidentZone.findAll({
      benchmark: true,
      logging: (...msg) =>
        console.log(
          `Incident Find All Query [OLD] (Load Time): `,
          msg[1] + 'ms',
        ),
      where: {
        id: { [Op.in]: incidentZoneIds },
        ...(csv_pdf ? { is_test: false } : {}),
      },
      attributes: [
        [Sequelize.cast(Sequelize.col(`"IncidentZone"."id"`), 'INTEGER'), 'id'],
        'event_id',
        'name',
        'color',
        'longitude',
        'latitude',
        'sequence',
        'parent_id',
        'updated_at',
        [Sequelize.literal('"incident_zone_image"."url"'), 'image_url'],
        [
          Sequelize.cast(
            Sequelize.fn('COUNT', Sequelize.col('incidents.id')),
            'INTEGER',
          ),
          'incidents_count',
        ],
        [
          Sequelize.literal(`(
                SELECT COUNT ("incident_zones"."id")::INTEGER FROM incident_zones
                WHERE "incident_zones"."parent_id" = "IncidentZone"."id"
              )`),
          'incident_sub_zone_count',
        ],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Incident,
          attributes: [],
        },
        {
          model: IncidentZone,
          as: 'incident_sub_zones',
          where: { ...(csv_pdf ? { is_test: false } : {}) },
          attributes: [
            [
              Sequelize.cast(
                Sequelize.col(`"incident_sub_zones"."id"`),
                'INTEGER',
              ),
              'id',
            ],
            'name',
            'latitude',
            'longitude',
            'color',
            [
              Sequelize.literal(`(
                SELECT COUNT ("incidents"."id")::INTEGER FROM incidents
                WHERE "incident_sub_zones"."id" = "incidents"."incident_zone_id" limit 1
              )`),
              'incidents_count',
            ],
          ],
          required: false,
          order: [Sequelize.col(`"incident_sub_zones"."id"`), 'ASC'],
        },
      ],
      group: [
        `"IncidentZone"."id"`,
        `"incident_zone_image"."url"`,
        `"incident_sub_zones"."id"`,
      ],
      subQuery: false,
      order: [
        [
          Sequelize.literal(sort_column || `"IncidentZone"."id"`),
          order || 'ASC',
        ],
      ],
    });

    if (return_resolved_time && incidentZonesData.length) {
      const incidentZoneId = incidentZonesData.map((row) => row.id);
      const subZoneIds = incidentZonesData
        .flatMap((zone) => zone.incident_sub_zones)
        .map((subZone) => subZone.id);

      const result = await this.sequelize.query(
        `SELECT * FROM get_incident_zone_resolved_time(${event_id}, VARIADIC ARRAY[${[
          ...incidentZoneId,
          ...subZoneIds,
        ]}])`,
        {
          type: QueryTypes.SELECT,
        },
      );

      const response = result[0]['get_incident_zone_resolved_time'];

      /**
       * INCIDENT ZONES
       * Getting average time of resolation of incident zone
       */
      for (const _incidentZone of incidentZonesData) {
        const incidentSubZonesWithResolvedAverageTime = [];

        const incidentZone = _incidentZone.get({ plain: true });
        const { incident_sub_zones } = incidentZone;

        /**
         * INCIDENT SUB ZONES
         * We iterate over each _incidentSubZone in the incidentSubZones array using a for...of loop.
         * Inside the loop, we call the resolvedAvgTime function with the appropriate parameters and await its result.
         * The resolved average time is then added to incidentSubZonesWithResolvedAverageTime array along with the other properties of _incidentSubZone using the spread syntax.
         */
        for (const _incidentSubZone of incident_sub_zones) {
          incidentSubZonesWithResolvedAverageTime.push({
            ..._incidentSubZone,
            resolved_avg_time: response[_incidentSubZone.id]?.avg_resolved_time,
          });
        }

        incidentZonesWithResolvedAverageTime.push({
          ...incidentZone,
          incident_sub_zones: incident_sub_zones.length
            ? incidentSubZonesWithResolvedAverageTime
            : [],
          resolved_avg_time: response[incidentZone.id]?.avg_resolved_time,
        });
      }
    }

    if (zone_not_available) {
      const incidentNoZonesAvailable = await getIncidentNoZonesAvailable(
        company_id,
        event_id,
        this.sequelize,
      );

      if (return_resolved_time && incidentNoZonesAvailable)
        incidentZonesWithResolvedAverageTime.push(incidentNoZonesAvailable);

      if (order || csv_pdf) {
        incidentZonesWithResolvedAverageTime =
          incidentZonesWithResolvedAverageTime
            .slice()
            .sort((a, b) =>
              order == SortBy.ASC
                ? a.incidents_count - b.incidents_count
                : b.incidents_count - a.incidents_count,
            );
      }
    }

    if (csv_pdf) {
      return await getCsvPdfForAllZoneListing(
        incidentZoneQueryParamsDto,
        await getEventForPdfs(event_id, this.sequelize),
        return_resolved_time
          ? incidentZonesWithResolvedAverageTime
          : incidentZonesData.map((incidentZone) =>
              incidentZone.get({ plain: true }),
            ),
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: return_resolved_time
          ? incidentZonesWithResolvedAverageTime
          : incidentZonesData,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  /**
   * The function calls IncidentZone.findAll() with the specified where condition generated by the getIncidentZoneWhereQuery function.
   * It includes the Image and Incident models to fetch associated image and incident data, respectively.
   * It also includes the IncidentZone model as incidentSubZones to retrieve incident sub-zones and their corresponding incident counts.
   * If incidentZoneQueryParams.return_resolved_time is true, the function proceeds to calculate the resolved average time for each incident zone and its sub-zones.
   * For each incident sub-zone within an incident zone, the resolved average time is also calculated using the same resolvedAvgTime function.
   * @param incidentZoneQueryParams
   * @returns It retrieves all incident zones based on the provided query parameters and includes additional information such as incident counts and resolved average time.
   */
  async getAllIncidentZonesV1(
    incidentZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
    res: Response,
    req: Request,
    user: User,
  ) {
    const {
      return_resolved_time,
      page,
      page_size,
      sort_column,
      order,
      csv_pdf,
      event_id,
      zone_not_available,
      keyword,
    } = incidentZoneQueryParamsDto;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    let incidentZonesWithResolvedAverageTime = [];

    const [company_id] = await withCompanyScope(user, event_id);

    // Getting Incident Zones Data with Total Count
    const { rows, count } = await IncidentZone.findAndCountAll({
      benchmark: true,
      logging: (...msg) =>
        console.log(
          `Incident Find & Count All Query [V1] (Load Time): `,
          msg[1] + 'ms',
        ),
      attributes: [
        [Sequelize.cast(Sequelize.col(`"IncidentZone"."id"`), 'INTEGER'), 'id'],
        'event_id',
        'name',
        'longitude',
        'latitude',
        'color',
        'sequence',
        'parent_id',
        'updated_at',
        [Sequelize.literal('"incident_zone_image"."url"'), 'image_url'],
      ],
      where: getIncidentZoneWhereQuery(incidentZoneQueryParamsDto),
      include: [
        {
          model: Image,
          required: false,
        },
      ],
      order: [
        [
          Sequelize.literal(sort_column || `"IncidentZone"."id"`),
          order || 'ASC',
        ],
      ],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const totalUniqueCount = count;

    // Getting all incident Zone IDs
    const incidentZoneIds = rows.map((i) => i.id);

    // Getting All Sub Zones
    const subZones = await IncidentZone.findAll({
      benchmark: true,
      logging: (...msg) =>
        console.log(
          `Incident Sub Zone Query [V1] (Load Time): `,
          msg[1] + 'ms',
        ),
      where: { parent_id: { [Op.in]: incidentZoneIds } },
      attributes: [
        [Sequelize.cast(Sequelize.col(`"IncidentZone"."id"`), 'INTEGER'), 'id'],
        'name',
        'longitude',
        'latitude',
        'color',
        'parent_id',
      ],
      order: [[`id`, 'ASC']],
    });

    const subZonesIds = subZones.map((i) => i.id);
    // Getting all Incident Counts by Incident Zone IDs
    const incidents = await Incident.findAll({
      benchmark: true,
      logging: (...msg) =>
        console.log(`Incidents Query [V1] (Load Time): `, msg[1] + 'ms'),
      where: {
        incident_zone_id: {
          [Op.in]: Array.from(
            new Set([incidentZoneIds, subZonesIds].flatMap((ids) => ids)),
          ),
        },
      },
      attributes: [
        'incident_zone_id',
        [
          Sequelize.cast(Sequelize.fn('COUNT', Sequelize.col('id')), 'INTEGER'),
          'incidents_count',
        ],
      ],
      group: [`incident_zone_id`],
    });

    // Getting Plain object from all three datasets
    const incidentSubZonesData = subZones.map((subZone) => subZone.dataValues);
    const incidentData = incidents.map((incident) => incident.dataValues);
    let IncidentZonesData = rows.map((row) => row.dataValues);

    // get Incident Counts by Incident Zone ID
    const getIncidentCount = (incidentZoneId: number) =>
      incidentData.find(
        (incident) => incident.incident_zone_id == incidentZoneId,
      )?.incidents_count || 0;

    // This method will generate and map data for subzones
    const getSubZones = (parent_id: number) => {
      const filteredSubZones = incidentSubZonesData.filter(
        (incidentSubZoneData) => incidentSubZoneData.parent_id == parent_id,
      );
      return {
        incident_sub_zone_count: filteredSubZones.length,
        incident_sub_zones: filteredSubZones.map((filteredSubZone) => {
          // deleting useless property
          delete filteredSubZone.parent_id;
          return {
            ...filteredSubZone,
            incidents_count: getIncidentCount(filteredSubZone.id),
          };
        }),
      };
    };

    // Preparing Main Payload
    IncidentZonesData = IncidentZonesData.map((IncidentZoneData) => {
      // incident_zone_image
      delete IncidentZoneData.incident_zone_image;
      return {
        ...IncidentZoneData,
        ...getSubZones(IncidentZoneData.id),
        incidents_count: getIncidentCount(IncidentZoneData.id),
      };
    });

    if (return_resolved_time && IncidentZonesData.length) {
      const incidentZoneId = IncidentZonesData.map((row) => row.id);
      const subZoneIds = IncidentZonesData.flatMap(
        (zone) => zone.incident_sub_zones,
      ).map((subZone) => subZone.id);

      const result = await this.sequelize.query(
        `SELECT * FROM get_incident_zone_resolved_time(${event_id}, VARIADIC ARRAY[${[
          ...incidentZoneId,
          ...subZoneIds,
        ]}])`,
        {
          type: QueryTypes.SELECT,
        },
      );

      const response = result[0]['get_incident_zone_resolved_time'];

      /**
       * INCIDENT ZONES
       * Getting average time of resolation of incident zone
       */
      for (const incidentZone of IncidentZonesData) {
        const incidentSubZonesWithResolvedAverageTime = [];
        const { incident_sub_zones } = incidentZone;

        /**
         * INCIDENT SUB ZONES
         * We iterate over each _incidentSubZone in the incidentSubZones array using a for...of loop.
         * Inside the loop, we call the resolvedAvgTime function with the appropriate parameters and await its result.
         * The resolved average time is then added to incidentSubZonesWithResolvedAverageTime array along with the other properties of _incidentSubZone using the spread syntax.
         */
        for (const _incidentSubZone of incident_sub_zones) {
          incidentSubZonesWithResolvedAverageTime.push({
            ..._incidentSubZone,
            resolved_avg_time: response[_incidentSubZone.id]?.avg_resolved_time,
          });
        }

        incidentZonesWithResolvedAverageTime.push({
          ...incidentZone,
          incident_sub_zones: incident_sub_zones.length
            ? incidentSubZonesWithResolvedAverageTime
            : [],
          resolved_avg_time: response[incidentZone.id]?.avg_resolved_time,
        });
      }
    }

    if (zone_not_available) {
      const incidentNoZonesAvailable = await getIncidentNoZonesAvailable(
        company_id,
        event_id,
        this.sequelize,
      );

      if (return_resolved_time && incidentNoZonesAvailable) {
        if (keyword) {
          // Convert both the name and keyword to lowercase for case-insensitive matching
          const result = customSearch(incidentNoZonesAvailable?.name, keyword);

          // If a match is found, push 'incidentNoZonesAvailable' to the array
          if (result) {
            incidentZonesWithResolvedAverageTime.push(incidentNoZonesAvailable);
          }
        } else {
          incidentZonesWithResolvedAverageTime.push(incidentNoZonesAvailable);
        }
      }

      if (order || csv_pdf) {
        incidentZonesWithResolvedAverageTime =
          incidentZonesWithResolvedAverageTime
            .slice()
            .sort((a, b) =>
              order == SortBy.ASC
                ? a.incidents_count - b.incidents_count
                : b.incidents_count - a.incidents_count,
            );
      }
    }

    if (csv_pdf) {
      return await getCsvPdfForAllZoneListing(
        incidentZoneQueryParamsDto,
        await getEventForPdfs(event_id, this.sequelize),
        return_resolved_time
          ? incidentZonesWithResolvedAverageTime
          : IncidentZonesData,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: return_resolved_time
          ? incidentZonesWithResolvedAverageTime
          : IncidentZonesData,
        pagination: calculatePagination(totalUniqueCount, _page_size, _page),
      }),
    );
  }

  async getAllIncidentSubZones(
    incidentSubZoneQueryParamsDto: IncidentSubZoneQueryParamsDto,
    res: Response,
  ) {
    const { page, page_size, order, sort_column } =
      incidentSubZoneQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const incidentSubZoneCount = await IncidentZone.findAndCountAll({
      where: getIncidentSubZoneWhereQuery(incidentSubZoneQueryParamsDto),
      attributes: ['id'],
      order: [['id', SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = incidentSubZoneCount;
    const incidentSubZoneIds = rows.map((user) => user.id);

    const incidentSubZones = await IncidentZone.findAll({
      where: { id: { [Op.in]: incidentSubZoneIds } },
      attributes: [
        [Sequelize.literal('CAST("IncidentZone"."id" AS INTEGER)'), 'id'],
        'event_id',
        'name',
        'color',
        'longitude',
        'latitude',
        'sequence',
        'parent_id',
        'updated_at',
        [Sequelize.literal('"incident_zone_image"."url"'), 'image_url'],
        [
          Sequelize.literal(`(
            SELECT COUNT ("incidents"."id")::INTEGER FROM incidents 
            WHERE "IncidentZone"."id" = "incidents"."incident_zone_id" limit 1
          )`),
          'incidents_count',
        ],
        [
          Sequelize.literal(`(
            SELECT ("parent_zone"."name") FROM 
            "incident_zones" AS "parent_zone" WHERE "parent_zone"."id" = "IncidentZone"."parent_id"
          )`),
          'parent_zone',
        ],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Incident,
          attributes: [],
        },
      ],
      subQuery: false,
      order: [[sort_column || 'name', order || SortBy.ASC]],
    });

    return res.send(
      successInterceptorResponseFormat({
        data: incidentSubZones,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getAllIncidentSubZonesv1(
    incidentSubZoneQueryParamsDto: IncidentSubZoneQueryParamsDto,
    res: Response,
  ) {
    const { page, page_size, order, sort_column } =
      incidentSubZoneQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const incidentSubZoneCount = await IncidentZone.findAndCountAll({
      where: getIncidentSubZoneWhereQuery(incidentSubZoneQueryParamsDto),
      attributes: ['id'],
      order: [['id', SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = incidentSubZoneCount;
    const incidentSubZoneIds = rows.map((user) => user.id);

    const incidentSubZones = await IncidentZone.findAll({
      where: { id: { [Op.in]: incidentSubZoneIds } },
      attributes: [
        [Sequelize.literal('CAST("IncidentZone"."id" AS INTEGER)'), 'id'],
        'event_id',
        'name',
        'color',
        'longitude',
        'latitude',
        'sequence',
        'parent_id',
        'updated_at',
        [Sequelize.literal('"incident_zone_image"."url"'), 'image_url'],
        [Sequelize.literal('"parent"."name"'), 'parent_zone'],
        [
          Sequelize.literal(`COUNT("incidents"."id")::INTEGER`),
          'incidents_count',
        ],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Incident,
          attributes: [],
        },
        {
          model: IncidentZone,
          attributes: [],
          as: 'parent',
        },
      ],
      subQuery: false,
      group: [`IncidentZone.id`, 'incident_zone_image.url', 'parent.name'],
      order: [[sort_column || 'name', order || SortBy.ASC]],
    });

    return res.send(
      successInterceptorResponseFormat({
        data: incidentSubZones,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getAllCameraZones(
    cameraZoneQueryParamsDto: CameraZoneQueryParamsDto,
    res: Response,
    req: Request,
    options?: Options,
  ) {
    const { page, page_size, order, sort_column, csv } =
      cameraZoneQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    // TODO: => Need to optmize with the help of SQL Procedures
    const incidentCamera = await CameraZone.findAndCountAll({
      where: getCameraZoneWhereQuery(cameraZoneQueryParamsDto),
      attributes: [
        [Sequelize.literal('CAST("id" AS INTEGER)'), 'id'],
        'directions_monitored',
        'camera_type',
        'longitude',
        'latitude',
        'event_id',
        'name',
        'url',
        'updated_at',
      ],
      order: [[sort_column || 'id', order || SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      ...options,
    });

    // csv work
    if (csv) {
      return await getCsvForAllCameraListing(
        incidentCamera.rows,
        req,
        res,
        this.httpService,
      );
    }
    const { rows, count } = incidentCamera;

    return res.send(
      successInterceptorResponseFormat({
        data: rows,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getAllCountForLocation(event_id: number, options?: Options) {
    const zoneCounts = await IncidentZone.count({
      where: {
        event_id,
        parent_id: {
          [Op.eq]: null,
        },
      },
      ...options,
    });

    const subZoneCounts = await IncidentZone.count({
      where: {
        event_id,
        parent_id: {
          [Op.ne]: null,
        },
      },
      ...options,
    });

    const cameraCount = await CameraZone.count({
      where: { event_id },
      ...options,
    });

    return {
      zoneCounts,
      subZoneCounts,
      cameraCount,
    };
  }

  async getCsvForLocation(
    user: User,
    eventIdQueryDto: EventIdQueryDto,
    req: Request,
    res: Response,
  ) {
    const { event_id } = eventIdQueryDto;
    await withCompanyScope(user, event_id);

    const incident_zones = await IncidentZone.findAll({
      attributes: ['id', 'name', 'longitude', 'latitude', 'parent_id'],
      include: [
        {
          model: Incident,
          attributes: ['id'],
        },
        {
          model: IncidentZone,
          as: 'parent',
          attributes: ['name'],
        },
      ],
      where: {
        event_id,
      },
    });

    const camera_zones = await CameraZone.findAll({
      attributes: ['id', 'name', 'longitude', 'latitude'],
      where: { event_id },
    });

    const formattedEventForCsv = incident_zones.map((incident_zone) => {
      return {
        [incident_zone.parent_id ? 'SubZone Name' : 'Zone Name']:
          incident_zone.name,
        'Linked Incidents': '' + incident_zone.incidents.length,
        Type: incident_zone.parent_id
          ? CsvForLocation.SUB_ZONE
          : CsvForLocation.MAIN_ZONE,
        Longitude: incident_zone.longitude,
        Latitude: incident_zone.latitude,
        'Parent Name': incident_zone.parent?.name || 'N/A',
      };
    });

    camera_zones.map((camera_zone) => {
      formattedEventForCsv.push({
        'Zone Name': camera_zone.name,
        'Linked Incidents': 'N/A',
        Type: CsvForLocation.CAMERA_ZONE,
        Longitude: camera_zone.longitude,
        Latitude: camera_zone.latitude,
        'Parent Name': 'N/A',
      });
    });

    const response = await getReportsFromLambda(
      req.headers.authorization,
      this.httpService,
      formattedEventForCsv,
      CsvOrPdf.CSV,
    );

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="incident_zones.csv"');
    return res.send(response.data);
  }

  async getAllIncidentZonesName(user: User, event_id: number) {
    await withCompanyScope(user, event_id);
    return await IncidentZone.findAll({
      where: { event_id },
      attributes: [
        [Sequelize.literal('CAST("IncidentZone"."id" AS INTEGER)'), 'id'],
        'name',
        'parent_id',
      ],
      order: [['is_test', SortBy.ASC]],
    });
  }

  async cloneAllIncidentLocation(clone_locations: CloneIncidentZoneDto) {
    const { current_event_id, clone_event_id } = clone_locations;

    const eventZoneRecords = [];
    let eventZones = [];
    let eventSubZones = [];
    const message = [];

    if (
      clone_locations['copy_all_zones'] ||
      clone_locations['copy_main_zones'] ||
      clone_locations['copy_sub_zone']
    ) {
      const existingZones = await IncidentZone.findAll({
        where: { event_id: clone_event_id },
      });

      if (existingZones.length) {
        eventZones = existingZones.filter((zone) => !zone.parent_id);

        eventSubZones = existingZones.filter((zone) => zone.parent_id);

        for (const eventZone of eventZones) {
          const parentZone = await IncidentZone.findOrCreate({
            where: {
              event_id: current_event_id,
              name: eventZone.name,
              latitude: eventZone.latitude,
              longitude: eventZone.longitude,
              color: eventZone.color,
            },
          });
          eventZoneRecords.push(parentZone[0]);
        }

        if (eventZones.length) message.push('Main Zone');

        if (
          clone_locations['copy_all_zones'] ||
          clone_locations['copy_sub_zone']
        ) {
          for (const eventZone of eventSubZones) {
            const parentZone = eventZones.find(
              (data) => data.id == eventZone.parent_id,
            );

            const newParentId = eventZoneRecords.find(
              (item) => item?.name == parentZone?.name,
            );

            await IncidentZone.findOrCreate({
              where: {
                event_id: current_event_id,
                name: eventZone.name,
                latitude: eventZone.latitude,
                longitude: eventZone.longitude,
                color: eventZone.color,
                parent_id: newParentId?.id,
              },
            });
          }

          if (eventSubZones.length) message.push('Sub Zone');
        }
      }
    }

    if (
      clone_locations['copy_all_zones'] ||
      clone_locations['copy_camera_zones']
    ) {
      const incidentCameras = await CameraZone.findAll({
        where: { event_id: clone_event_id },
      });

      if (incidentCameras.length) {
        for (const incidentCamera of incidentCameras) {
          await CameraZone.findOrCreate({
            where: {
              event_id: current_event_id,
              name: incidentCamera.name,
              latitude: incidentCamera.latitude,
              longitude: incidentCamera.longitude,
              url: incidentCamera.url,
            },
          });
        }
        message.push('Camera Zone');
      }
    }

    const count = await this.getAllCountForLocation(current_event_id);

    pushDataHelperForIncidentZone(
      { message: `${message.join(', ')} cloned`, count },
      current_event_id,
      'clone',
      SocketTypes.INCIDENT_ZONE,
      true,
      this.pusherService,
    );

    return {
      message: `${message.join(', ')} copied Successfully`,
    };
  }

  async uploadIncidentMainZone(
    uploadIncidentDto: UploadIncidentMainZoneDto,
    currentUser: User,
  ) {
    const { event_id, incident_main_zones, file_name, url } = uploadIncidentDto;
    await withCompanyScope(currentUser, event_id);

    const transaction = await this.sequelize.transaction();

    try {
      const _incidentMainZones = await incidentMainZoneValidation(
        event_id,
        incident_main_zones,
      );

      await IncidentZone.bulkCreate(_incidentMainZones, {
        transaction,
      });

      if (file_name && url) {
        await Image.create(
          {
            name: file_name,
            url,
            imageable_id: event_id,
            imageable_type: PolymorphicType.INCIDENT_ZONE,
            creator_id: currentUser.id,
            creator_type: 'User',
            event_id,
          },
          { transaction },
        );
      }

      await transaction.commit();

      sendIncidentZonesUpdate(
        { message: `Uploaded Successfully` },
        event_id,
        true,
        this.pusherService,
        SocketTypes.INCIDENT_MAIN_ZONE,
        'upload',
      );

      return {
        message: RESPONSES.uploadedSuccessfully('Incident Main Zones has been'),
      };
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      throwCatchError(error);
    }
  }

  async uploadIncidentSubZone(
    uploadIncidentSubZoneDto: UploadIncidentSubZoneDto,
    currentUser: User,
  ) {
    const { event_id, incident_sub_zones, file_name, url } =
      uploadIncidentSubZoneDto;

    await withCompanyScope(currentUser, event_id);

    const transaction = await this.sequelize.transaction();

    try {
      const _incidentSubZones = await incidentSubZoneValidation(
        event_id,
        incident_sub_zones,
      );

      await IncidentZone.bulkCreate(_incidentSubZones, {
        transaction,
      });

      if (file_name && url) {
        await Image.create(
          {
            url,
            event_id,
            name: file_name,
            imageable_id: event_id,
            imageable_type: PolymorphicType.INCIDENT_ZONE,
            creator_id: currentUser.id,
            creator_type: 'User',
          },
          { transaction },
        );
      }

      await transaction.commit();

      sendIncidentZonesUpdate(
        { message: `Uploaded Successfully` },
        event_id,
        true,
        this.pusherService,
        SocketTypes.INCIDENT_SUB_ZONE,
        'upload',
      );
      return {
        message: RESPONSES.uploadedSuccessfully('Incident Sub Zones has been'),
      };
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      throwCatchError(error);
    }
  }

  async uploadIncidentCameraZone(
    uploadIncidentCameraZoneDto: UploadIncidentCameraZoneDto,
    currentUser: User,
  ) {
    const { event_id, camera_zones, file_name, url } =
      uploadIncidentCameraZoneDto;

    await withCompanyScope(currentUser, event_id);

    const transaction = await this.sequelize.transaction();

    try {
      const _cameraZones = camera_zones.map((cameraZone) => ({
        ...cameraZone,
        event_id,
      }));

      await CameraZone.bulkCreate(_cameraZones, {
        transaction,
      });

      if (file_name && url) {
        await Image.create(
          {
            url,
            event_id,
            name: file_name,
            imageable_id: event_id,
            imageable_type: PolymorphicType.INCIDENT_ZONE,
            creator_id: currentUser.id,
            creator_type: 'User',
          },
          { transaction },
        );
      }

      await transaction.commit();

      sendIncidentZonesUpdate(
        { message: `Uploaded Successfully` },
        event_id,
        true,
        this.pusherService,
        SocketTypes.INCIDENT_CAMERA_ZONE,
        'upload',
      );

      return {
        message: RESPONSES.uploadedSuccessfully('Camera Zones has been'),
      };
    } catch (error) {
      console.log(error);
      await transaction.rollback();
      throwCatchError(error);
    }
  }

  async deleteIncidentZone(id: number, event_id: number) {
    const incidentZone = await IncidentZone.findOne({
      where: { id, event_id },
      attributes: ['id', 'parent_id'],
    });

    if (!incidentZone) throw new NotFoundException(_ERRORS.ZONE_NOT_FOUND);

    let isSubZone = false;
    if (incidentZone.parent_id) isSubZone = true;

    await incidentZone.destroy();

    const response = {
      message: RESPONSES.destroyedSuccessfully(
        isSubZone ? 'Incident Sub Zone' : 'Incident Zone',
      ),
      deletedId: id,
      parentId: incidentZone.parent_id || null,
    };

    const count = await this.getAllCountForLocation(event_id);

    pushDataHelperForIncidentZone(
      { ...response, count },
      event_id,
      'delete',
      isSubZone
        ? SocketTypes.INCIDENT_SUB_ZONE
        : SocketTypes.INCIDENT_MAIN_ZONE,
      false,
      this.pusherService,
    );

    return response;
  }

  async deleteIncidentCameraZone(id: number, event_id: number) {
    const cameraZone = await isIncidentCameraZoneExist(id, event_id);

    await cameraZone.destroy();

    const response = {
      message: RESPONSES.destroyedSuccessfully('Incident Camera Zone'),
      deletedId: id,
    };

    const count = await this.getAllCountForLocation(event_id);

    pushDataHelperForIncidentZone(
      { ...response, count },
      event_id,
      'delete',
      SocketTypes.INCIDENT_CAMERA_ZONE,
      false,
      this.pusherService,
    );

    return response;
  }
}
