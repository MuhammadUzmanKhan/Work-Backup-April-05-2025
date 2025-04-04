import { Op, Sequelize } from 'sequelize';
import { Sequelize as SequelizeTypescript } from 'sequelize-typescript';
import { Request, Response } from 'express';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  Event,
  EventIncidentDivision,
  IncidentDivision,
  User,
  MessageGroup,
  Incident,
  IncidentMultipleDivision,
  UserIncidentDivision,
  Department,
  DepartmentUsers,
  EventDepartment,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  MESSAGES,
  SortBy,
  MessageGroupableType,
  RESPONSES,
  Options,
  isOntrackRole,
  notOntrackRole,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
  successInterceptorResponseFormat,
  throwCatchError,
  withCompanyScope,
  getEventForPdfs,
  checkIfAllIdsExist,
  getArrayInChunks,
  checkIfNameAlreadyExistModel,
} from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import { SocketTypes, _ERRORS, _MESSAGES } from '@Common/constants';
import { CloneDto } from '@Common/dto';
import { customSearch } from '@Common/helpers';
import {
  UpdateIncidentDivisionDto,
  CreateIncidentDivisionDto,
  IncidentDivisionQueryParamsDto,
  DivisionAssocitateOrDisassociateToEventDto,
  GetIncidentDivisionDto,
  GetDivisionNamesByEventDto,
} from './dto';
import {
  checkIfAllDivisionsExist,
  createAndUpdateMessageGroup,
  csvOrPdfForIncidentDivisionIncidentDashboard,
  generateCsvOrPdfForDepartmentsCardView,
  getCardViewHelper,
  getIncidentDivisionResolvedTime,
  getIncidentDivisionsWithResolvedTime,
  getIncidentMultipleDivisionsNotAvailable,
  sendIncidentDivisionAssociationsUpdate,
  sendUpdatedIncidentDivision,
} from './helpers';
import { eventsCount, incidentsCount, isAssigned } from './queries';

@Injectable()
export class IncidentDivisionService {
  constructor(
    private readonly httpService: HttpService,
    private readonly pusherService: PusherService,
    private sequelize: SequelizeTypescript,
  ) {}

  async createIncidentDivision(
    createIncidentDivisionDto: CreateIncidentDivisionDto,
    user: User,
  ) {
    let incidentDivision: IncidentDivision = null;
    const { event_id, name } = createIncidentDivisionDto;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfNameAlreadyExistModel(
      IncidentDivision,
      'Incident Division',
      name,
      company_id,
    );

    const transaction = await this.sequelize.transaction();

    try {
      incidentDivision = await IncidentDivision.create(
        { name, company_id },
        { transaction },
      );

      await EventIncidentDivision.create(
        { incident_division_id: incidentDivision.id, event_id },
        { transaction },
      );

      //It is after save hook in rails and is implemented here as helper function in create and update division
      await createAndUpdateMessageGroup(
        incidentDivision,
        event_id,
        transaction,
      );

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ IncidentDivisionService ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    const createdIncidentDivision = await this.getIncidentDivisionById(
      incidentDivision.id,
      event_id,
      user,
      { useMaster: true },
    );

    const count = await this.getIncidentWorkforceCount(user, event_id);

    this.pusherService.sendUpdatedIncidentDivision(
      incidentDivision,
      event_id,
      incidentDivision.id,
    );

    sendUpdatedIncidentDivision(
      { incidentDivision: createdIncidentDivision, count },
      event_id,
      'new',
      SocketTypes.INCIDENT_DIVISION,
      true,
      this.pusherService,
    );

    return createdIncidentDivision;
  }

  async manageIncidentDivisions(
    assignOrRemoveToDivisionDto: DivisionAssocitateOrDisassociateToEventDto,
    user: User,
  ) {
    const { event_id, incident_division_ids } = assignOrRemoveToDivisionDto;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfAllIdsExist(
      IncidentDivision,
      'Some of Incident Division',
      incident_division_ids,
      company_id,
    );

    for (const incident_division_id of incident_division_ids) {
      await EventIncidentDivision.findOrCreate({
        where: { event_id, incident_division_id },
      });
    }

    const eventIncidentDivisions = await EventIncidentDivision.findAll({
      where: {
        event_id,
        incident_division_id: { [Op.notIn]: incident_division_ids },
      },
      attributes: ['incident_division_id'],
    });

    const exsitingIncidentDivisionIds = eventIncidentDivisions.map(
      ({ incident_division_id }) => incident_division_id,
    );

    const incidentMultipleDivision = await IncidentMultipleDivision.findAll({
      where: { incident_division_id: { [Op.in]: exsitingIncidentDivisionIds } },
      attributes: ['incident_division_id'],
      include: [
        {
          model: Incident,
          where: { event_id },
        },
      ],
    });

    const unLinkableIncidentDivisionIds = incidentMultipleDivision.map(
      ({ incident_division_id }) => incident_division_id,
    );

    const uniqueincidentDivisonLinked = [
      ...new Set(
        unLinkableIncidentDivisionIds.map(
          (incident_division_id) => incident_division_id,
        ),
      ),
    ];

    if (incidentMultipleDivision.length) {
      const filteredIncidentDivisionIds = exsitingIncidentDivisionIds.filter(
        (id) => !uniqueincidentDivisonLinked.includes(id),
      );

      await EventIncidentDivision.destroy({
        where: {
          incident_division_id: { [Op.in]: filteredIncidentDivisionIds },
        },
      });
      throw new UnprocessableEntityException(
        `${uniqueincidentDivisonLinked.length} Incident Divisions could not be removed. These are associated with incidents.`,
      );
    } else {
      await EventIncidentDivision.destroy({
        where: {
          incident_division_id: { [Op.in]: exsitingIncidentDivisionIds },
        },
      });

      const count = await this.getIncidentWorkforceCount(user, event_id);

      sendUpdatedIncidentDivision(
        {
          message:
            _MESSAGES.INCIDENT_DIVISION_ASSOCIATIONS_UPDATED_SUCCESSFULLY,
          count,
        },
        event_id,
        'update',
        SocketTypes.INCIDENT_DIVISION,
        false,
        this.pusherService,
      );

      return {
        message: _MESSAGES.INCIDENT_DIVISION_ASSOCIATIONS_UPDATED_SUCCESSFULLY,
      };
    }
  }

  async unlinkWorkforceIncidentDivision(
    assignOrRemoveToDivisionDto: DivisionAssocitateOrDisassociateToEventDto,
    user: User,
  ) {
    const { event_id, incident_division_ids } = assignOrRemoveToDivisionDto;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfAllDivisionsExist(incident_division_ids, company_id);

    await EventIncidentDivision.destroy({
      where: {
        event_id,
        incident_division_id: { [Op.in]: incident_division_ids },
      },
    });
    try {
      this.pusherService.disassociateDivisionFromEvent(
        'Disassociated Successfully',
        event_id,
      );

      sendIncidentDivisionAssociationsUpdate(
        incident_division_ids,
        [],
        this.pusherService,
        event_id,
        this.sequelize,
        'unlink-division',
      );
    } catch (err) {
      console.log('🚀 ~ IncidentDivisionService ~ err:', err);
      throwCatchError(err);
    }

    return {
      message: _MESSAGES.INCIDENT_DIVISION_ASSOCIATIONS_UPDATED_SUCCESSFULLY,
    };
  }

  async linkWorkforceIncidentDivision(
    assignOrRemoveToDivisionDto: DivisionAssocitateOrDisassociateToEventDto,
    user: User,
  ) {
    const { event_id, incident_division_ids } = assignOrRemoveToDivisionDto;
    const newLinkedIncidentDivisions = [];
    const role_id = +user['role'];

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfAllDivisionsExist(incident_division_ids, company_id);

    for (const incident_division_id of incident_division_ids) {
      const [, created] = await EventIncidentDivision.findOrCreate({
        where: {
          event_id,
          incident_division_id,
        },
      });

      if (created) {
        newLinkedIncidentDivisions.push(incident_division_id);
      }

      const existingDivisionUsers = (
        await UserIncidentDivision.findAll({
          where: {
            incident_division_id,
          },
          attributes: ['user_id'],
        })
      ).map((userIncidentDivision) => userIncidentDivision.user_id);

      const uniqueUserIds = [...new Set(existingDivisionUsers)];

      if (uniqueUserIds.length) {
        for (const user_id of uniqueUserIds) {
          await UserIncidentDivision.findOrCreate({
            where: {
              user_id,
              event_id,
              incident_division_id,
            },
          });
        }
      }
    }
    try {
      const { rows, count } = await getCardViewHelper(
        {
          event_id,
        } as GetIncidentDivisionDto,
        company_id,
        role_id,
      );

      const incidentDivision = getArrayInChunks(
        rows.map((division) => division.toJSON()),
        5,
      );

      for (const data of incidentDivision) {
        const socketData = {
          data,
          count,
        };

        this.pusherService.associateDivisionFromEvent(
          null,
          event_id,
          socketData,
        );
      }

      sendIncidentDivisionAssociationsUpdate(
        [],
        newLinkedIncidentDivisions,
        this.pusherService,
        event_id,
        this.sequelize,
        'link-division',
      );
    } catch (err) {
      throwCatchError(err);
    }

    return {
      message: _MESSAGES.INCIDENT_DIVISION_ASSOCIATIONS_UPDATED_SUCCESSFULLY,
    };
  }

  async cloneIncidentDivision(user: User, cloneIncidentDivisionDto: CloneDto) {
    const { current_event_id, clone_event_id } = cloneIncidentDivisionDto;

    await withCompanyScope(user, clone_event_id);

    const cloneIncidentDivision = await EventIncidentDivision.findAll({
      where: { event_id: clone_event_id },
      attributes: ['incident_division_id'],
    });

    const cloneIncidentDivisionIds = cloneIncidentDivision.map(
      (data) => data?.incident_division_id,
    );

    if (!cloneIncidentDivisionIds.length)
      throw new NotFoundException(RESPONSES.notFound('Incident Division'));

    for (const incident_division_id of cloneIncidentDivisionIds) {
      await EventIncidentDivision.findOrCreate({
        where: {
          event_id: current_event_id,
          incident_division_id,
        },
      });
    }

    const count = await this.getIncidentWorkforceCount(user, current_event_id);

    sendUpdatedIncidentDivision(
      { message: 'Incident Divisions Cloned Successfully', count },
      current_event_id,
      'clone',
      SocketTypes.INCIDENT_DIVISION,
      true,
      this.pusherService,
    );

    return { message: 'Incident Divisions Cloned Successfully' };
  }

  async getAllIncidentDivisions(
    incidentDivisionQueryParamsDto: IncidentDivisionQueryParamsDto,
    user: User,
    res: Response,
    req: Request,
  ) {
    const {
      event_id,
      page,
      page_size,
      csv_pdf,
      sort_column,
      order,
      division_not_available,
      keyword,
      top_sorted,
    } = incidentDivisionQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    // checking company level permission
    let [company_id] = await withCompanyScope(user, event_id);

    const role_id = +user['role'];

    company_id = isOntrackRole(role_id) ? company_id : user['company_id'];

    const availableCount = await IncidentDivision.findAll({
      where: { company_id },
      attributes: ['id'],
      include: [
        {
          model: Event,
          where: { id: event_id, company_id },
          attributes: [],
        },
      ],
    });

    const availableDivisionIds = availableCount.map(({ id }) => id);

    const incidentDivisions = await getIncidentDivisionsWithResolvedTime(
      incidentDivisionQueryParamsDto,
      company_id,
      this.sequelize,
      availableDivisionIds,
      sort_column,
      order,
      role_id,
      _page,
      _page_size,
    );

    let rows = incidentDivisions.rows;

    if (division_not_available) {
      const incidentMultipleDivisionsNotAvailable =
        await getIncidentMultipleDivisionsNotAvailable(
          company_id,
          event_id,
          this.sequelize,
        );

      if (incidentMultipleDivisionsNotAvailable) {
        if (keyword) {
          // Convert both the name and keyword to lowercase for case-insensitive matching
          const result = customSearch(
            incidentMultipleDivisionsNotAvailable?.name,
            keyword,
          );
          // If a result is found, push 'incidentMultipleDivisionsNotAvailable' to the array
          if (result) {
            rows.push(incidentMultipleDivisionsNotAvailable);
          }
        } else {
          rows.push(incidentMultipleDivisionsNotAvailable);
        }
      }

      if (order || csv_pdf) {
        rows = rows
          .slice()
          .sort((a, b) =>
            order == SortBy.ASC
              ? a.incidents_count - b.incidents_count
              : b.incidents_count - a.incidents_count,
          );
      }
    }

    if (top_sorted) {
      rows = rows
        .filter((row) => row.incidents_count > 0) // Remove records where incidents_count is 0
        .sort((a, b) => b.incidents_count - a.incidents_count) // Sort by incidents_count in descending order
        .slice(0, 10);
    }

    if (csv_pdf) {
      const event = await getEventForPdfs(event_id, this.sequelize);

      return await csvOrPdfForIncidentDivisionIncidentDashboard(
        incidentDivisionQueryParamsDto,
        rows,
        event,
        req,
        res,
        this.httpService,
      );
    }

    const unAvailableCount = await IncidentDivision.count({
      where: {
        company_id,
        id: { [Op.notIn]: availableDivisionIds },
      },
    });

    return res.send(
      successInterceptorResponseFormat({
        data: rows,
        pagination: calculatePagination(
          incidentDivisions.count,
          page_size,
          page,
        ),
        counts: {
          availableCount: availableCount.length || 0,
          unAvailableCount: unAvailableCount || 0,
        },
      }),
    );
  }

  async getIncidentDivisionById(
    id: number,
    event_id: number,
    user: User,
    options?: Options,
  ) {
    const [company_id] = await withCompanyScope(user, event_id);

    const incidentDivision = await IncidentDivision.findOne({
      where: { id },
      attributes: [
        'id',
        'name',
        'is_test',
        'company_id',
        [
          Sequelize.literal(
            `(SELECT COUNT(id)::integer FROM "user_incident_divisions" WHERE "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" AND "user_incident_divisions"."event_id" = ${event_id})`,
          ),
          'staff_count',
        ],
        [
          Sequelize.literal(
            `(SELECT COUNT(DISTINCT department_id)::integer FROM "user_incident_divisions"
            LEFT OUTER JOIN "users" ON "user_incident_divisions"."user_id" = "users"."id" LEFT OUTER JOIN "department_users" ON "users"."id" = "department_users"."user_id"
            WHERE "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" AND "user_incident_divisions"."event_id" = ${event_id})`,
          ),
          'department_count',
        ],
        [isAssigned(event_id), 'is_assigned'],
        [incidentsCount(event_id), 'incidents_count'],
        [eventsCount, 'events_count'],
        [
          Sequelize.literal(
            `(SELECT COUNT
                ( DISTINCT ( "User"."id" ) ) ::integer AS "count"
              FROM
                "users" AS "User"
                INNER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id"
                INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${company_id}
                AND "event_users"."event_id" = ${event_id}
                INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id"
                INNER JOIN ( "event_departments" AS "department->events->EventDepartment" INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) ON "department"."id" = "department->events->EventDepartment"."department_id"
                AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = ${event_id} )
                WHERE
                ( "ucr"."role_id" NOT IN ( 0, 2, 28 ) ))`,
          ),
          'total_staff_count',
        ],

        [
          Sequelize.literal(`(SELECT COUNT(DISTINCT "user_incident_divisions"."id")::integer AS "count"
          FROM "user_incident_divisions" WHERE
          "user_incident_divisions"."event_id" = ${event_id}
           AND "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id"
          ) `),
          'available_staff_count',
        ],
        [
          Sequelize.literal(`(
          SELECT COUNT(DISTINCT "User"."id")::integer
          FROM "users" AS "User"
          INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${company_id}
          INNER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id"
          AND "event_users"."event_id" = ${event_id}
          INNER JOIN "department_users" AS "department->DepartmentUsers"
            INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id"
            ON "User"."id" = "department->DepartmentUsers"."user_id"
          INNER JOIN "event_departments" AS "department->events->EventDepartment"
            INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id"
            ON "department"."id" = "department->events->EventDepartment"."department_id"
            AND ("department->events"."deleted_at" IS NULL AND "department->events"."id" = ${event_id})
          WHERE ("ucr"."role_id" NOT IN (0, 2, 28))
            ) -
            (
              SELECT COUNT(DISTINCT "user_incident_divisions"."id")::integer
              FROM "user_incident_divisions"
              WHERE "user_incident_divisions"."event_id" = ${event_id}
              AND "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id"
            )
          `),
          'unavailable_staff_count',
        ],
        'created_at',
      ],
      include: [
        {
          model: Event,
          where: {
            id: event_id,
          },
          attributes: [],
        },
      ],
      ...options,
    });

    if (!incidentDivision)
      throw new NotFoundException(ERRORS.INCIDENT_DIVISION_NOT_FOUND);

    return (
      await getIncidentDivisionResolvedTime(
        [incidentDivision],
        event_id,
        this.sequelize,
      )
    )[0];
  }

  async findAllIncidentDivisionsCardView(
    params: GetIncidentDivisionDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_id, page_size, page } = params;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    const role_id = +user['role'];

    // checking company level permission
    await withCompanyScope(user, event_id);

    const [companyId] = await withCompanyScope(user, event_id);

    const { rows, count } = await getCardViewHelper(params, companyId, role_id);

    if (params.csv_pdf) {
      return await generateCsvOrPdfForDepartmentsCardView(
        params,
        rows,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        counts: {
          unlinkedUsers: 0,
        },
        data: rows,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async findAllDivisionNamesByEvent(
    query: GetDivisionNamesByEventDto,
    user: User,
  ) {
    const { company_id, event_id } = query;

    if (!company_id && !event_id)
      throw new ForbiddenException(ERRORS.EVENT_ID_REQUIRED);

    if (notOntrackRole(user['role']) && !company_id)
      await withCompanyScope(user, event_id);

    const allDivisionNamesByEvent = await IncidentDivision.findAll({
      where: company_id ? { company_id } : {},
      attributes: [
        [Sequelize.literal('CAST("IncidentDivision"."id" AS INTEGER)'), 'id'],
        'name',
      ],
      include: [
        {
          model: Event,
          attributes: [],
          required: !!event_id,
          where: event_id ? { id: event_id } : {},
        },
      ],
      order: [['name', SortBy.ASC]],
    });

    return {
      counts: {
        divisionCounts: allDivisionNamesByEvent?.length || 0,
      },
      data: allDivisionNamesByEvent,
    };
  }

  async getIncidentWorkforceCount(user: User, event_id: number) {
    const [company_id] = await withCompanyScope(user, event_id);

    const incidentDivisionCounts = await IncidentDivision.count({
      where: { company_id },
      include: [
        {
          model: Event,
          where: { id: event_id },
          attributes: [],
        },
      ],
      distinct: true,
    });

    const departmentCounts = await Department.count({
      where: { company_id },
      include: [
        {
          model: DepartmentUsers,
          include: [
            {
              model: User,
              include: [
                {
                  model: UserIncidentDivision,
                },
              ],
            },
          ],
        },
        {
          model: EventDepartment,
          where: { event_id },
        },
      ],
      distinct: true,
    });

    return { incidentDivisionCounts, departmentCounts };
  }

  async updateIncidentDivision(
    id: number,
    updateIncidentDivisionDto: UpdateIncidentDivisionDto,
    user: User,
  ) {
    const { event_id, name } = updateIncidentDivisionDto;

    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfNameAlreadyExistModel(
      IncidentDivision,
      'Incident Division',
      name,
      company_id,
      null,
      id,
    );

    const transaction = await this.sequelize.transaction();

    try {
      const incidentDivision = await IncidentDivision.findOne({
        where: { id },
        include: [
          {
            model: Event,
            where: { id: event_id },
            attributes: [],
          },
        ],
      });
      if (!incidentDivision)
        throw new NotFoundException(ERRORS.INCIDENT_NOT_FOUND);

      await incidentDivision.update({ name }, { transaction });

      //It is after save hook in rails and is implemented here as helper function in create and update division
      await createAndUpdateMessageGroup(
        incidentDivision,
        event_id,
        transaction,
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();

      throwCatchError(error);
    }

    const updatedIncidentDivision = await this.getIncidentDivisionById(
      id,
      event_id,
      user,
      { useMaster: true },
    );

    this.pusherService.sendUpdatedIncidentDivision(
      { ...updatedIncidentDivision, isUpdated: true },
      event_id,
      id,
    );

    return updatedIncidentDivision;
  }

  async deleteIncidentDivision(id: number, event_id: number, user: User) {
    // checking company level permission
    let [company_id] = await withCompanyScope(user, event_id);

    company_id = isOntrackRole(user['role']) ? company_id : user['company_id'];

    const incidentDivision = await IncidentDivision.findByPk(id, {
      attributes: ['id'],
    });
    if (!incidentDivision)
      throw new NotFoundException(ERRORS.INCIDENT_DIVISION_NOT_FOUND);

    const incidentDivisionEvents = await IncidentDivision.findByPk(id, {
      attributes: ['id'],
      include: [
        {
          model: Event,
          where: { company_id },
          attributes: ['id'],
        },
      ],
    });

    const incidentMultipleDivision = await IncidentMultipleDivision.findOne({
      where: {
        incident_division_id: id,
      },
      attributes: ['incident_division_id'],
      include: [
        {
          model: Incident,
          where: { event_id },
        },
      ],
    });

    if (incidentMultipleDivision?.incident) {
      throw new UnprocessableEntityException(
        _ERRORS.INCIDENT_DIVISION_HAS_BEEN_ALREADY_ASSOCIATED_WITH_OTHER_INCIDENTS_IT_CANT_BE_DESTROYED,
      );
    }

    if (incidentDivisionEvents?.events) {
      throw new UnprocessableEntityException(
        ERRORS.INCIDENT_DIVISION_HAS_BEEN_ALREADY_ASSOCIATED_TO_EVENTS_IT_CANT_BE_DESTROYED,
      );
    } else {
      await incidentDivision.destroy();

      await MessageGroup.destroy({
        where: {
          message_groupable_type: MessageGroupableType.INCIDENT_DIVISION,
          message_groupable_id: incidentDivision.id,
        },
      });

      const count = await this.getIncidentWorkforceCount(user, event_id);

      sendUpdatedIncidentDivision(
        {
          message: MESSAGES.INCIDENT_DIVISION_DESTROYED_SUCCESSFULLY,
          count,
          deletedIds: [incidentDivision.id],
        },
        event_id,
        'delete',
        SocketTypes.INCIDENT_DIVISION,
        false,
        this.pusherService,
      );

      return { message: MESSAGES.INCIDENT_DIVISION_DESTROYED_SUCCESSFULLY };
    }
  }
}
