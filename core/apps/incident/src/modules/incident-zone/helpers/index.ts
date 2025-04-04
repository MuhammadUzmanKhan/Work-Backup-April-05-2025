import { Op, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  PusherService,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import {
  CameraZone,
  Event,
  Incident,
  IncidentZone,
} from '@ontrack-tech-group/common/models';
import {
  CsvOrPdf,
  ERRORS,
  Options,
  PdfTypes,
  PusherChannels,
  PusherEvents,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { _ERRORS, IncidentZoneColors } from '@Common/constants';
import { formatEventCamelCaseForPdfs } from '@Common/helpers';
import { IncidentZoneQueryParamsDto } from '../dto/incident-zone-query.dto';
import {
  CameraZoneQueryParamsDto,
  IncidentMainZoneQueryParamsDto,
  IncidentSubZoneQueryParamsDto,
  UploadIncidentMainZoneRecordDto,
  UploadIncidentSubZoneRecordDto,
} from '../dto';

/**
 * @returns It generates a WHERE clause object based on the provided filters for querying incident zones.
 */
export const getIncidentZoneWhereQuery = (
  filters: IncidentZoneQueryParamsDto,
) => {
  const _where = {};
  const {
    event_id,
    filter_by_sequence,
    keyword,
    is_located,
    id,
    color,
    date,
    csv_pdf,
    dashboard_listing,
  } = filters;
  _where['event_id'] = event_id;

  _where['parent_id'] = null;

  if (id) _where['id'] = id;

  if (color === IncidentZoneColors.DEFAULT)
    _where['color'] = {
      [Op.in]: [null, IncidentZoneColors.DEFAULT],
    };
  else if (color) _where['color'] = color;

  if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      ...(dashboard_listing
        ? [
            {
              '$incident_sub_zones.name$': {
                [Op.iLike]: `%${keyword.toLowerCase()}%`,
              },
            },
          ]
        : []),
    ];
  }

  if (filter_by_sequence) _where['sequence'] = filter_by_sequence;

  if (is_located) _where['latitude'] = { [Op.not]: null };
  else if (is_located == false) _where['latitude'] = null;

  if (date) {
    const _date = new Date(date);
    _where['created_at'] = {
      [Op.between]: [
        _date.setHours(0, 0, 0, 0),
        _date.setHours(23, 59, 59, 999),
      ],
    };
  }

  if (csv_pdf) _where['is_test'] = false;

  return _where;
};

export const getIncidentZoneWhereQueryForPdf = (
  filters: IncidentZoneQueryParamsDto,
) => {
  const _where = {};
  const { event_id, keyword } = filters;

  _where['event_id'] = event_id;

  if (keyword) _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };

  return _where;
};

export const getIncidentSubZoneWhereQuery = (
  filters: IncidentSubZoneQueryParamsDto,
) => {
  const _where = {};
  const {
    event_id,
    keyword,
    filter_by_sequence,
    parent_id,
    is_located,
    id,
    color,
  } = filters;

  _where['event_id'] = event_id;

  _where['parent_id'] = {
    [Op.ne]: null,
  };

  if (parent_id) {
    _where['parent_id'] = parent_id;
  }

  if (id) _where['id'] = id;

  if (color) _where['color'] = color;

  if (color === IncidentZoneColors.DEFAULT) {
    _where['color'] = null;
  }

  if (keyword) _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };

  if (filter_by_sequence) _where['sequence'] = filter_by_sequence;

  if (is_located) _where['latitude'] = { [Op.not]: null };
  else if (is_located == false) _where['latitude'] = null;

  return _where;
};

export const getCameraZoneWhereQuery = (filters: CameraZoneQueryParamsDto) => {
  const _where = {};
  const { event_id, keyword, is_located, id } = filters;

  _where['event_id'] = event_id;

  if (id) _where['id'] = id;

  if (keyword) _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };

  if (is_located) _where['latitude'] = { [Op.not]: null };
  else if (is_located == false) _where['latitude'] = null;

  return _where;
};

export const getCsvPdfForAllZoneListing = async (
  params: IncidentZoneQueryParamsDto,
  event: Event,
  incidentZones: IncidentZone[],
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  const allIncidentZones = incidentZones
    .reduce((acc, mainZone) => {
      mainZone = mainZone.dataValues ? mainZone.dataValues : mainZone;
      acc.push(mainZone); // Add main zone

      // Extract sub-zones (no filtering based on incidents_count)
      const subZones = mainZone.incident_sub_zones || [];

      // Remove the nested structure to avoid duplicate data
      delete mainZone.incident_sub_zones;

      const plainIncidentZones = subZones.map((zone) =>
        zone.dataValues ? zone.dataValues : zone,
      );

      acc = acc.concat(plainIncidentZones); // Move sub-zones as main objects

      return acc;
    }, [])
    .sort((a, b) => b.incidents_count - a.incidents_count) // Keep sorting but don't filter
    .filter((zone) => zone.incidents_count); // Ensure no zones with 0 incidents

  // Extract the year from the event or use the current year
  const year = new Date().getFullYear().toString();

  // Construct the file name in the desired format
  const file_name = `${event.name}-${year}-IncidentsByZone`;

  if (params.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedZoneForCsv = getFormattedZoneDataForCsv(allIncidentZones);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedZoneForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="incident-zone.csv"');

    return res.send(response.data);
  } else if (params.csv_pdf === CsvOrPdf.PDF) {
    // Formatting data for pdf
    const formattedIncidentZoneDataForPdf =
      getFormattedIncidentZoneDataForPdf(allIncidentZones);

    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      {
        event: formatEventCamelCaseForPdfs(event),
        incidentZones: formattedIncidentZoneDataForPdf,
        totalIncidentCounts: formattedIncidentZoneDataForPdf.length,
      },
      CsvOrPdf.PDF,
      PdfTypes.INCIDENT_BY_ZONE,
      file_name,
    );

    return res.send(response.data);
  }
};

export const getCsvForAllCameraListing = async (
  cameraZone: CameraZone[],
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  // Formatting data for csv
  const formattedZoneForCsv = getFormattedCameraZoneDataForCsv(
    cameraZone.map((camera) => camera.get({ plain: true })),
  );

  // Api call to lambda for getting csv
  // TODO: define type for response instead of any.
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedZoneForCsv,
    CsvOrPdf.CSV,
  );

  // Setting Headers for csv and sending csv in response
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', 'attachment; filename="camera-zone.csv"');
  return res.send(response.data);
};

const getFormattedZoneDataForCsv = (incidentZones: IncidentZone[]) => {
  return incidentZones.map((incidentZone: IncidentZone) => {
    return {
      'Zone Name': incidentZone.name,
      Resolution: incidentZone['resolved_avg_time'] + ' h/m Avg',
      'Linked Incidents': incidentZone['incidents_count'],
    };
  });
};

export const getFormattedIncidentZoneDataForPdf = (
  incidentZones: IncidentZone[],
) => {
  return incidentZones.map((incidentZone) => {
    return {
      name: incidentZone.name,
      durationTime: incidentZone['resolved_avg_time'],
      incidentCount: incidentZone['incidents_count'],
    };
  });
};

const getFormattedCameraZoneDataForCsv = (cameraZones: CameraZone[]) => {
  return cameraZones.map((cameraZone: CameraZone) => {
    return {
      'Camera Name': cameraZone.name,
      Url: cameraZone.url || '--',
    };
  });
};

export const getIncidentZoneWithResolvedTime = async (
  incidentMainZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
  sequelize: Sequelize,
  page?: number,
  page_size?: number,
) => {
  const { sort_column, order, return_resolved_time, event_id } =
    incidentMainZoneQueryParamsDto;
  const incidentZonesWithResolvedAverageTime = [];

  const incidentZone = await IncidentZone.findAndCountAll({
    where: getIncidentZoneWhereQueryForPdf(incidentMainZoneQueryParamsDto),
    attributes: ['id'],
    order: [['id', SortBy.ASC]],
    limit: page_size || undefined,
    offset: page_size && page ? page_size * page : undefined,
  });

  const { rows } = incidentZone;
  const incidentZoneIds = rows.map((user) => user.id);

  const incidentZonesData = await IncidentZone.findAll({
    where: { id: { [Op.in]: incidentZoneIds } },
    attributes: [
      'id',
      'event_id',
      'name',
      [
        Sequelize.literal(`(
          SELECT COUNT ("incidents"."id")::INTEGER FROM incidents
          WHERE "IncidentZone"."id" = "incidents"."incident_zone_id" limit 1
        )`),
        'incidents_count',
      ],
    ],
    include: [
      {
        model: Incident,
        attributes: [],
      },
    ],
    group: [`"incidents"."id"`, `"IncidentZone"."id"`],
    subQuery: false,
    order: [[sort_column || 'id', order || SortBy.ASC]],
  });

  if (return_resolved_time) {
    const result = await sequelize.query(
      `SELECT * FROM get_incident_zone_resolved_time(${event_id}, VARIADIC ARRAY[${[
        incidentZonesData.map((row) => row.id),
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
      const incidentZone = _incidentZone.get({ plain: true });

      incidentZonesWithResolvedAverageTime.push({
        ...incidentZone,
        resolved_avg_time: response[incidentZone.id]?.avg_resolved_time,
      });
    }
  }
  return return_resolved_time
    ? incidentZonesWithResolvedAverageTime
    : incidentZonesData;
};

export const isIncidentZoneExist = async (
  id: number,
  event_id: number = undefined,
  options?: Options,
) => {
  const incidentZone = await IncidentZone.findOne({
    where: {
      id,
      ...(event_id && { event_id }),
    },
    ...options,
  });
  if (!incidentZone) throw new NotFoundException(_ERRORS.ZONE_NOT_FOUND);
  return incidentZone;
};

export const isIncidentCameraZoneExist = async (
  id: number,
  event_id: number = undefined,
) => {
  const incidentCameraZone = await CameraZone.findOne({
    where: {
      id,
      ...(event_id && { event_id }),
    },
    attributes: ['id'],
  });
  if (!incidentCameraZone)
    throw new NotFoundException(_ERRORS.CAMERA_ZONE_NOT_FOUND);
  return incidentCameraZone;
};

export function pushDataHelperForIncidentZone(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_ZONE],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}

export const sendIncidentZonesUpdate = (
  incidentZone,
  event_id: number,
  newEntry: boolean,
  pusherService: PusherService,
  type: string,
  status: string,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_ZONE],
    {
      incidentZone,
      type,
      newEntry,
      status,
    },
  );
};

export const incidentMainZoneValidation = async (
  event_id: number,
  incident_main_zones: UploadIncidentMainZoneRecordDto[],
) => {
  const incidentNames = [];

  const incidentMainZones = incident_main_zones.map((incidentMainZone) => {
    if (!incidentNames.includes(incidentMainZone.name)) {
      incidentNames.push(incidentMainZone.name);

      return {
        ...incidentMainZone,
        event_id,
        parent_id: null,
      };
    }
  });

  const incidentZoneWithDuplicateNames = await IncidentZone.findAll({
    attributes: ['name'],
    where: {
      event_id,
      name: {
        [Op.in]: incidentNames,
      },
    },
  });

  const filteredIncidentMainZones = incidentMainZones.filter(
    (mainZone) =>
      !incidentZoneWithDuplicateNames.some(
        (duplicateZone) => duplicateZone.name === mainZone.name,
      ),
  );

  return filteredIncidentMainZones;
};

export const incidentSubZoneValidation = async (
  event_id: number,
  incident_sub_zones: UploadIncidentSubZoneRecordDto[],
) => {
  const incidentNames = [];
  const parent_ids = [];

  const incidentSubZones = incident_sub_zones.map((incidentSubZone) => {
    if (!incidentNames.includes(incidentSubZone.name)) {
      if (incidentSubZone.parent_id) parent_ids.push(incidentSubZone.parent_id);
      else throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);

      incidentNames.push(incidentSubZone.name);

      return {
        ...incidentSubZone,
        event_id,
        parent_id: incidentSubZone.parent_id,
      };
    }
  });

  const incidentZoneWithDuplicateNames = await IncidentZone.findAll({
    attributes: ['name'],
    where: {
      event_id,
      name: {
        [Op.in]: incidentNames,
      },
    },
  });

  const filteredIncidentSubZones = incidentSubZones.filter(
    (mainZone) =>
      !incidentZoneWithDuplicateNames.some(
        (duplicateZone) => duplicateZone.name === mainZone.name,
      ),
  );

  const allParentIncidentExists = await IncidentZone.findOne({
    attributes: ['id'],
    where: {
      event_id,
      id: {
        [Op.in]: parent_ids,
      },
    },
  });

  if (!allParentIncidentExists)
    throw new ConflictException(_ERRORS.PARENT_ZONE_NOT_FOUND);

  return filteredIncidentSubZones;
};

export const getIncidentNoZonesAvailable = async (
  company_id: number,
  event_id: number,
  sequelize: Sequelize,
) => {
  const incidents = await Incident.findAll({
    attributes: ['id'],
    where: {
      event_id,
      company_id,
      incident_zone_id: {
        [Op.is]: null,
      },
    },
  });

  if (incidents.length) {
    const incidentids = incidents.map((row) => row.id);

    const result = await sequelize.query(
      `SELECT * FROM get_incident_avg_resolved_time(${event_id}, VARIADIC ARRAY[${[
        incidentids,
      ]}])`,
      {
        type: QueryTypes.SELECT,
      },
    );

    return {
      id: 0,
      resolved_avg_time:
        result[0]['get_incident_avg_resolved_time'].avg_resolved_time,
      name: 'Field Location Logged',
      company_id,
      incidents_count: incidents.length,
    };
  } else return null;
};

export const getResolvedTimeForZone = async (
  eventId: number,
  incidentZone: IncidentZone,
  sequelize: Sequelize,
) => {
  const subZoneIds = incidentZone.incident_sub_zones.map(
    (subZone) => subZone.id,
  );

  const result = await sequelize.query(
    `SELECT * FROM get_incident_zone_resolved_time(${eventId}, VARIADIC ARRAY[${[
      incidentZone.id,
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
  const incidentZonesWithResolvedAverageTime = [];
  const incidentSubZonesWithResolvedAverageTime = [];

  const _incidentZone = incidentZone.get({ plain: true });
  const { incident_sub_zones } = incidentZone;

  /**
   * INCIDENT SUB ZONES
   * We iterate over each _incidentSubZone in the incidentSubZones array using a for...of loop.
   * Inside the loop, we call the resolvedAvgTime function with the appropriate parameters and await its result.
   * The resolved average time is then added to incidentSubZonesWithResolvedAverageTime array along with the other properties of _incidentSubZone using the spread syntax.
   */
  for (const _incidentSubZone of incident_sub_zones) {
    incidentSubZonesWithResolvedAverageTime.push({
      ..._incidentSubZone.get({ plain: true }),
      resolved_avg_time: response[_incidentSubZone.id]?.avg_resolved_time,
    });
  }

  incidentZonesWithResolvedAverageTime.push({
    ..._incidentZone,
    incident_sub_zones: incident_sub_zones.length
      ? incidentSubZonesWithResolvedAverageTime
      : [],
    resolved_avg_time: response[incidentZone.id]?.avg_resolved_time,
  });

  return incidentZonesWithResolvedAverageTime;
};

export const getIncidentZoneById = async (
  id: number,
  event_id: number,
  sequelize: Sequelize,
  options?: Options,
) => {
  const incidentZone = await IncidentZone.findOne({
    where: {
      id,
      event_id,
    },
    attributes: {
      include: [
        [
          Sequelize.cast(
            Sequelize.fn('COUNT', Sequelize.col('incidents.id')),
            'INTEGER',
          ),
          'incidents_count',
        ],
        [
          Sequelize.cast(
            Sequelize.fn('COUNT', Sequelize.col('incident_sub_zones.id')),
            'INTEGER',
          ),
          'incident_sub_zone_count',
        ],
      ],
    },
    include: [
      {
        model: Incident,
        attributes: [],
      },
      {
        model: IncidentZone,
        attributes: [
          'id',
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
        as: 'incident_sub_zones',
      },
    ],
    group: [`"IncidentZone"."id"`, `"incident_sub_zones"."id"`],
    ...options,
  });
  if (!incidentZone) throw new NotFoundException(_ERRORS.ZONE_NOT_FOUND);

  return (await getResolvedTimeForZone(event_id, incidentZone, sequelize))[0];
};

export const getIncidentSubZone = async (parent_id: number) => {
  return await IncidentZone.findAll({
    where: { parent_id },
    attributes: ['id'],
  });
};

export const checkZoneWithSameName = async (
  name: string,
  event_id: number,
  parent_id?: number,
  id?: number,
) => {
  const where = {};

  where['event_id'] = event_id;

  where['name'] = { [Op.iLike]: name.toLowerCase() };

  where['parent_id'] = parent_id ? parent_id : null;

  if (id) where['id'] = { [Op.ne]: id };

  const alreadyExistZone = await IncidentZone.findOne({
    where,
  });

  if (alreadyExistZone)
    throw new ConflictException(_ERRORS.INCIDENT_ZONE_ALREADY_EXISTS);

  return true;
};

export const getSubZoneFilteredData = async (
  incidentZonesData: IncidentZone[],
  keyword: string,
) => {
  const fileredIncidentZoneAndSubZone = [];
  incidentZonesData.forEach((zone) => {
    // Convert zone to a plain object to avoid circular structures
    const plainZone = zone.get ? zone.get({ plain: true }) : zone;

    // Check if the main zone name matches the keyword
    if (plainZone.name.toLowerCase().includes(keyword.toLowerCase())) {
      fileredIncidentZoneAndSubZone.push({
        ...plainZone,
        incident_sub_zones: [], // Remove sub-zones from the main object
      });
    }

    // Check if any sub-zone name matches the keyword
    plainZone.incident_sub_zones.forEach((subZone) => {
      const plainSubZone = subZone.get ? subZone.get({ plain: true }) : subZone;

      if (plainSubZone.name.toLowerCase().includes(keyword.toLowerCase())) {
        fileredIncidentZoneAndSubZone.push(plainSubZone);
      }
    });
  });

  return fileredIncidentZoneAndSubZone;
};
