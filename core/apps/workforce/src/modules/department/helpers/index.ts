import { Op, Sequelize, Transaction } from 'sequelize';
import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  CsvOrPdf,
  ERRORS,
  EventStatus,
  isGlobalRole,
  isOntrackRole,
  MessageType,
  Options,
  PolymorphicType,
  PusherChannels,
  PusherEvents,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  MessageGroup,
  Department,
  User,
  EventDepartment,
  Incident,
  EventUser,
  UserCompanyRole,
  IncidentDivision,
  UserIncidentDivision,
  Event,
  DepartmentUsers,
  Location,
} from '@ontrack-tech-group/common/models';
import {
  currentCompanies,
  getFormattedDepartmentsCardViewDataForCsv,
  getPageAndPageSize,
} from '@ontrack-tech-group/common/helpers';
import {
  PusherService,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import { DepartmentsQueryDto, EventUserDepartmentDto } from '../dto';
import {
  getActiveStaffCount,
  getDepartmentStaffCount,
  getAvailableStaffCount,
} from '../queries';
import { _ERRORS, workforceRoleConditions } from '@Common/constants';

export const createAndUpdateMessageGroup = async (
  department: Department,
  event_id: number,
  transaction?: Transaction,
) => {
  if (!event_id) return;

  const findMessageGroup = {
    event_id,
    message_groupable_type: 'Department',
    message_groupable_id: department.id,
    company_id: department.company_id,
  };

  const group = await MessageGroup.findOne({
    where: findMessageGroup,
    paranoid: false,
  });

  if (group) {
    group['name'] = department.name;
    group['message_type'] = MessageType.DEPARTMENT;

    await group.restore({ transaction });
    return await group.save({ transaction });
  } else {
    return await MessageGroup.create(
      {
        ...findMessageGroup,
        name: department.name,
        message_type: MessageType.DEPARTMENT,
      },
      { transaction },
    );
  }
};

export const getDepartmentWhereFilter = (
  filters: DepartmentsQueryDto,
  company_id: number,
  department_ids?: number[],
) => {
  const { keyword, department_id } = filters;
  const _where = {};

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  if (department_id) _where['id'] = department_id;

  if (company_id) _where['company_id'] = company_id;

  if (department_ids?.length)
    _where['id'] = {
      [Op.in]: department_ids,
    };

  return _where;
};

export const departmentAttributes = (
  company_id: number,
  event_id: number,
  role_id: number,
) =>
  [
    'company_id',
    'contact_person',
    'email',
    'phone',
    getDepartmentStaffCount(company_id, event_id, role_id),
    getAvailableStaffCount(company_id, event_id, role_id),
    getActiveStaffCount(company_id, event_id, role_id),
    [
      Sequelize.literal(`(
        SELECT COUNT(*)::INTEGER FROM "incidents"
        INNER JOIN "incident_department_users" ON "incidents"."id" = "incident_department_users"."incident_id"
        WHERE "incident_department_users"."department_id" = "Department"."id" AND "incidents"."event_id" = ${event_id}
      )`),
      'incidents_count',
    ],
    [
      Sequelize.literal(`EXISTS (
        SELECT 1 FROM "event_departments"
        WHERE "event_departments"."department_id" = "Department"."id" 
        AND "event_departments"."event_id" = ${event_id}
      )`),
      'is_assigned',
    ],
    [
      Sequelize.literal(`(
        SELECT COUNT(DISTINCT "user_incident_divisions"."incident_division_id")::INTEGER FROM "department_users"
        INNER JOIN "users" ON "department_users"."user_id" = "users"."id" 
        INNER JOIN "user_incident_divisions" ON "users"."id" = "user_incident_divisions"."user_id" 
        WHERE "Department"."id" = "department_users"."department_id" 
      )`),
      'divisions',
    ],
    [
      Sequelize.literal(`(SELECT 
      EXISTS (
        SELECT 1 FROM "users"
        INNER JOIN "event_users" ON "event_users"."user_id" = "users"."id"
        INNER JOIN "events" ON "events"."deleted_at" IS NULL 
        AND "events"."id" = "event_users"."event_id"
        INNER JOIN "locations" ON "locations"."locationable_id" = "users"."id" 
        AND "locations"."locationable_type" = 'User'
        INNER JOIN "department_users" ON "users"."id" = "department_users"."user_id" 
        WHERE "department_users"."department_id" = "Department"."id" 
        AND "events"."id" = ${event_id} LIMIT 1 )
      )`),
      'staff_location_exist',
    ],
  ] as any;

export const departmentIdsAttributes = (event_id: number) =>
  [
    [
      Sequelize.literal(`EXISTS (
        SELECT 1 FROM "event_departments"
        WHERE "event_departments"."department_id" = "Department"."id" 
        AND "event_departments"."event_id" = ${event_id}
      )`),
      'is_assigned',
    ],
  ] as any;

export const generateCsvOrPdfForDepartmentsCardView = async (
  params: DepartmentsQueryDto | EventUserDepartmentDto,
  req: Request,
  res: Response,
  httpService: HttpService,
  departments?: Department[],
) => {
  if (params.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedDepartmentsCardViewDataForCsv =
      getFormattedDepartmentsCardViewDataForCsv(departments);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedDepartmentsCardViewDataForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set(
      'Content-Disposition',
      'attachment; filename="event_departments.csv"',
    );
    return res.send(response.data);
  } else if (params.csv_pdf === CsvOrPdf.PDF) {
    throw new NotImplementedException(
      ERRORS.REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT,
    );
  }
};

export const departmentCompaniesPermission = async (id: number, user: User) => {
  const _where = {};
  if (isOntrackRole(user['role'])) {
    _where['id'] = id;
  } else if (isGlobalRole(user['role'])) {
    const currentCompaniesIds = await currentCompanies(user);
    _where[Op.and] = [
      {
        id,
        company_id: {
          [Op.in]: currentCompaniesIds,
        },
      },
    ];
  } else {
    _where[Op.and] = [
      {
        id,
        company_id: user['company_id'],
      },
    ];
  }

  return _where;
};

export const checkRelatedDepartment = async (
  event_id: number,
  department_ids,
) => {
  const existindDepartments = await EventDepartment.findAll({
    where: { event_id, department_id: { [Op.notIn]: department_ids } },
    attributes: ['department_id'],
  });
  const existingdepartmentIds = existindDepartments.map(
    ({ department_id }) => department_id,
  );

  const reporterIncidentDepartemnts = await Incident.findAll({
    where: { event_id, reporter_id: { [Op.in]: existingdepartmentIds } },
    attributes: ['reporter_id'],
  });
  const reporterIncidentDepartmentsIds = reporterIncidentDepartemnts.map(
    ({ reporter_id }) => reporter_id,
  );

  const dispatchedIncidentDepartments = await Department.findAll({
    where: { id: { [Op.in]: existingdepartmentIds } },
    attributes: ['id'],
    include: [
      {
        model: Incident,
        where: { event_id },
        through: { attributes: [] },
      },
    ],
  });
  const dispatchedIncidentDepartmentsIds = dispatchedIncidentDepartments.map(
    ({ id }) => id,
  );
  const excludeDepartments = [
    ...reporterIncidentDepartmentsIds,
    ...dispatchedIncidentDepartmentsIds,
  ];
  const departmentToRemove = existingdepartmentIds.filter(
    (id) => !excludeDepartments.includes(id),
  );

  return {
    reporterIncidentDepartmentsIds,
    dispatchedIncidentDepartmentsIds,
    departmentToRemove,
    existingdepartmentIds,
  };
};

export const destroyDepartmentData = async (
  event_id: number,
  company_id: number,
  departmentToRemove: number[],
  transaction: Transaction,
) => {
  await EventDepartment.destroy({
    where: { department_id: { [Op.in]: departmentToRemove } },
  });

  await MessageGroup.destroy({
    where: {
      event_id,
      message_groupable_type: 'Department',
      message_groupable_id: departmentToRemove,
    },
    transaction,
  });

  const eventUsers = await EventUser.findAll({
    where: {
      event_id,
    },
    attributes: ['id'],
    include: [
      {
        model: User,
        where: { company_id },
        attributes: ['id'],
        include: [
          {
            model: Department,
            attributes: ['id'],
            where: {
              id: { [Op.in]: departmentToRemove },
              company_id,
            },
          },
        ],
      },
    ],
  });

  await EventUser.destroy({
    where: { id: { [Op.in]: eventUsers.map((eu) => eu.id) } },
    transaction,
  });
};

export const userCompanyRoleData: any = (role: number, company_id: number) => [
  {
    model: UserCompanyRole,
    where: {
      role_id: {
        [Op.notIn]: workforceRoleConditions[role]
          ? workforceRoleConditions[role]
          : [0, 28, 26, 27, 2, 32, 33],
      },
      company_id,
    },
    attributes: [],
  },
];

export const getStaffCounts = async (
  event_id: number,
  is_assigned: boolean,
  company_id: number,
  user: User,
) => {
  const users = await User.findAll({
    where: { blocked_at: { [Op.eq]: null } },
    attributes: [
      'id',
      [
        Sequelize.literal(
          `CASE WHEN "event_users"."event_id" IS NOT NULL THEN true ELSE false END`,
        ),
        'is_active',
      ],
    ],
    include: [
      {
        model: EventUser,
        where: { event_id },
        attributes: [],
        required: false,
      },
      {
        model: Department,
        through: { attributes: [] },
        attributes: [],
        required: !!is_assigned,
        include: [
          {
            model: Event,
            where: { id: event_id },
            attributes: [],
            through: { attributes: [] },
            required: true,
          },
        ],
      },
      {
        model: UserIncidentDivision,
        where: { event_id },
        attributes: [],
        required: false,
        include: [
          {
            model: IncidentDivision,
            attributes: [],
          },
        ],
      },
      ...userCompanyRoleData(+user['role'], company_id),
    ],
  });

  // Filter the result set for staffCounts (all users) and activeCounts (active users)
  const staffCounts = users.length; // Total count of all users retrieved
  const activeCounts = users.filter((user) => user.get('is_active')).length;

  return { activeCounts, staffCounts };
};

export const getEventDepartmentCounts = async (
  event_id: number,
  company_id: number,
) => {
  const departments = await Department.count({
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
                required: false,
              },
            ],
          },
        ],
      },
      {
        model: Event,
        where: { id: event_id },
      },
    ],
    distinct: true,
  });

  return departments;
};

// Get users ids of which are related to department and also active with an completed event
export const fetchCompletedEventUsers = async (
  departmentId: number,
  user: User,
) => {
  let eventUserIds: number[];

  const completedEvent = await Event.findOne({
    attributes: ['id', 'public_end_date'],
    where: {
      status: EventStatus.COMPLETED,
    },
    include: [
      {
        model: Department,
        as: 'departments',
        where: {
          id: departmentId,
        },
        attributes: ['id'],
        required: true,
        through: { attributes: [] },
      },
    ],
    order: [['public_end_date', 'DESC']],
  });

  if (completedEvent) {
    const eventUserDepartment = await Department.findOne({
      where: await departmentCompaniesPermission(departmentId, user),
      include: [
        {
          model: Event,
          as: 'events',
          attributes: ['id'],
          where: {
            id: completedEvent.id,
          },
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['id'],
              through: { attributes: [] },
              include: [
                {
                  model: DepartmentUsers,
                  where: {
                    department_id: departmentId,
                    user_id: {
                      [Op.eq]: Sequelize.literal('"events->users"."id"'),
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    if (eventUserDepartment) {
      eventUserIds = eventUserDepartment.events[0].users.map((user) => user.id);
    }
  }

  return { eventUserIds, completedEventId: completedEvent?.id };
};

export function sendUpdatedWorkforceDepartments(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_SETUP],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}

export async function getDepartmentCount(
  company_id: number,
  options?: Options,
) {
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
    ],
    distinct: true,
    ...options,
  });

  return departmentCounts;
}

export const isDepartmentExistWithName = async (
  name: string,
  company_id: number,
  id?: number,
) => {
  const where = { name: { [Op.iLike]: name.toLowerCase() }, company_id };

  if (id) where['id'] = { [Op.ne]: id };

  const alreadyCreatedDepartment = await Department.findOne({
    where,
    attributes: ['id'],
  });
  if (alreadyCreatedDepartment) {
    throw new ConflictException(
      RESPONSES.alreadyExist('Department with this name'),
    );
  }
};

export const checkIfAllDepartmentsExist = async (departmentIds: number[]) => {
  if (departmentIds.length) {
    const eventDepartment = await Department.count({
      where: { id: { [Op.in]: departmentIds } },
    });
    if (departmentIds?.length !== eventDepartment)
      throw new NotFoundException(_ERRORS.SOME_OF_DEPARTMENTS_ARE_NOT_FOUND);
  }
};

export const checkIfEventDepartmentExist = async (
  event_id: number,
  departmentIds: number[],
) => {
  const eventDepartment = await EventDepartment.count({
    where: { event_id, department_id: { [Op.in]: departmentIds } },
  });

  if (departmentIds.length !== eventDepartment)
    throw new NotFoundException(
      _ERRORS.SOME_OF_DEPARTMENT_NOT_ASSOCIATED_WITH_PASSED_EVENT_ID,
    );
};

export const getDepartmentHelper = async (
  filters: DepartmentsQueryDto,
  user: User,
  companyId: number,
  page: number,
  page_size: number,
  options?: Options,
  department_ids?: number[],
) => {
  let eventsWhere = {};
  const { event_id, sort_column, order, is_assigned } = filters;
  const [_page, _page_size] = getPageAndPageSize(page, page_size);

  const _departmentWhere = getDepartmentWhereFilter(
    filters,
    companyId,
    department_ids,
  );

  if (event_id) {
    eventsWhere = { id: event_id };
  }

  const departmentData = await Department.findAndCountAll({
    where: _departmentWhere,
    attributes: [
      'id',
      'name',
      'created_at',
      ...(event_id ? departmentIdsAttributes(event_id) : []),
    ],
    include: [
      {
        model: Event,
        where: eventsWhere,
        attributes: [],
        required: !!is_assigned,
      },
    ],
    order: [
      [event_id ? Sequelize.literal('is_assigned') : 'created_at', SortBy.DESC],
      [sort_column || 'name', order || SortBy.ASC],
    ],
    limit: _page_size || undefined,
    offset: _page_size * _page || undefined,
    distinct: true,
    ...options,
  });

  const { rows, count } = departmentData;

  const departmentIds = rows.map((department) => department.id);

  const departments = await Department.findAll({
    where: {
      id: { [Op.in]: departmentIds },
    },
    attributes: [
      'id',
      'name',
      'created_at',
      'updated_at',
      ...(event_id
        ? departmentAttributes(companyId, event_id, +user['role'])
        : []),
    ],
    include: [
      {
        model: Event,
        where: eventsWhere,
        attributes: [],
        required: !!is_assigned,
      },
    ],
    order: [
      [event_id ? Sequelize.literal('is_assigned') : 'created_at', SortBy.DESC],
      [sort_column || 'name', order || SortBy.ASC],
    ],
    ...options,
  });

  return { departments, count };
};

export const eventDepartmentCount = async (event_id: number) => {
  return await EventDepartment.count({
    where: { event_id },
  });
};
