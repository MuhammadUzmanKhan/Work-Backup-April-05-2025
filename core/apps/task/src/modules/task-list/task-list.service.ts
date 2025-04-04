import momentTimezone from 'moment-timezone';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import {
  successInterceptorResponseFormat,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  Comment,
  Department,
  Event,
  IncidentDivision,
  Task,
  TaskCategory,
  TaskList,
  TaskListOrder,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import {
  CommentableTypes,
  ERRORS,
  RESPONSES,
  RolesNumberEnum,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  PusherService,
  UsersPinsService,
} from '@ontrack-tech-group/common/services';
import { FilterField, TaskStatus, _ERRORS, _MESSAGES } from '@Common/constants';
import { isEventIncidentDivisionExist } from '@Modules/task/helpers';
import {
  currentTimestamp,
  imageInclude,
  isPastDue,
  sendTaskCountUpdate,
} from '@Common/helpers';
import { excludeAttributes } from '@Modules/subtask/helper';
import { taskDeparmentInclude, taskDepartmentName } from '@Common/queries';
import {
  CreateTaskListDto,
  TaskByListDto,
  TaskListNamesQueryDto,
  TaskListQueryDto,
  UpdateMultipleTasksDto,
  UpdateTaskListDto,
} from './dto';
import {
  checkFilterExists,
  commonStatusCountInclude,
  createTaskListWithValidation,
  customFilters,
  fetchAndSortTaskLists,
  generateCsvOrPdfForTasksListing,
  getListLastPinnedOrder,
  getUserPinnedTaskList,
  isTaskListExist,
  lastTaskListOrder,
  listNamesCommonAttributes,
  listedTaskListCountWhereQuery,
  listedTaskListWhereQuery,
  reorderTaskList,
  sortListNames,
  standaloneTaskListWhereQuery,
  standaloneTaskWhere,
  taskByListCounts,
  taskStatusCount,
  taskWhere,
  tasksByListWhereQuery,
  updateTaskListOrders,
} from './helpers';
import { taskByListOrder, taskListOrder } from './helpers/orders';
import { isListCreator, subtasksAssignees } from './helpers/query';

@Injectable()
export class TaskListService {
  constructor(
    private sequelize: Sequelize,
    private readonly pusherService: PusherService,
    private readonly httpService: HttpService,
    private readonly userPinsService: UsersPinsService,
  ) {}

  async createTaskList(
    createTaskListDto: CreateTaskListDto,
    user: User,
    transaction?: Transaction,
  ) {
    const { event_id } = createTaskListDto;

    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, event_id);

    // this function is resuseable for creating a new TaskList with validations
    const createdTaskList = await createTaskListWithValidation(
      createTaskListDto,
      user,
      transaction,
    );

    // to change the socket response same
    const taskList = (
      await isTaskListExist(createdTaskList.id, event_id, user.id, {
        useMaster: true,
      })
    ).get({ plain: true });

    taskList['isDeleted'] = false;

    this.pusherService.sendUpdatedTaskList(taskList);

    return createdTaskList;
  }

  async getAllTaskLists(
    taskListQueryDto: TaskListQueryDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    let standaloneTasks = [];
    let listedTasks = [];

    const { event_id, sort_column, sort_by, selected_list, csv_pdf, filters } =
      taskListQueryDto;

    // if list custom filter is applied, then don't need to fetch standalone tasks
    const isListFilterExist = checkFilterExists(filters, FilterField.LIST);

    // Check if user has access to this event or not based on its company or subcompany

    const [, , time_zone] = await withCompanyScope(user, event_id);

    if (selected_list !== -1) {
      listedTasks = await TaskList.findAll({
        where: {
          ...(await listedTaskListWhereQuery(
            taskListQueryDto,
            user,
            time_zone,
            false,
          )),
          ...customFilters(taskListQueryDto, false, time_zone),
        },
        attributes: [
          ...listNamesCommonAttributes,
          [
            Sequelize.literal(`EXISTS (
              SELECT 1 FROM "tasks"
              WHERE "tasks"."task_list_id" = "TaskList"."id"
              AND "tasks"."status" = '${TaskStatus.COMPLETED}'
              AND "tasks"."deadline" < '${currentTimestamp(time_zone)}'
            )`),
            'is_completed_tasks',
          ],
          [Sequelize.literal('"task_list_orders"."order"'), 'order'],
          [Sequelize.literal('"task_list_orders"."is_pinned"'), 'is_pinned'],
          isListCreator(user.id),
        ],
        include: [
          {
            model: Task,
            where: taskWhere(taskListQueryDto),
            required: false,
            attributes: {
              include: [
                [
                  Sequelize.literal(`(
                    SELECT COUNT(*)::INTEGER FROM "tasks" AS "Subtask"
                    WHERE "Subtask"."parent_id" = "tasks"."id"
                  )`),
                  'subtaskCount',
                ],
                [
                  Sequelize.literal(`(
                    SELECT COUNT(*)::INTEGER FROM "images" AS "Image"
                    WHERE "Image"."imageable_id" = "tasks"."id"
                    AND "Image"."imageable_type" = 'Task'
                  )`),
                  'attachmentCount',
                ],
                [
                  Sequelize.literal('"tasks->event->departments"."name"'),
                  'department_name',
                ],
                [
                  Sequelize.literal(
                    '"tasks->event->incident_divisions"."name"',
                  ),
                  'incident_division_name',
                ],
                [Sequelize.literal('"tasks->task_list"."name"'), 'list_name'],
                [
                  Sequelize.literal(`(
                    SELECT COUNT(*)::INTEGER FROM "comments"
                    WHERE "comments"."commentable_id" = "tasks"."id"
                    AND "comments"."commentable_type" = '${CommentableTypes.TASK}'
                  )`),
                  'comment_count',
                ],
                [
                  Sequelize.literal(`(
                    SELECT COUNT(*) = COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS all_completed
                    FROM "tasks" AS "_tasks"
                    WHERE "_tasks"."parent_id" = "tasks"."id"
                  )`),
                  'is_subtasks_completed',
                ],
                [Sequelize.literal('"tasks->creator"."name"'), 'creator_name'],
                subtasksAssignees('tasks'),
                isPastDue('tasks', time_zone),
              ],
            },
            include: [
              {
                model: User,
                as: 'creator',
                attributes: [],
              },
              {
                model: TaskList,
                attributes: [],
              },
              {
                model: TaskCategory,
                attributes: ['id', 'name'],
                through: { attributes: [] },
              },
              {
                model: User,
                as: 'users',
                attributes: ['id', 'name', 'email', 'cell', 'country_code'],
                through: { attributes: [] },
                include: [
                  imageInclude([
                    Sequelize.literal(
                      `"tasks->users->images->created_by"."name"`,
                    ),
                    'createdBy',
                  ]),
                ],
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
                        [Op.eq]: Sequelize.literal('"tasks"."department_id"'),
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
                        [Op.eq]: Sequelize.literal(
                          '"tasks"."incident_division_id"',
                        ),
                      },
                    },
                    required: false,
                  },
                ],
              },
              {
                model: Task,
                as: 'subtasks',
                attributes: {
                  exclude: excludeAttributes,
                  include: [
                    taskDepartmentName('tasks->subtasks->'),
                    isPastDue('tasks->subtasks', time_zone),
                  ],
                },
                include: [
                  imageInclude([
                    Sequelize.literal(
                      `"tasks->subtasks->images->created_by"."name"`,
                    ),
                    'createdBy',
                  ]),
                  {
                    model: TaskCategory,
                    attributes: ['id', 'name'],
                    through: { attributes: [] },
                  },
                  {
                    model: User,
                    as: 'users',
                    attributes: ['id', 'name', 'email', 'cell', 'country_code'],
                    through: { attributes: [] },
                    include: [
                      imageInclude([
                        Sequelize.literal(
                          `"tasks->subtasks->users->images->created_by"."name"`,
                        ),
                        'createdBy',
                      ]),
                    ],
                  },
                  taskDeparmentInclude(event_id, 'tasks->subtasks'),
                ],
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
                model: TaskList,
                attributes: [],
              },
              imageInclude([
                Sequelize.literal(`"tasks->images->created_by"."name"`),
                'createdBy',
              ]),
            ],
          },
          {
            model: TaskListOrder,
            attributes: [],
            where: { user_id: user.id },
            required: false,
          },
        ],
        order: taskListOrder(sort_column, sort_by),
        group: [
          `"TaskList"."id"`,
          `"tasks"."id"`,
          `"tasks->users"."name"`,
          `"tasks->event->departments"."name"`,
          `"tasks->event->incident_divisions"."name"`,
          `"tasks->task_categories"."id"`,
          `"tasks->users->UserTask"."id"`,
          `"tasks->subtasks"."id"`,
          `"tasks->subtasks->images"."id"`,
          `"tasks->users"."id"`,
          `"tasks->users->images"."id"`,
          `"tasks->images"."id"`,
          `"tasks->subtasks->users"."id"`,
          `"tasks->subtasks->users->images"."id"`,
          `"tasks->subtasks->task_categories"."id"`,
          `"tasks->users->images->created_by"."name"`,
          `"tasks->subtasks->images->created_by"."name"`,
          `"tasks->subtasks->users->images->created_by"."name"`,
          `"tasks->images->created_by"."name"`,
          `"tasks->subtasks->event->departments"."name"`,
          `"tasks->creator"."name"`,
          `"task_list_orders"."order"`,
          `"task_list_orders"."is_pinned"`,
          `"tasks->task_list"."name"`,
        ],
      });
    }

    if (selected_list > 0 || isListFilterExist) standaloneTasks = [];
    else {
      standaloneTasks = await Task.findAll({
        where: {
          ...standaloneTaskListWhereQuery(taskListQueryDto, user, time_zone),
          ...customFilters(taskListQueryDto, true, time_zone),
          ...standaloneTaskWhere(taskListQueryDto),
        },
        attributes: {
          exclude: ['updatedAt'],
          include: [
            [
              Sequelize.literal(`
              (
                SELECT COUNT(*)::INTEGER FROM "tasks" AS "Subtask"
                WHERE "Subtask"."parent_id" = "Task"."id"
              )
            `),
              'subtaskCount',
            ],
            [
              Sequelize.literal(`
              (
                SELECT COUNT(*)::INTEGER FROM "images" AS "Image"
                WHERE "Image"."imageable_id" = "Task"."id"
                AND "Image"."imageable_type" = 'Task'
              )
            `),
              'attachmentCount',
            ],
            [
              Sequelize.literal('"event->departments"."name"'),
              'department_name',
            ],
            [
              Sequelize.literal('"event->incident_divisions"."name"'),
              'incident_division_name',
            ],
            [Sequelize.literal('"task_list"."name"'), 'list_name'],
            [
              Sequelize.literal(`
                (
                  SELECT COUNT(*)::INTEGER FROM "comments"
                  WHERE "comments"."commentable_id" = "Task"."id"
                  AND "comments"."commentable_type" = '${CommentableTypes.TASK}'
                )
              `),
              'comment_count',
            ],
            [
              Sequelize.literal(`(
                SELECT COUNT(*) = COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS all_completed
                FROM "tasks"
                WHERE "tasks"."parent_id" = "Task"."id"
              )`),
              'is_subtasks_completed',
            ],
            [Sequelize.literal('"creator"."name"'), 'creator_name'],
            subtasksAssignees('Task'),
            isPastDue('Task', time_zone),
          ],
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: [],
          },
          {
            model: TaskList,
            attributes: [],
          },
          {
            model: TaskCategory,
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
          {
            model: User,
            as: 'users',
            attributes: ['id', 'name', 'email', 'cell', 'country_code'],
            through: { attributes: [] },
            include: [
              imageInclude([
                Sequelize.literal(`"users->images->created_by"."name"`),
                'createdBy',
              ]),
            ],
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
                  id: { [Op.eq]: Sequelize.literal('"Task"."department_id"') },
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
          {
            model: Task,
            as: 'subtasks',
            attributes: {
              exclude: excludeAttributes,
              include: [taskDepartmentName('subtasks->')],
            },
            include: [
              imageInclude([
                Sequelize.literal(`"subtasks->images->created_by"."name"`),
                'createdBy',
              ]),
              {
                model: TaskCategory,
                attributes: ['id', 'name'],
                through: { attributes: [] },
              },
              {
                model: User,
                as: 'users',
                attributes: ['id', 'name', 'email', 'cell', 'country_code'],
                through: { attributes: [] },
                include: [
                  imageInclude([
                    Sequelize.literal(
                      `"subtasks->users->images->created_by"."name"`,
                    ),
                    'createdBy',
                  ]),
                ],
              },
              taskDeparmentInclude(event_id, 'subtasks'),
            ],
          },
          {
            model: TaskList,
            attributes: [],
          },
          imageInclude([
            Sequelize.literal(`"images->created_by"."name"`),
            'createdBy',
          ]),
        ],
        order: taskByListOrder(sort_column, sort_by, false),
      });
    }

    // getting count of tasks according to their status and priority with out any filters
    const taskCounts = await taskStatusCount(
      event_id,
      time_zone,
      false,
      null,
      user,
    );

    // getting filtered count of tasks according to their status and priority
    const filteredTaskCounts = await taskStatusCount(
      event_id,
      time_zone,
      true,
      taskListQueryDto,
      user,
    );

    if (csv_pdf) {
      const formattedListedTasks = [
        ...listedTasks.map((list: TaskList) => {
          const _list: TaskList = list.get({ plain: true });
          return _list.tasks.map((task) => ({
            ...task,
            taskListName: _list.name,
          }));
        }),
      ].flat();

      return await generateCsvOrPdfForTasksListing(
        taskListQueryDto,
        [
          ...formattedListedTasks,
          ...standaloneTasks.map((task) => task.get({ plain: true })),
        ],
        req,
        res,
        this.httpService,
        time_zone,
      );
    }

    // Fetch all task lists for the event, excluding already populated listedTasks

    // Fetch all task lists for the event, excluding already populated listedTasks
    const mergedListedTasks = await fetchAndSortTaskLists(
      event_id,
      listedTasks,
      user.id,
      selected_list,
    );

    return res.send(
      successInterceptorResponseFormat({
        data: [
          {
            listedTasks: mergedListedTasks,
            standaloneTasks,
          },
        ],
        counts: {
          taskCounts,
          filteredTaskCounts,
        },
      }),
    );
  }

  async getAllTasksByList(
    taskByListDto: TaskByListDto,
    user: User,
    res: Response,
  ) {
    const { event_id, task_list_id, sort_by, sort_column } = taskByListDto;

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    // checking list exist or not
    if (task_list_id) await isTaskListExist(task_list_id, event_id, user.id);

    const tasks = await Task.findAll({
      where: {
        ...(await tasksByListWhereQuery(taskByListDto, user, time_zone)),
        ...customFilters(taskByListDto, true, time_zone),
        ...standaloneTaskWhere(taskByListDto),
      },
      attributes: {
        include: [
          [Sequelize.literal('"event->departments"."name"'), 'department_name'],
          [
            Sequelize.literal('"event->incident_divisions"."name"'),
            'incident_division_name',
          ],
          [Sequelize.literal('"task_list"."name"'), 'list_name'],
          [
            Sequelize.literal(`CAST(COUNT("task_comments"."id") AS INTEGER)`),
            'comment_count',
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT(*) = COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS all_completed
              FROM "tasks" AS "_tasks"
              WHERE "_tasks"."parent_id" = "Task"."id"
            )`),
            'is_subtasks_completed',
          ],
          subtasksAssignees('Task'),
          isPastDue('Task', time_zone),
        ],
      },
      include: [
        {
          model: TaskCategory,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'cell', 'country_code'],
          through: { attributes: [] },
          include: [
            imageInclude([
              Sequelize.literal(`"users->images->created_by"."name"`),
              'createdBy',
            ]),
          ],
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
                id: { [Op.eq]: Sequelize.literal('"Task"."department_id"') },
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
        {
          model: Task,
          as: 'subtasks',
          attributes: {
            exclude: excludeAttributes,
            include: [
              taskDepartmentName('subtasks->'),
              isPastDue('subtasks', time_zone),
            ],
          },
          include: [
            imageInclude([
              Sequelize.literal(`"subtasks->images->created_by"."name"`),
              'createdBy',
            ]),
            {
              model: TaskCategory,
              attributes: ['id', 'name'],
              through: { attributes: [] },
            },
            {
              model: User,
              as: 'users',
              attributes: ['id', 'name', 'email', 'cell', 'country_code'],
              through: { attributes: [] },
              include: [
                imageInclude([
                  Sequelize.literal(
                    `"subtasks->users->images->created_by"."name"`,
                  ),
                  'createdBy',
                ]),
              ],
            },
            taskDeparmentInclude(event_id, 'subtasks'),
          ],
        },
        {
          model: Comment,
          attributes: [],
        },
        imageInclude([
          Sequelize.literal(`"images->created_by"."name"`),
          'createdBy',
        ]),
        ...commonStatusCountInclude,
      ],
      order: taskByListOrder(sort_column, sort_by, false),
      group: [
        `"Task"."id"`,
        `"event->departments"."name"`,
        `"event->incident_divisions"."name"`,
        `"task_list"."name"`,
        `"task_categories"."id"`,
        `"users"."id"`,
        `"users->images"."id"`,
        `"users->images->created_by"."name"`,
        `"subtasks"."id"`,
        `"subtasks->event->departments"."name"`,
        `"subtasks->images"."id"`,
        `"subtasks->images->created_by"."name"`,
        `"subtasks->task_categories"."id"`,
        `"subtasks->users"."id"`,
        `"subtasks->users->images"."id"`,
        `"subtasks->users->images->created_by"."name"`,
        `"images"."id"`,
        `"images->created_by"."name"`,
      ],
    });

    const tasksWithCounts = await taskByListCounts(tasks);

    // getting count of tasks according to their status and priority with out any filters
    const taskCounts = await taskStatusCount(
      event_id,
      time_zone,
      false,
      taskByListDto,
      user,
      true,
    );

    // getting filtered count of tasks according to their status and priority
    const filteredTaskCounts = await taskStatusCount(
      event_id,
      time_zone,
      true,
      taskByListDto,
      user,
    );

    return res.send(
      successInterceptorResponseFormat({
        data: tasksWithCounts,
        counts: { filteredTaskCounts, taskCounts },
      }),
    );
  }

  async getAllTaskListNamesWithFilters(
    taskListNamesQueryDto: TaskListNamesQueryDto,
    user: User,
    res: Response,
  ) {
    let needConcatenation = false;
    let uniqueArray = [];
    const { event_id, filters } = taskListNamesQueryDto;

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    const task_list_names = await TaskList.findAll({
      where: {
        ...(await listedTaskListWhereQuery(
          taskListNamesQueryDto,
          user,
          time_zone,
          null,
        )),
        ...customFilters(taskListNamesQueryDto, false, time_zone),
      },
      attributes: [
        ...listNamesCommonAttributes,
        [
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM "tasks"
            WHERE "tasks"."task_list_id" = "TaskList"."id"
            AND "tasks"."status" = '${TaskStatus.COMPLETED}'
            AND "tasks"."deadline" < '${currentTimestamp(time_zone)}'
            AND "tasks"."parent_id" IS NULL
          )`),
          'is_completed_tasks',
        ],
        [Sequelize.literal('"task_list_orders"."order"'), 'order'],
        [Sequelize.literal('"task_list_orders"."is_pinned"'), 'is_pinned'],
        isListCreator(user.id),
      ],
      include: [
        {
          model: Task,
          where: taskWhere(taskListNamesQueryDto),
          required: false,
          attributes: ['id'],
          include: [
            {
              model: TaskCategory,
              attributes: [],
              through: { attributes: [] },
            },
            {
              model: User,
              as: 'users',
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
                      [Op.eq]: Sequelize.literal('"tasks"."department_id"'),
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
                      [Op.eq]: Sequelize.literal(
                        '"tasks"."incident_division_id"',
                      ),
                    },
                  },
                  required: false,
                },
              ],
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
          ],
        },
        {
          model: TaskListOrder,
          attributes: [],
          where: { user_id: user.id },
          required: false,
        },
      ],
      order: [
        [Sequelize.col('"task_list_orders"."is_pinned"'), SortBy.DESC],

        // Task list order on the base of user list orders
        [Sequelize.col('"task_list_orders"."order"'), SortBy.ASC],

        ['created_at', SortBy.ASC],
      ],
    });

    const task_list_names_count = await TaskList.findAll({
      where: listedTaskListCountWhereQuery(event_id),
      attributes: [
        ...listNamesCommonAttributes,
        [
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM "tasks"
            WHERE "tasks"."task_list_id" = "TaskList"."id"
            AND "tasks"."status" = '${TaskStatus.COMPLETED}'
            AND "tasks"."deadline" < '${currentTimestamp(time_zone)}'
            AND "tasks"."parent_id" IS NULL
          )`),
          'is_completed_tasks',
        ],
        [Sequelize.literal('"task_list_orders"."order"'), 'order'],
        [Sequelize.literal('"task_list_orders"."is_pinned"'), 'is_pinned'],
        isListCreator(user.id),
      ],
      include: [
        {
          model: TaskListOrder,
          attributes: [],
          where: { user_id: user.id },
          required: false,
        },
      ],
      order: [
        [Sequelize.col('"task_list_orders"."is_pinned"'), SortBy.DESC],

        // Task list order on the base of user list orders
        [Sequelize.col('"task_list_orders"."order"'), SortBy.ASC],

        ['createdAt', SortBy.ASC],
      ],
      raw: true,
    });

    const standalone_task_counts = await Task.findAll({
      where: {
        ...standaloneTaskListWhereQuery(taskListNamesQueryDto, user, time_zone),
        ...customFilters(taskListNamesQueryDto, true, time_zone),
        ...standaloneTaskWhere(taskListNamesQueryDto),
      },
      attributes: ['id'],
      include: [
        {
          model: TaskCategory,
          attributes: [],
          through: { attributes: [] },
        },
        {
          model: TaskList,
          attributes: [],
        },
        {
          model: User,
          as: 'users',
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
                id: { [Op.eq]: Sequelize.literal('"Task"."department_id"') },
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
      ],
    });

    const taskListNames = task_list_names.map((taskList) => {
      const _taskList = taskList.get({ plain: true });
      delete _taskList.tasks;

      if (taskList.tasks.length === 0) {
        // If task_count is 0, check the filters
        const hasCategoriesFilter =
          filters?.length &&
          filters.some((filter) => filter.filter === 'categories');

        // Only exclude the task list if "categories" filter is not applied
        if (hasCategoriesFilter) return null;
      }

      return {
        ..._taskList,
        task_count: taskList.tasks.length || 0, // Access the task count
      };
    });

    // Filter out null values in the result array
    const filteredTaskListNames = taskListNames.filter((item) => item !== null);

    // checking if filters are applied or not
    if (task_list_names_count.length !== task_list_names.length)
      needConcatenation = true;

    if (needConcatenation) {
      const _task_list_names_count = task_list_names_count.map(
        (_task_list_name) => ({
          ..._task_list_name,
          task_count: 0,
          is_completed_tasks: false,
        }),
      );

      // Concatenate the arrays
      const concatenatedArray = [
        ...filteredTaskListNames,
        ..._task_list_names_count,
      ];

      /**
       * concatenate both arrays
       * One this including task list names which have task counts
       * Second is all task list name with manually adding task_count as 0
       * Prioritize the first array task_count
       * Sort on the basis of is_pinned & order
       */
      uniqueArray = sortListNames(concatenatedArray);
    }

    return res.send(
      successInterceptorResponseFormat({
        data: needConcatenation ? uniqueArray : filteredTaskListNames,
        counts: { standalone_task_counts: standalone_task_counts.length || 0 },
      }),
    );
  }

  async getAllTaskListNames(event_id: number, user: User) {
    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, event_id);

    const taskLists = await TaskList.findAll({
      where: listedTaskListCountWhereQuery(event_id),
      attributes: [
        ...listNamesCommonAttributes,
        [Sequelize.literal('"task_list_orders"."order"'), 'order'],
        [Sequelize.literal('"task_list_orders"."is_pinned"'), 'is_pinned'],
        isListCreator(user.id),
      ],
      include: [
        {
          model: TaskListOrder,
          attributes: [],
          where: { user_id: user.id },
          required: false,
        },
      ],
      order: [
        [Sequelize.col('"task_list_orders"."is_pinned"'), SortBy.DESC],

        // Task list order on the base of user list orders
        [Sequelize.col('"task_list_orders"."order"'), SortBy.ASC],

        // If task list orders not set, default sorting will be based on created_at
        ['created_at', SortBy.ASC],
      ],
    });

    return taskLists;
  }

  async updateTaskList(
    id: number,
    updateTaskListDto: UpdateTaskListDto,
    user: User,
  ) {
    const { event_id, name, order } = updateTaskListDto;
    let updatedTaskList: TaskList;

    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, event_id);

    // to change the socket response same
    const taskList = await isTaskListExist(id, event_id, user.id);

    // if name is updating, need to check already exist task list name
    if (name) {
      const isTaskListNameAlreadyExist = await TaskList.findOne({
        where: {
          id: { [Op.ne]: taskList.id },
          name: {
            [Op.iLike]: name.toLowerCase().trim(),
          },
          event_id,
        },
      });

      if (isTaskListNameAlreadyExist)
        throw new ConflictException(RESPONSES.alreadyExist('Task List Name'));
    }

    const transaction = await this.sequelize.transaction();

    try {
      // shifting up and down old orders
      await updateTaskListOrders(
        event_id,
        order,
        taskList.order,
        taskList.id,
        user.id,
        transaction,
      );

      updatedTaskList = await taskList.update(updateTaskListDto, {
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    const socketTaskList = (
      await isTaskListExist(id, event_id, user.id, { useMaster: true })
    ).get({
      plain: true,
    });

    socketTaskList['isDeleted'] = false;

    this.pusherService.sendUpdatedTaskList(socketTaskList);

    return updatedTaskList;
  }

  async updateMultipleTaskList(
    id: number,
    updateMultipleTasksDto: UpdateMultipleTasksDto,
    user: User,
  ) {
    const { event_id, date, incident_division_id, is_subtask, task_id } =
      updateMultipleTasksDto;

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    // Fetch the task list and check for date locking
    const { is_date_locked } = await isTaskListExist(id, event_id, user.id);

    if (date) {
      if (is_date_locked)
        return {
          message: _ERRORS.DATE_LOCK_ERROR,
        };

      const completedPastDueDuration = momentTimezone()
        .tz(time_zone)
        .diff(momentTimezone(date))
        .toString();

      const where = {};

      if (is_subtask) where['parent_id'] = task_id;
      else where['parent_id'] = { [Op.eq]: null };

      const listTasks = await Task.findAll({
        where: { event_id, task_list_id: id, ...where },
        attributes: [
          'id',
          'deadline',
          'start_date',
          'parent_id',
          'status',
          'completed_past_due',
        ],
      });

      const tasksToUpdate = [];

      for (const task of listTasks) {
        const taskToUpdate = {
          deadline: date,
        };

        const subtasks = await Task.findAll({
          where: { task_list_id: id, parent_id: task.id },
          attributes: ['id', 'deadline', 'parent_id'],
        });

        for (const subtask of subtasks) {
          if (subtask.deadline > date) {
            subtask.deadline = date;

            await subtask.save();
          }
        }

        // if the deadline changes to after current time stamp,
        // saving completed_past_due true else false
        // saving duration
        if (
          date < currentTimestamp(time_zone) &&
          task.status === TaskStatus.COMPLETED
        ) {
          taskToUpdate['completed_past_due_duration'] =
            completedPastDueDuration;
          taskToUpdate['completed_past_due'] = true;
        } else if (
          date > currentTimestamp(time_zone) &&
          task.status === TaskStatus.COMPLETED
        ) {
          taskToUpdate['completed_past_due'] = false;
        }

        // if start date is greater than then updated deadline then saving start date as null
        if (task.start_date > date) {
          taskToUpdate['start_date'] = null;
        }

        tasksToUpdate.push({
          task,
          dataToUpdate: taskToUpdate,
        });
      }

      // Perform all updates in parallel using Promise.all
      const bulkUpdate = tasksToUpdate.map(async ({ task, dataToUpdate }) => {
        Object.assign(task, dataToUpdate);
        return task.save();
      });

      await Promise.all(bulkUpdate);

      this.pusherService.sendMultipleTasksUpdate(
        RESPONSES.updatedSuccessfully('Tasks'),
        event_id,
      );

      return {
        message: _MESSAGES.DATE_UPDATED_AGINST_ALL_TASK_SUCCESSFULLY,
      };
    }

    if (incident_division_id) {
      // checking incident_division_id is assigned against this event
      await isEventIncidentDivisionExist(incident_division_id, event_id);

      // updating incident_division_id where given task_list_id exist
      await Task.update(
        { incident_division_id },
        { where: { task_list_id: id } },
      );

      this.pusherService.sendMultipleTasksUpdate(
        RESPONSES.updatedSuccessfully('Tasks'),
        event_id,
      );

      return {
        message:
          _MESSAGES.INCIDENT_DIVISION_UPDATED_AGINST_ALL_TASK_SUCCESSFULLY,
      };
    }

    throw new BadRequestException(
      _ERRORS.DATE_OR_INCIDENT_DIVISION_ID_IS_REQUIRED,
    );
  }

  /**
   * Pin or unpin a task list for a specific user.
   *
   * If the task list is currently pinned, it will be unpinned and the task orders will be adjusted accordingly. If it is unpinned, it will be pinned and the task orders will be updated. The function ensures that only the correct event and user combination is affected and notifies the system of any updates.
   * @param id - The ID of the task list to be pinned or unpinned.
   * @param user - The user attempting to pin or unpin the task list.
   * @returns A success message indicating whether the task list was pinned or unpinned.
   */
  async pinTaskList(id: number, user: User) {
    const taskList = await isTaskListExist(id, null, user.id);

    // Ensure user has access to the event based on the company or subcompany
    await withCompanyScope(user, taskList.event_id);

    // Check if the task list is currently pinned for the user
    const pinnedTaskList = await getUserPinnedTaskList(
      id,
      user.id,
      taskList.event_id,
    );

    const isCurrentlyPinned = pinnedTaskList?.is_pinned;
    const currentOrder = taskList.order;

    if (isCurrentlyPinned) {
      // Unpinning logic: Get the last task order for the event and user
      const lastOrder = await lastTaskListOrder(taskList.event_id, user.id);

      // Update task orders by shifting the current list's order
      await updateTaskListOrders(
        taskList.event_id,
        lastOrder,
        currentOrder,
        taskList.id,
        user.id,
      );

      // Mark the task list as unpinned and update its order
      await TaskListOrder.update(
        { is_pinned: false, order: lastOrder },
        {
          where: {
            task_list_id: id,
            user_id: user.id,
            event_id: taskList.event_id,
          },
        },
      );
    } else {
      // Pinning logic: Get the last pinned order for the event and user
      const lastPinnedOrder = await getListLastPinnedOrder(
        taskList.event_id,
        user.id,
      );

      // Shift task orders by updating the pinned list's order
      await updateTaskListOrders(
        taskList.event_id,
        lastPinnedOrder + 1,
        currentOrder,
        taskList.id,
        user.id,
      );

      // Mark the task list as pinned and update its order
      await TaskListOrder.update(
        { is_pinned: true, order: lastPinnedOrder + 1 },
        {
          where: {
            task_list_id: id,
            user_id: user.id,
            event_id: taskList.event_id,
          },
        },
      );
    }

    const updatedTaskList = await isTaskListExist(id, null, user.id);

    // Notify the system with the updated task list for real-time updates
    this.pusherService.sendUpdatedTaskList(updatedTaskList);

    // Return success message indicating the pinning or unpinning status
    const message = isCurrentlyPinned
      ? 'Task List Successfully Unpinned'
      : 'Task List Successfully Pinned';

    return { message };
  }

  /**
   * Toggles the division lock status for a task list and performs related operations.
   *
   * @param id - The ID of the task list to toggle the lock status for.
   * @param user - The user who is requesting the lock toggle action.
   * @returns An object containing a message indicating whether the division was locked or unlocked.
   */
  async toggleLockDivisions(id: number, user: User) {
    // Fetch the task list and validate user access
    const taskList = await isTaskListExist(id, null, user.id);
    await withCompanyScope(user, taskList.event_id);

    // Check if the user is authorized (either creator or with specific roles)
    const isAuthorized =
      taskList.created_by === user.id ||
      [
        RolesNumberEnum.SUPER_ADMIN,
        RolesNumberEnum.ONTRACK_MANAGER,
        RolesNumberEnum.ADMIN,
        RolesNumberEnum.TASK_ADMIN,
        RolesNumberEnum.REGIONAL_ADMIN,
      ].includes(+user['role']);

    if (!isAuthorized) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    // Toggle the division lock status and save the task list
    taskList.is_division_locked = !taskList.is_division_locked;
    await taskList.save();

    // Notify via Pusher and update task count
    this.pusherService.sendUpdatedTaskList(taskList);
    sendTaskCountUpdate(taskList.event_id, this.pusherService);

    // Return the appropriate message
    const message = `Incident Division Successfully ${taskList.is_division_locked ? 'Locked' : 'Unlocked'}`;

    return { message };
  }

  /**
   * Toggles the date lock for a task list and performs related operations.
   *
   * @param id - The ID of the task list to toggle the lock date for.
   * @param user - The user who is requesting the lock toggle action.
   * @returns An object containing a message indicating whether the date was locked or unlocked.
   */
  async toggleLockDates(id: number, user: User) {
    const taskList = await isTaskListExist(id, null, user.id);

    // Ensure the current user is the creator of the task list
    if (taskList.created_by !== user.id) {
      throw new ForbiddenException(_ERRORS.LIST_CREATOR_ERROR);
    }

    // Ensure the user has access to the event based on company or subcompany
    await withCompanyScope(user, taskList.event_id);

    // Toggle the is_date_locked status and set the message accordingly
    taskList.is_date_locked = !taskList.is_date_locked;
    const message = taskList.is_date_locked
      ? 'Date Successfully Locked'
      : 'Date Successfully Unlocked';

    await taskList.save();

    // Notify the task list update and update task count
    this.pusherService.sendUpdatedTaskList(taskList);
    sendTaskCountUpdate(taskList.event_id, this.pusherService);

    return { message };
  }

  async deleteTaskList(id: number, event_id: number, user: User) {
    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, event_id);

    // to change the socket response same as Create
    const taskList = (await isTaskListExist(id, event_id, user.id)).get({
      plain: true,
    });

    const transaction = await this.sequelize.transaction();

    try {
      // if order exists => if task_list_order exists then need to perform shift down operation on task list orders
      // re-order task list on deleting a task
      if (taskList.order)
        await reorderTaskList(event_id, user.id, taskList.order, transaction);

      await TaskList.destroy({ where: { id }, transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    taskList['isDeleted'] = true;

    this.pusherService.sendUpdatedTaskList(taskList);

    sendTaskCountUpdate(taskList.event_id, this.pusherService);

    return { message: RESPONSES.destroyedSuccessfully('Task List') };
  }
}
