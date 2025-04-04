import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  Image,
  Incident,
  IncidentZone,
  User,
} from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
  successInterceptorResponseFormat,
  withCompanyScope,
  getEventForPdfs,
} from '@ontrack-tech-group/common/helpers';

import { IncidentMainZoneQueryParamsDto } from './dto';
import {
  getIncidentZoneWhereQuery,
  getIncidentNoZonesAvailable,
  getCsvPdfForAllZoneListing,
  getSubZoneFilteredData,
} from './helpers';

@Injectable()
export class IncidentZoneV2Service {
  constructor(
    private readonly httpService: HttpService,
    private sequelize: Sequelize,
  ) {}

  async getAllIncidentZones(
    incidentZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
    res: Response,
    req: Request,
    user: User,
  ) {
    const {
      page,
      page_size,
      sort_column,
      order,
      csv_pdf,
      event_id,
      zone_not_available,
      keyword,
      top_sorted,
      dashboard_listing,
    } = incidentZoneQueryParamsDto;

    const [company_id] = await withCompanyScope(user, event_id);

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    let filteredData = [];

    const incidentZones = await IncidentZone.findAll({
      benchmark: true,
      logging: (...msg) =>
        console.log(
          `Incident Find & Count All Query [V2] (Load Time): `,
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
        'is_test',
        [Sequelize.literal('"incident_zone_image"."url"'), 'image_url'],
        [
          Sequelize.cast(
            Sequelize.fn(
              'COUNT',
              Sequelize.fn('DISTINCT', Sequelize.col('incidents.id')),
            ),
            'INTEGER',
          ),
          'incidents_count',
        ],
        [
          Sequelize.literal(
            '"IncidentZone"."linked_incidents_avg_resolved_time"',
          ),
          'resolved_avg_time',
        ],
        [
          Sequelize.cast(
            Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "incident_zones" AS "incident_sub_zones"
              WHERE "incident_sub_zones"."parent_id" = "IncidentZone"."id"
            )`),
            'INTEGER',
          ),
          'incident_sub_zone_count',
        ],
      ],
      where: {
        ...getIncidentZoneWhereQuery(incidentZoneQueryParamsDto),
      },
      include: [
        {
          model: Image,
          required: false,
        },
        {
          model: IncidentZone,
          as: 'incident_sub_zones',
          attributes: [
            [
              Sequelize.cast(Sequelize.col('incident_sub_zones.id'), 'INTEGER'),
              'id',
            ],
            'name',
            'longitude',
            'latitude',
            'color',
            [
              Sequelize.literal(
                '"incident_sub_zones"."linked_incidents_avg_resolved_time"',
              ),
              'resolved_avg_time',
            ],
            [
              Sequelize.cast(
                Sequelize.fn(
                  'COUNT',
                  Sequelize.fn(
                    'DISTINCT',
                    Sequelize.col('incident_sub_zones.incidents.id'),
                  ),
                ),
                'INTEGER',
              ),
              'incidents_count',
            ],
          ],
          include: [
            {
              model: Incident,
              as: 'incidents',
              attributes: [],
            },
          ],
        },
        {
          model: Incident,
          as: 'incidents',
          attributes: [],
        },
      ],
      group: [
        'incident_sub_zones.id',
        'IncidentZone.id',
        'incident_zone_image.url',
        'incident_zone_image.id',
      ],
      order: [
        ['is_test', SortBy.ASC],
        top_sorted
          ? [Sequelize.literal('incidents_count'), SortBy.DESC]
          : [
              Sequelize.literal(sort_column || `"IncidentZone"."name"`),
              order || 'ASC',
            ],
      ],
    });

    const count = incidentZones.length;

    let paginatedIncidentsZones = incidentZones;

    if (_page && _page_size)
      paginatedIncidentsZones = incidentZones.slice(_page, _page + _page_size);

    if (top_sorted) paginatedIncidentsZones = incidentZones.slice(0, 0 + 10);

    let incidentZonesData = [];
    incidentZonesData.push(...paginatedIncidentsZones);

    if (zone_not_available) {
      const incidentNoZonesAvailable = await getIncidentNoZonesAvailable(
        company_id,
        event_id,
        this.sequelize,
      );

      if (incidentNoZonesAvailable) {
        if (keyword) {
          // Convert both the name and keyword to lowercase for case-insensitive matching
          const name = incidentNoZonesAvailable.name.toLowerCase();
          const keywordLower = keyword.toLowerCase();

          // Check if any word in the 'name' contains the keyword
          const matchFound = name
            .split(' ')
            .some((word) => word.includes(keywordLower));

          // If a match is found, push 'incidentNoZonesAvailable' to the array
          if (matchFound) {
            incidentZonesData.push(incidentNoZonesAvailable);
          }
        } else {
          incidentZonesData.push(incidentNoZonesAvailable);
        }
      }

      if (top_sorted) {
        incidentZonesData = incidentZonesData
          .filter((zone) => {
            const count =
              zone.dataValues?.incidents_count ?? zone.incidents_count ?? 0;
            return count > 0; // Remove records with incidents_count of 0
          })
          .sort((a, b) => {
            const countA =
              a.dataValues?.incidents_count ?? a.incidents_count ?? 0;
            const countB =
              b.dataValues?.incidents_count ?? b.incidents_count ?? 0;
            return countB - countA;
          })
          .slice(0, 10);
      }

      if (order || csv_pdf) {
        incidentZonesData = incidentZonesData
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
        incidentZonesData,
        req,
        res,
        this.httpService,
      );
    }

    if (dashboard_listing && keyword) {
      filteredData = await getSubZoneFilteredData(incidentZonesData, keyword);
    }

    return res.send(
      successInterceptorResponseFormat({
        data: filteredData.length ? filteredData : incidentZonesData,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getAllIncidentZonesOLDV2(
    incidentZoneQueryParamsDto: IncidentMainZoneQueryParamsDto,
    res: Response,
    req: Request,
    user: User,
  ) {
    const {
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
        'linked_incidents_avg_resolved_time',
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
        'linked_incidents_avg_resolved_time',
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

          const { linked_incidents_avg_resolved_time, ...rest } =
            filteredSubZone;
          return {
            ...rest,
            incidents_count: getIncidentCount(filteredSubZone.id),
            resolved_avg_time: linked_incidents_avg_resolved_time,
          };
        }),
      };
    };

    // Preparing Main Payload
    IncidentZonesData = IncidentZonesData.map((IncidentZoneData) => {
      // incident_zone_image
      delete IncidentZoneData.incident_zone_image;

      const { linked_incidents_avg_resolved_time, ...rest } = IncidentZoneData;

      return {
        ...rest,
        incidents_count: getIncidentCount(IncidentZoneData.id),
        ...getSubZones(IncidentZoneData.id),
        resolved_avg_time: linked_incidents_avg_resolved_time,
      };
    });

    if (zone_not_available) {
      const incidentNoZonesAvailable = await getIncidentNoZonesAvailable(
        company_id,
        event_id,
        this.sequelize,
      );

      if (incidentNoZonesAvailable) {
        if (keyword) {
          // Convert both the name and keyword to lowercase for case-insensitive matching
          const name = incidentNoZonesAvailable.name.toLowerCase();
          const keywordLower = keyword.toLowerCase();

          // Check if any word in the 'name' contains the keyword
          const matchFound = name
            .split(' ')
            .some((word) => word.includes(keywordLower));

          // If a match is found, push 'incidentNoZonesAvailable' to the array
          if (matchFound) {
            IncidentZonesData.push(incidentNoZonesAvailable);
          }
        } else {
          IncidentZonesData.push(incidentNoZonesAvailable);
        }
      }

      if (order || csv_pdf) {
        IncidentZonesData = IncidentZonesData.slice().sort((a, b) =>
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
        IncidentZonesData,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: IncidentZonesData,
        pagination: calculatePagination(totalUniqueCount, _page_size, _page),
      }),
    );
  }
}
