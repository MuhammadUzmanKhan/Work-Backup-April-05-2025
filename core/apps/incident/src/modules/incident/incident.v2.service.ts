import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  calculatePagination,
  getCompanyScope,
  getPageAndPageSizeWithDefault,
  getQueryListParam,
  getUserRole,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { Incident, User } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  IncidentPriorityApi,
  LegalModuleRoles,
  PaginationInterface,
} from '@ontrack-tech-group/common/constants';
import {
  FormattedIncidentData,
  UserWithCompanyId,
} from '@Common/constants/interfaces';

import { GetIncidentLegalCountDto, IncidentQueryParamsDto } from './dto';
import {
  availableDivisionIncidentIds,
  getIncidentsOrder,
  unAvailableDivisionIncidentIds,
  csvToArrayParser,
  getIncidentCountsHelper,
  getIncidentCountsForLegal,
  getLinkedIncidentIdsForListingV2,
} from './helpers';
import { getIncidentWhereQuery } from './helpers/where';
import { IncidentService } from './incident.service';
import { serialiserForAllIncident } from './helpers/queries';
import { incidentCommonAttributes } from './helpers/attributes';
import { getIncidentsIncludeForIdsV2 } from './helpers/includes';
import {
  GetIncidentCount,
  GetIncidentLegalCount,
  LegalCountsInterface,
} from './helpers/interfaces';

@Injectable()
export class IncidentV2Service {
  constructor(private readonly incidentService: IncidentService) {}

  async getAllIncidents(
    incidentQueryParamsDto: IncidentQueryParamsDto,
    user: User,
  ): Promise<{
    data: FormattedIncidentData[];
    pagination: PaginationInterface;
    counts: { legal: { concluded: number; archived: number; open: number } };
  }> {
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
      is_legal,
      department_ids,
      keyword,
    } = incidentQueryParamsDto;

    if (!LegalModuleRoles.includes(getUserRole(user)) && is_legal) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    let company_id!: number;
    let companyIds: number[] = []; // company and it's sub-company ids
    let incidentsForLegalCounts: LegalCountsInterface = {
      concluded: 0,
      archived: 0,
      open: 0,
    };

    // Process the query parameters
    let incidentDivisionIds!: number[];
    let linkedIncidentIds!: number[];
    let availableDivisionIds!: number[];
    let unAvailableDivisionIds!: number[];
    let reporterIds!: number[];

    const _priorities = getQueryListParam(priorities);

    // Set default values for pagination
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    if (event_id) {
      // Retrieve the company ID with the given user and event context
      [company_id] = await withCompanyScope(user, event_id);
    } else {
      // fetching legal attributes counts e.g concluded, open, etc
      [, companyIds] = await getCompanyScope(
        user,
        incidentQueryParamsDto.company_id ||
          (user as UserWithCompanyId).company_id, // This applies to the case where company_id is not present in the filter. In this scenario, the user’s associated company_id is passed to retrieve the company and its corresponding subcompany IDs.
      );

      company_id = incidentQueryParamsDto.company_id;

      incidentsForLegalCounts = await getIncidentCountsForLegal(
        companyIds,
        company_id,
        keyword,
      );
    }

    if (incident_division_ids || incident_division_id) {
      incidentDivisionIds = getQueryListParam(
        incident_division_ids || incident_division_id,
      );
    }

    if (department_ids) {
      reporterIds = getQueryListParam(department_ids);
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

    // Handle linked incidents if incident_id is provided
    if (incident_id) {
      const linkedIncidents = await getLinkedIncidentIdsForListingV2(
        incident_id,
        event_id,
        user,
      );

      linkedIncidentIds = linkedIncidents.map((data) => data.id);
      linkedIncidentIds.push(incident_id);
    }

    // fetching incidents with single association
    const incidentsFindAndCount = await Incident.findAndCountAll({
      attributes: [...incidentCommonAttributes, 'department_id'],
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
        linkedIncidentIds,
        companyIds,
      ),
      include: getIncidentsIncludeForIdsV2(
        user,
        incidentDivisionIds,
        division_not_available,
        incidentQueryParamsDto,
        reporterIds,
      ),
      order: getIncidentsOrder(incidentQueryParamsDto, true),
      group: [
        `"Incident"."id"`,
        `"resolved_incident_note"."id"`,
        `"event"."name"`,
        `"legal_group"."id"`,
      ],
      offset: _page && _page_size ? _page * _page_size : undefined,
      limit: _page_size,
      subQuery: false,
      benchmark: true,
    });

    return {
      data: await serialiserForAllIncident(
        incidentsFindAndCount.rows,
        company_id,
        event_id,
        user,
      ),
      pagination: calculatePagination(
        incidentsFindAndCount.count.length || 0,
        _page_size,
        _page,
      ),
      counts: {
        legal: incidentsForLegalCounts,
      },
    };
  }

  async getIncidentLegalCount(
    getIncidentLegalCount: GetIncidentLegalCountDto,
    user: User,
  ): Promise<GetIncidentLegalCount> {
    if (!LegalModuleRoles.includes(getUserRole(user))) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    const { company_id, keyword } = getIncidentLegalCount;

    const [, companyIds] = await getCompanyScope(
      user,
      company_id || (user as UserWithCompanyId).company_id,
    );

    return await getIncidentCountsForLegal(companyIds, company_id, keyword);
  }

  async getIncidentCounts(
    incidentQueryParamsDto: IncidentQueryParamsDto,
    user: User,
  ): Promise<GetIncidentCount> {
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

    if (department_ids) {
      reporterIds = getQueryListParam(department_ids);
    }

    const _priorities: IncidentPriorityApi[] = getQueryListParam(priorities);

    if (incident_division_ids)
      availableDivisionIds =
        await availableDivisionIncidentIds(incidentDivisionIds);

    if (division_not_available)
      unAvailableDivisionIds = await unAvailableDivisionIncidentIds(event_id);

    return await getIncidentCountsHelper(
      event_id,
      user,
      incidentQueryParamsDto,
      company_id,
      _priorities,
      availableDivisionIds,
      unAvailableDivisionIds,
      reporterIds,
    );
  }
}
