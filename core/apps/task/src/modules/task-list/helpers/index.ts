import { Request, Response } from 'express';
import { Op, Sequelize, Transaction } from 'sequelize';
import momentTimezone from 'moment-timezone';
import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import {
  Department,
  Event,
  Image,
  IncidentDivision,
  Task,
  TaskCategory,
  TaskList,
  TaskListOrder,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import {
  CsvOrPdf,
  ERRORS,
  notUpperRole,
  Options,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { getReportsFromLambda } from '@ontrack-tech-group/common/services';
import { getDateOrTimeInTimeZone } from '@ontrack-tech-group/common/helpers';
import { currentTimestamp } from '@Common/helpers';
import {
  CreateTaskList,
  FilterField,
  TaskStatus,
  TaskStatusFilter,
} from '@Common/constants';
import { getTaskListWhere } from '@Modules/task/helpers';
import { TaskNamesQueryParams } from '@Modules/task/dto';
import {
  FilterDTO,
  TaskByListDto,
  TaskListNamesQueryDto,
  TaskListQueryDto,
} from '../dto';
import {
  divisionRawIncludeInTask,
  _divisionRawInclude,
  _standaloneQuery,
  divisionRawInclude,
  isListCreator,
} from './query';
import { getAllListWhere } from './where';

export const listedTaskListWhereQuery = async (
  taskListQueryDto: TaskListQueryDto | TaskListNamesQueryDto,
  user: User,
  eventTimezone: string,
  needSearchOnListName?: boolean,
) => {
  const _where = {};

  const { me, event_id, keyword, completed, status, self_created } =
    taskListQueryDto;

  _where['event_id'] = event_id;

  _where['$"tasks"."parent_id"$'] = null;

  if (me && !self_created) _where['$"tasks->users"."id"$'] = user.id;
  else if (self_created && !me) _where['$"tasks"."created_by"$'] = user.id;
  else if (self_created && me) {
    if (!_where[Op.and]) _where[Op.and] = [];

    _where[Op.and].push({
      [Op.or]: [
        { '$"tasks->users"."id"$': user.id },
        { '$"tasks"."created_by"$': user.id },
      ],
    });
  }

  if (completed) _where['$"tasks"."status"$'] = TaskStatus.COMPLETED;

  if (status === TaskStatusFilter.PAST_DUE) {
    if (!_where[Op.and]) _where[Op.and] = [];

    _where[Op.and].push({
      '$"tasks"."deadline"$': { [Op.lt]: currentTimestamp(eventTimezone) },
      '$"tasks"."status"$': { [Op.ne]: TaskStatus.COMPLETED },
    });
  } else if (status) _where['$"tasks"."status"$'] = status;

  if (taskListQueryDto['selected_list']) {
    if (!_where[Op.or]) _where[Op.or] = [];

    _where[Op.or].push(
      { '$"tasks"."task_list_id"$': taskListQueryDto['selected_list'] },
      { id: taskListQueryDto['selected_list'] },
    );
  }

  if (keyword) {
    if (!_where[Op.and]) _where[Op.and] = [];

    _where[Op.and].push({
      [Op.or]: [
        { '$tasks.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        needSearchOnListName && {
          '$tasks->task_list.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        { '$tasks.description$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$tasks->task_categories.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        { '$tasks->users.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$tasks->event->departments.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        {
          '$tasks->event->incident_divisions.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
      ],
    });
  }

  if (!_where[Op.and]) _where[Op.and] = [];

  if (notUpperRole(user['role'])) {
    _where[Op.and].push({ ...divisionRawInclude(user.id) });
  }

  return _where;
};

export const standaloneTaskListWhereQuery = (
  taskListQueryDto: TaskListQueryDto | TaskByListDto | TaskListNamesQueryDto,
  user: User,
  eventTimezone: string,
  isStatusCount?: boolean,
) => {
  const _where = {};
  const { me, event_id, keyword, completed, status, self_created } =
    taskListQueryDto;

  _where['event_id'] = event_id;

  _where['parent_id'] = null;

  if (!isStatusCount) _where['task_list_id'] = null;

  if (
    (taskListQueryDto['selected_list'] ||
      taskListQueryDto['task_list_id'] === null ||
      taskListQueryDto['task_list_id']) &&
    isStatusCount
  )
    _where['task_list_id'] =
      taskListQueryDto['selected_list'] || taskListQueryDto['task_list_id'];

  if (me && !self_created) _where['$"users"."id"$'] = user.id;
  else if (self_created && !me) _where['created_by'] = user.id;
  else if (self_created && me) {
    if (!_where[Op.or]) _where[Op.or] = [];

    _where[Op.or].push({ '$"users"."id"$': user.id }, { created_by: user.id });
  }

  if (!_where[Op.and]) _where[Op.and] = [];

  _where[Op.and].push({ ..._standaloneQuery(user.id) });

  if (completed) _where['status'] = 'Completed';

  if (status === TaskStatusFilter.PAST_DUE) {
    if (!_where[Op.and]) _where[Op.and] = [];

    _where[Op.and].push({
      deadline: { [Op.lt]: currentTimestamp(eventTimezone) },
      status: { [Op.ne]: TaskStatus.COMPLETED },
    });
  } else if (status) _where['status'] = status;

  if (keyword) {
    if (!_where[Op.and]) _where[Op.and] = [];

    _where[Op.and].push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        { description: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$task_list.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        {
          '$task_categories.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        { '$users.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$event->departments.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
        {
          '$event->incident_divisions.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
      ],
    });
  }

  return _where;
};

export const customFilters = (
  taskListQueryDto: TaskListQueryDto | TaskByListDto | TaskListNamesQueryDto,
  standalone: boolean,
  time_zone: string,
) => {
  const { filters } = taskListQueryDto;
  const whereClause = {};

  const filterFieldMappings = {
    deadline: standalone ? 'deadline' : '$"tasks"."deadline"$',
    assignee: standalone ? '$"users"."id"$' : '$"tasks->users"."id"$',
    status: standalone ? 'status' : '$"tasks"."status"$',
    division: standalone
      ? 'incident_division_id'
      : '$"tasks"."incident_division_id"$',
    deparment: standalone ? 'department_id' : '$"tasks"."department_id"$',
    list: standalone ? 'task_list_id' : '$"tasks"."task_list_id"$',
  };

  filters?.forEach(({ filter, condition, values }) => {
    // assignee can be department or users, they both can be included in multiple custom filters
    // make the seperate array for departments and users
    let filterDepartments: string[];
    let filterUsers: string[];

    if (filter === FilterField.ASSIGNEE) {
      filterDepartments = values.filter((value) =>
        value.includes('department'),
      );

      filterUsers = values.filter((value) => value.includes('user'));
    }

    if (filterFieldMappings[filter]) {
      switch (condition) {
        case 'EQ':
          if (filter === FilterField.DEADLINE) {
            whereClause[filterFieldMappings[filter]] = {
              [Op.and]: [
                {
                  [Op.gte]: momentTimezone
                    .tz(values[0], time_zone)
                    .startOf('day')
                    .utc()
                    .format('YYYY-MM-DDTHH:mm:ss:mss[Z]'), // start_date (Range Picker)
                },
                {
                  [Op.lt]: momentTimezone
                    .tz(values[1], time_zone)
                    .endOf('day')
                    .utc()
                    .format('YYYY-MM-DDTHH:mm:ss:mss[Z]'), // end_date (Range Picker)
                },
              ],
            };
          } else if (filter === FilterField.ASSIGNEE) {
            if (filterUsers.length || filterDepartments.length) {
              whereClause[Op.or] = [];

              if (filterUsers.length) {
                whereClause[Op.or].push({
                  [filterFieldMappings[filter]]: {
                    [Op.in]: filterUsers.map((value) => value.split(':')[1]),
                  },
                });
              }

              if (filterDepartments.length) {
                whereClause[Op.or].push({
                  [filterFieldMappings['deparment']]: {
                    [Op.in]: filterDepartments.map(
                      (value) => value.split(':')[1],
                    ),
                  },
                });
              }
            }
          } else whereClause[filterFieldMappings[filter]] = { [Op.in]: values };
          break;

        case 'NOT_EQ':
          if (filter === FilterField.DEADLINE) {
            whereClause[filterFieldMappings[filter]] = {
              [Op.or]: [
                {
                  [Op.lt]: momentTimezone
                    .tz(values[0], time_zone)
                    .startOf('day')
                    .utc()
                    .format('YYYY-MM-DDTHH:mm:ss:mss[Z]'), // start_date (Range Picker)
                },
                {
                  [Op.gt]: momentTimezone
                    .tz(values[1], time_zone)
                    .endOf('day')
                    .utc()
                    .format('YYYY-MM-DDTHH:mm:ss:mss[Z]'), // end_date (Range Picker)
                },
              ],
            };
          } else if (filter === FilterField.ASSIGNEE) {
            if (filterUsers.length || filterDepartments.length) {
              if (!whereClause[Op.and]) whereClause[Op.and] = [];

              if (filterUsers.length) {
                whereClause[Op.and].push({
                  [filterFieldMappings[filter]]: {
                    [Op.or]: {
                      [Op.notIn]: filterUsers.map(
                        (value) => value.split(':')[1],
                      ),
                      [Op.eq]: null,
                    },
                  },
                });
              }

              if (filterDepartments.length) {
                whereClause[Op.and].push({
                  [filterFieldMappings['deparment']]: {
                    [Op.or]: [
                      {
                        [Op.notIn]: filterDepartments.map(
                          (value) => value.split(':')[1],
                        ),
                        [Op.eq]: null,
                      },
                    ],
                  },
                });
              }
            }
          } else if (
            filter === FilterField.DIVISION ||
            filter === FilterField.CATEGORIES ||
            filter === FilterField.LIST
          ) {
            whereClause[filterFieldMappings[filter]] = {
              [Op.or]: [{ [Op.notIn]: values }, { [Op.eq]: null }],
            };
          } else
            whereClause[filterFieldMappings[filter]] = { [Op.notIn]: values };
          break;

        default:
          break;
      }
    }
  });

  return whereClause;
};

export const taskWhere = (
  taskListQueryDto: TaskListQueryDto | TaskListNamesQueryDto,
) => {
  const { filters, event_id } = taskListQueryDto;
  let whereClause = {};

  filters?.forEach(({ filter, condition, values }) => {
    switch (condition) {
      case 'EQ':
        if (filter === FilterField.CATEGORIES) {
          whereClause = Sequelize.literal(
            `"tasks"."id" IN (SELECT "task_id" FROM "task_task_categories" WHERE "task_category_id" IN (${values})) AND "tasks"."event_id"= ${event_id}`,
          );
        }
        break;

      case 'NOT_EQ':
        if (filter === FilterField.CATEGORIES) {
          whereClause = Sequelize.literal(
            `"tasks"."id" NOT IN (SELECT "task_id" FROM "task_task_categories" WHERE "task_category_id" IN (${values})) AND "tasks"."event_id"= ${event_id}`,
          );
        }
        break;

      default:
        break;
    }
  });

  return whereClause;
};

export const standaloneTaskWhere = (
  taskListQueryDto: TaskListQueryDto | TaskByListDto | TaskListNamesQueryDto,
) => {
  const { filters, event_id } = taskListQueryDto;
  const whereClause = {};

  filters?.forEach(({ filter, condition, values }) => {
    switch (condition) {
      case 'EQ':
        if (filter === FilterField.CATEGORIES) {
          whereClause['id'] = {
            [Op.in]: Sequelize.literal(
              `(SELECT "task_id" FROM "task_task_categories" WHERE "task_category_id" IN (${values})) AND "Task"."event_id"= ${event_id}`,
            ),
          };
        }
        break;

      case 'NOT_EQ':
        if (filter === FilterField.CATEGORIES) {
          whereClause['id'] = {
            [Op.notIn]: Sequelize.literal(
              `(SELECT "task_id" FROM "task_task_categories" WHERE "task_category_id" IN (${values})) AND "Task"."event_id"= ${event_id}`,
            ),
          };
        }
        break;

      default:
        break;
    }
  });

  return whereClause;
};

const statusCountWhere = async (
  event_id: number,
  isFiltered: boolean,
  taskListQueryDto: TaskListQueryDto | TaskByListDto,
  eventTimeZone: string,
  user?: User,
  taskByList?: boolean,
) => {
  let _where = {};

  _where['event_id'] = event_id;

  _where['parent_id'] = null;

  if (isFiltered) {
    _where = standaloneTaskListWhereQuery(
      taskListQueryDto,
      user,
      eventTimeZone,
      true,
    );
  }

  if (
    taskByList &&
    !isFiltered &&
    taskListQueryDto['task_list_id'] !== undefined
  ) {
    _where['task_list_id'] = taskListQueryDto['task_list_id'] || null;
  }

  if (!_where[Op.and]) _where[Op.and] = [];

  _where[Op.and].push({ ..._standaloneQuery(user.id) });

  if (notUpperRole(user['role'])) {
    _where[Op.and].push({ ...divisionRawIncludeInTask(user.id) });
  }

  return _where;
};

export const fetchAndSortTaskLists = async (
  eventId: number,
  listedTasks: TaskList[],
  userId: number,
  filteredListId: number,
) => {
  let allTaskLists = [];
  // Extract IDs of already listed tasks
  const listedTaskIds = listedTasks.map((taskList) => taskList.id);

  // Fetch all task lists for the event, excluding already populated listedTasks(means the list who has the task)
  if (listedTaskIds.length && filteredListId) allTaskLists = [];
  else {
    allTaskLists = await TaskList.findAll({
      where: getAllListWhere(listedTaskIds, filteredListId, eventId),
      attributes: [
        ...listNamesCommonAttributes,
        [Sequelize.literal('false'), 'is_completed_tasks'],
        [Sequelize.literal('"task_list_orders"."order"'), 'order'],
        [Sequelize.literal('"task_list_orders"."is_pinned"'), 'is_pinned'],
        isListCreator(userId),
        [Sequelize.literal(`'[]'::jsonb`), 'tasks'],
      ],
      include: [
        {
          model: TaskListOrder,
          attributes: [],
          where: { user_id: userId },
          required: false,
        },
      ],
      order: [
        [Sequelize.literal('"task_list_orders"."is_pinned"'), 'DESC'],
        [Sequelize.literal('"task_list_orders"."order"'), 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
  }

  const mergedListedTasks = [...listedTasks, ...allTaskLists];

  // Sort the merged list based on `is_pinned`, `order`, and creation time
  mergedListedTasks.sort((list1, list2) => {
    // Handle pinned tasks first
    if (list1.is_pinned && !list2.is_pinned) return -1;
    if (!list1.is_pinned && list2.is_pinned) return 1;

    // Sort by order within pinned/unpinned groups
    if (list1.order !== list2.order) return list1.order - list2.order;

    // Fallback to creation time if orders are equal
    return (
      new Date(list1.createdAt).getTime() - new Date(list2.createdAt).getTime()
    );
  });

  return mergedListedTasks;
};

export const taskStatusCount = async (
  event_id: number,
  eventTimezone: string,
  isFiltered?: boolean,
  taskListQueryDto?: TaskListQueryDto | TaskByListDto,
  user?: User,
  taskByList?: boolean,
) => {
  const defaultTaskStatus = {
    pastDueTaskCount: 0,
    openTaskCount: 0,
    inProgressTaskCount: 0,
    completeTaskCount: 0,
    blockedTaskCount: 0,
    pastDuePriorityTaskCount: 0,
    openPriorityTaskCount: 0,
    inProgressPriorityTaskCount: 0,
    completePriorityTaskCount: 0,
    blockedPriorityTaskCount: 0,
    blockedPastDueTaskCount: 0,
    inProgressPastDueTaskCount: 0,
    openPastDueTaskCount: 0,
  };

  const tasksIds = await Task.findAll({
    where: isFiltered
      ? {
          ...(await statusCountWhere(
            event_id,
            isFiltered,
            taskListQueryDto,
            eventTimezone,
            user,
          )),
          ...customFilters(taskListQueryDto, true, eventTimezone),
          ...standaloneTaskWhere(taskListQueryDto),
        }
      : {
          ...(await statusCountWhere(
            event_id,
            isFiltered,
            taskListQueryDto,
            eventTimezone,
            user,
            taskByList,
          )),
        },
    attributes: ['id'],
    include: isFiltered
      ? [
          {
            model: TaskCategory,
            attributes: [],
            through: { attributes: [] },
          },
          {
            model: Event,
            where: { id: event_id },
            attributes: [],
            include: [
              {
                model: Department,
                attributes: [],
                through: { attributes: [] },
                where: {
                  id: {
                    [Op.eq]: Sequelize.literal('"Task"."department_id"'),
                  },
                },
                required: false,
              },
              {
                model: IncidentDivision,
                attributes: [],
                through: { attributes: [] },
                where: {
                  id: {
                    [Op.eq]: Sequelize.literal('"Task"."incident_division_id"'),
                  },
                },
                required: false,
              },
            ],
          },
          ...commonStatusCountIncludeWithSubtasks,
        ]
      : [...commonStatusCountIncludeWithSubtasks],
  });
  if (!tasksIds.length) return defaultTaskStatus;

  const taskStatusCount = await Task.findAll({
    where: {
      id: { [Op.in]: tasksIds.map(({ id }) => id) },
    },
    attributes: [
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."deadline" < '${currentTimestamp(eventTimezone)}'
           AND "Task"."status" != '${TaskStatus.COMPLETED}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'pastDueTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.OPEN}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'openTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.IN_PROGRESS}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'inProgressTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.COMPLETED}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'completeTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.BLOCKED}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'blockedTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."deadline" < '${currentTimestamp(eventTimezone)}'
           AND priority = true AND "Task"."status" != '${TaskStatus.COMPLETED}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'pastDuePriorityTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.OPEN}' AND priority = true THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'openPriorityTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.IN_PROGRESS}' AND priority = true THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'inProgressPriorityTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.COMPLETED}' AND priority = true THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'completePriorityTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.BLOCKED}' AND priority = true THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'blockedPriorityTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.BLOCKED}'
           AND "Task"."deadline" < '${currentTimestamp(eventTimezone)}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'blockedPastDueTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.IN_PROGRESS}'
           AND "Task"."deadline" < '${currentTimestamp(eventTimezone)}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'inProgressPastDueTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.OPEN}'
           AND "Task"."deadline" < '${currentTimestamp(eventTimezone)}' THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'openPastDueTaskCount',
      ],
      [
        Sequelize.literal(
          `SUM(CASE WHEN "Task"."status" = '${TaskStatus.COMPLETED}'
           AND "Task"."completed_past_due" = true THEN 1 ELSE 0 END)::INTEGER`,
        ),
        'completedPastDueTaskCount',
      ],
    ],
  });

  return taskStatusCount[0];
};

/**
 * This function generate csv as attachment or return with pdf url for task listing
 */
export const generateCsvOrPdfForTasksListing = async (
  params: TaskListQueryDto,
  tasks: Task[],
  req: Request,
  res: Response,
  httpService: HttpService,
  timeZone: string,
) => {
  if (params?.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedTasksForCsv = getFormattedTasksDataForCsv(tasks, timeZone);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedTasksForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="Tasks.csv"');

    return res.send(response.data);
  } else if (params?.csv_pdf === CsvOrPdf.PDF) {
    throw new NotImplementedException(
      ERRORS.REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT,
    );
  }
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param tasks
 * @returns Formatted object for CSV file for tasks.
 */
const getFormattedTasksDataForCsv = (tasks: Task[], timeZone: string) => {
  return tasks?.map((task: Task) => {
    // if the status of task is completed then showing completed_at in deadline column of csv
    const taskDate =
      task.status === TaskStatus.COMPLETED && task.completed_at
        ? task.completed_at.toISOString()
        : (task.deadline as string);

    const { date, time } = getDateOrTimeInTimeZone(taskDate, timeZone);

    return {
      'TASK NAME': task.name || '--',
      'DUE DATE': date || '--',
      TIME: time || '--',
      'ASSIGNED TO': task.users?.[0]?.name || task['department_name'] || '--',
      STATUS: task.status,
      DIVISIONS: task['incident_division_name'] || '--',
      'LIST NAME': task['taskListName'] || 'Private List',
      ATTACHMENTS: task.images.map((image) => image.url).join(', ') || '--',
      SUBTASKS: task.subtasks.map((subtask) => subtask.name).join(', ') || '--',
      CATEGORIES:
        task.task_categories.map((category) => category.name).join(', ') ||
        '--',
    };
  });
};

export const tasksByListWhereQuery = async (
  taskByListDto: TaskByListDto | TaskNamesQueryParams,
  user: User,
  eventTimezone: string,
) => {
  const _where = {};
  const { event_id, task_list_id } = taskByListDto;

  _where['event_id'] = event_id;

  // for only showing main tasks not subtasks
  _where['parent_id'] = null;

  if (task_list_id) _where['task_list_id'] = task_list_id;
  else {
    _where['task_list_id'] = null;

    // if task_list_id is null means standalone, and need to show only self created tasks
    _where['created_by'] = user.id;
  }

  if (taskByListDto['me'] && !taskByListDto['self_created'])
    _where['$"users"."id"$'] = user.id;
  else if (taskByListDto['self_created'] && !taskByListDto['me'])
    _where['created_by'] = user.id;
  else if (taskByListDto['self_created'] && taskByListDto['me']) {
    if (!_where[Op.or]) _where[Op.or] = [];

    _where[Op.or].push({ '$"users"."id"$': user.id }, { created_by: user.id });
  }

  if (taskByListDto['completed']) _where['status'] = 'Completed';

  if (taskByListDto['status'] === TaskStatusFilter.PAST_DUE) {
    if (!_where[Op.and]) _where[Op.and] = [];

    _where[Op.and].push({
      deadline: { [Op.lt]: currentTimestamp(eventTimezone) },
      status: { [Op.ne]: TaskStatus.COMPLETED },
    });
  } else if (taskByListDto['status'])
    _where['status'] = taskByListDto['status'];

  if (taskByListDto['keyword']) {
    if (!_where[Op.and]) _where[Op.and] = [];

    _where[Op.and].push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${taskByListDto['keyword'].toLowerCase()}%` } },
        {
          description: {
            [Op.iLike]: `%${taskByListDto['keyword'].toLowerCase()}%`,
          },
        },
        {
          '$task_categories.name$': {
            [Op.iLike]: `%${taskByListDto['keyword'].toLowerCase()}%`,
          },
        },
        {
          '$users.name$': {
            [Op.iLike]: `%${taskByListDto['keyword'].toLowerCase()}%`,
          },
        },
        {
          '$event->departments.name$': {
            [Op.iLike]: `%${taskByListDto['keyword'].toLowerCase()}%`,
          },
        },
        {
          '$event->incident_divisions.name$': {
            [Op.iLike]: `%${taskByListDto['keyword'].toLowerCase()}%`,
          },
        },
      ],
    });
  }

  if (!_where[Op.and]) _where[Op.and] = [];

  if (notUpperRole(user['role'])) {
    _where[Op.and].push({ ..._divisionRawInclude(user.id) });
  }

  return _where;
};

export const lastTaskListOrder = async (event_id: number, user_id: number) => {
  const lastOrder = await TaskListOrder.findOne({
    attributes: ['id', 'order'],
    where: {
      event_id,
      user_id,
    },
    order: [['order', SortBy.DESC]],
  });

  return lastOrder?.order ?? -1;
};

export const updateTaskListOrders = async (
  event_id: number,
  newOrder: number,
  currentOrder: number | null,
  taskListId: number,
  user_id: number,
  transaction?: Transaction,
) => {
  // Handle the case where currentOrder exists (reordering case)
  if (currentOrder !== null) {
    const orderUpdateCondition =
      newOrder > currentOrder
        ? { [Op.gt]: currentOrder, [Op.lte]: newOrder } // Shift down
        : { [Op.gte]: newOrder, [Op.lt]: currentOrder }; // Shift up

    const taskListsToUpdate = await TaskListOrder.findAll({
      where: { event_id, user_id, order: orderUpdateCondition },
    });

    const orderAdjustment = newOrder > currentOrder ? -1 : 1;

    // Update orders in bulk rather than individual updates to improve performance
    const updatePromises = taskListsToUpdate.map((taskList) =>
      taskList.update(
        { order: taskList.order + orderAdjustment },
        { transaction },
      ),
    );

    await Promise.all(updatePromises);

    // Finally, update the specific task list to its new order
    await TaskListOrder.update(
      { order: newOrder },
      { where: { event_id, task_list_id: taskListId }, transaction },
    );
  } else {
    // Handle the case where currentOrder is null (initial ordering case)
    let taskListIds = (
      await TaskList.findAll({
        attributes: ['id'],
        where: { event_id },
        order: [['created_at', 'ASC']], // Optional: to ensure consistent ordering
      })
    ).map(({ id }) => id);

    // Remove the specific taskListId and insert it at the newOrder position
    taskListIds = taskListIds.filter((id) => id !== taskListId);
    taskListIds.splice(newOrder, 0, taskListId);

    const bulkCreateTaskListOrders = taskListIds.map((id, index) => ({
      event_id,
      user_id,
      order: index,
      task_list_id: id,
    }));

    await TaskListOrder.bulkCreate(bulkCreateTaskListOrders, {
      transaction,
      ignoreDuplicates: true,
    });
  }
};

export const reorderTaskList = async (
  event_id: number,
  user_id: number,
  deletedOrder: number,
  transaction: Transaction,
) => {
  await TaskListOrder.destroy({
    where: { event_id, user_id, order: deletedOrder },
    transaction,
  });

  // Now, we need to shift up the order of task lists that were below the deleted task list.
  const taskListsToShiftUp = await TaskListOrder.findAll({
    where: {
      event_id,
      user_id,
      order: {
        [Op.gt]: deletedOrder,
      },
    },
  });

  for (const taskList of taskListsToShiftUp) {
    await taskList.update({ order: taskList.order - 1 }, { transaction });
  }
};

export const sortListNames = (concatenatedArray: any[]) => {
  // Create a map to keep track of unique objects by ID
  const uniqueObjectsMap = new Map();

  // Loop through the concatenated array and add objects to the map
  for (const obj of concatenatedArray) {
    if (!uniqueObjectsMap.has(obj.id)) {
      uniqueObjectsMap.set(obj.id, obj);
    }
  }

  // Create an array of unique objects
  const uniqueArray = Array.from(uniqueObjectsMap.values());

  // Sort the array based on 'is_pinned' and 'order'
  uniqueArray.sort((a, b) => {
    if (a.is_pinned === b.is_pinned) {
      return a.order - b.order;
    } else if (a.is_pinned) {
      return -1; // 'a' comes before 'b'
    } else {
      return 1; // 'b' comes before 'a'
    }
  });

  return uniqueArray;
};

export const getListLastPinnedOrder = async (
  event_id: number,
  user_id: number,
) => {
  const taskList = await TaskListOrder.findOne({
    where: { event_id, user_id, is_pinned: true },
    attributes: ['id', 'order'],
    order: [['order', SortBy.DESC]],
  });

  return taskList ? taskList.order : -1;
};

export const listedTaskListCountWhereQuery = (event_id: number) => {
  const _where = {};

  _where['event_id'] = event_id;

  if (!_where[Op.and]) _where[Op.and] = [];

  return _where;
};

export const isTaskListExist = async (
  id: number,
  event_id?: number,
  user_id?: number,
  options?: Options,
) => {
  const taskList = await TaskList.findOne({
    where: getTaskListWhere(id, event_id),
    attributes: {
      include: [
        [Sequelize.literal(`"task_list_orders"."is_pinned"`), 'is_pinned'],
        [
          Sequelize.literal(`(
            SELECT "incident_division_id" FROM "tasks"
            WHERE "tasks"."task_list_id" = "TaskList"."id"
            LIMIT 1
          )`),
          'task_division',
        ],
        [Sequelize.literal('"task_list_orders"."order"'), 'order'],
      ],
      exclude: ['created_at', 'updated_at', 'is_pinned'],
    },
    include: [
      {
        model: TaskListOrder,
        attributes: [],
        where: { user_id },
        required: false,
      },
    ],
    ...options,
  });
  if (!taskList) throw new NotFoundException(RESPONSES.notFound('Task List'));

  return taskList;
};

export const createTaskListWithValidation = async (
  createTaskListDto: CreateTaskList,
  user: User,
  transaction: Transaction,
) => {
  const { name, event_id, order } = createTaskListDto;
  let lastOrder: number;

  const isTaskListNameAlreadyExist = await TaskList.findOne({
    where: {
      name: {
        [Op.iLike]: name.toLowerCase().trim(),
      },
      event_id,
    },
  });
  if (isTaskListNameAlreadyExist)
    throw new ConflictException(RESPONSES.alreadyExist('Task List Name'));

  if (!order)
    // updating old task list orders
    lastOrder = await lastTaskListOrder(event_id, user.id);

  const createdList = await TaskList.create(
    {
      ...createTaskListDto,
      order: order || lastOrder + 1,
      created_by: user.id,
      // if task list order doesn't exist, don't need to create record in task_list_order table, the default sorting on the base of created_at
      ...((order >= 0 || lastOrder >= 0) && {
        task_list_orders: {
          event_id,
          user_id: user.id,
          order: order || lastOrder + 1,
        },
      }),
    },
    { transaction, include: { association: 'task_list_orders' } },
  );

  return createdList;
};

export const checkFilterExists = (
  filters: FilterDTO[],
  filterName: string,
): boolean => {
  return filters && filters.some((filter) => filter.filter === filterName);
};

// for getting the user pinned task list
export const getUserPinnedTaskList = async (
  task_list_id: number,
  user_id: number,
  event_id: number,
) => {
  return await TaskListOrder.findOne({
    where: { task_list_id, user_id, event_id },
    attributes: ['id', 'task_list_id', 'is_pinned'],
  });
};

export const taskByListCounts = async (tasks: Task[]) => {
  const taskIds = tasks.map((task) => task.id);

  const subtaskCounts = await Task.findAll({
    where: {
      parent_id: { [Op.in]: taskIds },
    },
    attributes: [
      'parent_id',
      // [Sequelize.fn('COUNT', Sequelize.col('id')), 'subtaskCount'],
      [Sequelize.literal(`CAST(COUNT("id") AS INTEGER)`), 'subtaskCount'],
    ],
    group: ['parent_id'],
    raw: true,
  });

  const attachmentCounts = await Image.findAll({
    where: {
      imageable_id: { [Op.in]: taskIds },
      imageable_type: 'Task',
    },
    attributes: [
      'imageable_id',
      // [Sequelize.fn('COUNT', Sequelize.col('id')), 'attachmentCount'],
      [Sequelize.literal(`CAST(COUNT("id") AS INTEGER)`), 'attachmentCount'],
    ],
    group: ['imageable_id'],
    raw: true,
  });

  // Step 3: Inject counts into the tasks array
  const tasksWithCounts = tasks.map((task) => {
    const subtaskCount = subtaskCounts.find((sc) => sc.parent_id === task.id);
    const attachmentCount = attachmentCounts.find(
      (ac) => ac.imageable_id === task.id,
    );

    return {
      ...task.get({ plain: true }), // Convert Sequelize instance to plain object
      subtaskCount: subtaskCount ? subtaskCount['subtaskCount'] : 0,
      attachmentCount: attachmentCount ? attachmentCount['attachmentCount'] : 0,
    };
  });

  return tasksWithCounts;
};

export const listNamesCommonAttributes = [
  'id',
  'name',
  'event_id',
  'is_division_locked',
  'is_date_locked',
  'created_by',
];

export const commonStatusCountInclude: any = [
  {
    model: TaskList,
    attributes: [],
    required: false,
  },
  {
    model: IncidentDivision,
    attributes: [],
    required: false,
    include: [
      {
        model: UserIncidentDivision,
        attributes: [],
      },
    ],
  },
  {
    model: User,
    as: 'users',
    attributes: [],
    through: { attributes: [] },
  },
];

export const commonStatusCountIncludeWithSubtasks: any = [
  ...commonStatusCountInclude,
  {
    model: Task,
    as: 'subtasks',
    attributes: [],
    include: [
      {
        model: User,
        as: 'users',
        attributes: [],
        through: { attributes: [] },
      },
    ],
  },
];
