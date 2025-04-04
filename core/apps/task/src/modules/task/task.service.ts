import momentTimezone from 'moment-timezone';
import { Response, Request } from 'express';
import {
  BulkCreateOptions,
  CreateOptions,
  DestroyOptions,
  Op,
  UpdateOptions,
} from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { sendTaskUpdate } from '@Common/helpers/sockets';
import {
  Editor,
  CommentableTypes,
  ERRORS,
  PolymorphicType,
  RESPONSES,
  SortBy,
  SocketTypesStatus,
  restrictedDeleteImageRoleTaskModule,
} from '@ontrack-tech-group/common/constants';
import {
  Event,
  EventIncidentDivision,
  Image,
  IncidentDivision,
  Task,
  TaskList,
  User,
  UserTask,
} from '@ontrack-tech-group/common/models';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  ChangeLogService,
  CommunicationService,
  ImageService,
  PusherService,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import {
  calculatePagination,
  getPageAndPageSize,
  getUserRole,
  isEventExist,
  isUpperRoles,
  successInterceptorResponseFormat,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { TaskStatus, _ERRORS, _MESSAGES } from '@Common/constants';
import {
  currentTimestamp,
  sendTaskCountUpdate,
  smsEmailForMentionedUser,
} from '@Common/helpers';
import {
  commonStatusCountIncludeWithSubtasks,
  createTaskListWithValidation,
  lastTaskListOrder,
  tasksByListWhereQuery,
  taskStatusCount,
} from '@Modules/task-list/helpers';
import { TaskByListDto, TaskListQueryDto } from '@Modules/task-list/dto';
import {
  EventUserModel,
  checkPermissions,
  cloneTasksDataValidation,
  createOrUpdateTaskValidation,
  createRecursiveTasks,
  divisionIdsValidation,
  generatePdfForTask,
  getEventNameSearch,
  getLastPinnedOrder,
  getTaskByIdQuery,
  isEventDepartmentExist,
  isMultipleTaskExist,
  isTaskExist,
  isTaskListExist,
  isEventUserExist,
  isUserListExist,
  lastTaskOrder,
  linkAssignee,
  linkCategories,
  reorderTask,
  sendRealTimeData,
  shiftUpRemainingTasks,
  updateTaskOrder,
  removeSubTasksAssignee,
  bulkLinkAssignee,
  updateMultipleTaskValidation,
  updateRecursiveTasks,
} from './helpers';
import {
  AddCommentDto,
  CloneListOrTaskDto,
  CreateBulkTaskDto,
  CreateTaskDto,
  DeleteMultipleTasksDto,
  EventNamesQueryParams,
  GetTaskCommentQueryDto,
  GetTaskQueryParamsDto,
  TaskNamesQueryParams,
  UpdateMultipleTasksDto,
  UpdateTaskAssigneeDto,
  UpdateTaskDto,
  UploadAttachmentDto,
} from './dto';

@Injectable()
export class TaskService {
  constructor(
    private sequelize: Sequelize,
    private readonly changeLogService: ChangeLogService,
    private readonly communicationService: CommunicationService,
    private readonly pusherService: PusherService,
    private readonly imageService: ImageService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly translateService: TranslateService,
  ) {}

  async createTask(createTaskDto: CreateTaskDto, user: User) {
    let task: Task;
    const {
      user_id,
      category_ids,
      is_recursive,
      event_id,
      taskAttachments,
      task_list_id,
      department_id: DepartmentId,
    } = createTaskDto;
    const bulkUrls = [];

    // Check if user has access to this event or not based on its company or subcompany
    const [company_id, , time_zone] = await withCompanyScope(user, event_id);

    // validating data before creating a task.
    // fetching task list name from validation helper because need name for message notification
    const { taskList, assigneeUser } =
      await createOrUpdateTaskValidation(createTaskDto);

    // getting last order of task
    const lastOrder = await lastTaskOrder(event_id, task_list_id);

    const transaction = await this.sequelize.transaction();

    if (is_recursive) {
      try {
        const response = await createRecursiveTasks(
          createTaskDto,
          transaction,
          user,
          lastOrder,
        );

        // Send a real-time update for multiple tasks if recursive
        this.pusherService.sendMultipleTasksUpdate(
          RESPONSES.createdSuccessfully('Tasks'),
          event_id,
        );

        await transaction.commit();

        return response;
      } catch (err) {
        await transaction.rollback();
        throwCatchError(err);
      }
    } else {
      try {
        // Non-recursive task creation logic
        task = await Task.create(
          {
            ...createTaskDto,
            created_by: user.id,
            order: lastOrder + 1,
            department_id: task_list_id ? DepartmentId : null,
          },
          {
            transaction,
            editor: { editor_id: user.id, editor_name: user.name },
          } as CreateOptions & {
            editor: Editor;
          },
        );

        if (category_ids)
          await linkCategories(category_ids, task.id, user, false, transaction);

        // linked a user to this task
        if (task_list_id && user_id)
          await linkAssignee(
            assigneeUser,
            task,
            company_id,
            taskList.name,
            false,
            transaction,
            this.communicationService,
            user,
            this.pusherService,
          );

        /**
         * If URLs object is present while creating a subtask then saving multple images againts subtask
         * Make a URLs array according to DTO of creating a image
         * Passing this array to imageService for saving bulk Images
         */
        if (taskAttachments?.length) {
          for (const url of taskAttachments) {
            bulkUrls.push({
              name: url.name,
              url: url.url,
              imageable_id: task.id,
              imageable_type: PolymorphicType.TASK,
              creator_id: user.id,
            });
          }

          await this.imageService.createBulkImage(bulkUrls, null, transaction);
        }

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throwCatchError(err);
      }

      // Commit the transaction, saving the changes to the database
      const createdTask = await getTaskByIdQuery(
        task.id,
        task.event_id,
        time_zone,
        {
          useMaster: true,
        },
      );

      // Send real-time data
      sendRealTimeData(
        createdTask,
        task.event_id,
        this.pusherService,
        user,
        time_zone,
      );

      // Send real-time updates through the helper function
      sendTaskUpdate(
        createdTask,
        true,
        SocketTypesStatus.CREATE,
        this.pusherService,
      );

      sendTaskCountUpdate(event_id, this.pusherService);

      return createdTask;
    }
  }

  async createBulkTask(createBulkTaskDto: CreateBulkTaskDto, user: User) {
    // An object to store the IDs of created or existing task lists.
    // Maps each unique task list name to its respective task_list_id to avoid redundant creation of task lists.
    const taskListsMap = {};
    const { tasks, event_id } = createBulkTaskDto;

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    // Check if provided division ids are exist and associated to event
    await divisionIdsValidation(tasks, event_id);

    // check if all user provided in any of the tasks are exist and belongs to current event or not
    await isUserListExist(
      tasks.filter((task) => !!task.user_id).map((task) => task.user_id),
      event_id,
    );

    const transaction = await this.sequelize.transaction();

    try {
      // Since each task can have a different task_list_name, we may need to create a new task list for each unique name
      const taskListNames = [
        ...new Set(tasks.map((task) => task.list_name).filter(Boolean)),
      ];

      // getting last order of thus user against event
      let lastOrder = await lastTaskListOrder(event_id, user.id);

      for (const taskListName of taskListNames) {
        // Check if the task list already exists
        const existingTaskList = await TaskList.findOne({
          where: { name: taskListName, event_id },
        });

        // If the task list exists, use its ID
        if (existingTaskList) {
          // Get the last order of the task
          const lastOrder = await lastTaskOrder(
            event_id,
            existingTaskList.id || null,
          );

          taskListsMap[taskListName] = {
            task_list_id: existingTaskList.id,
            order: lastOrder,
          };
        } else {
          const createdTaskList = await createTaskListWithValidation(
            {
              event_id,
              name: taskListName,
              order: lastOrder >= 0 ? ++lastOrder : -1,
            },
            user,
            transaction,
          );

          taskListsMap[taskListName] = {
            task_list_id: createdTaskList.id,
            order: -1,
          };
        }
      }

      const formattedTasks = await Promise.all(
        tasks.map(async (task) => {
          const { user_id, status, deadline, list_name, subtasks } = task;

          // If the task status is 'completed' and check if it was completed past the deadline
          if (status === TaskStatus.COMPLETED) {
            task['completed_past_due'] = deadline < currentTimestamp(time_zone);

            task['completed_past_due_duration'] = momentTimezone
              .tz(time_zone)
              .diff(momentTimezone(deadline))
              .toString();

            task['completed_at'] = momentTimezone().tz(time_zone).toISOString();
          }

          const task_list = list_name ? taskListsMap[list_name] : null;

          const _task = {
            ...task,
            event_id,
            task_list_id: task_list?.['task_list_id'] || null,
            order: task_list ? ++task_list['order'] : null,
            created_by: user.id,
            subtasks: subtasks.map((subtask) => {
              // If the subtask status is 'completed' and check if it was completed past the deadline
              if (subtask.status === TaskStatus.COMPLETED) {
                subtask['completed_past_due'] =
                  subtask.deadline < currentTimestamp(time_zone);

                subtask['completed_past_due_duration'] = momentTimezone
                  .tz(time_zone)
                  .diff(momentTimezone(subtask.deadline))
                  .toString();

                subtask['completed_at'] = momentTimezone()
                  .tz(time_zone)
                  .toISOString();
              }

              return {
                ...subtask,
                event_id,
                task_list_id: task_list?.['task_list_id'] || null,
                user_tasks: subtask.user_id
                  ? { user_id: subtask.user_id }
                  : undefined,
                created_by: user.id,
              };
            }),
          };

          if (user_id) _task['user_tasks'] = { user_id };

          return _task;
        }),
      );

      await Task.bulkCreate(formattedTasks, {
        include: [
          { association: 'user_tasks' },
          {
            association: 'subtasks',
            include: [{ association: 'user_tasks' }],
          },
        ],
        transaction,
        editor: { editor_id: user.id, editor_name: user.name },
      } as BulkCreateOptions & {
        editor: Editor;
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.pusherService.sendMultipleTasksUpdate(
      RESPONSES.createdSuccessfully('Tasks'),
      event_id,
    );

    sendTaskCountUpdate(event_id, this.pusherService);

    return {
      message: RESPONSES.createdSuccessfully('Tasks'),
      list_ids: Object.values(taskListsMap).map(
        (taskList) => taskList['task_list_id'],
      ),
    };
  }

  async addTaskComment(addCommentDto: AddCommentDto, user: User) {
    const { task_id, text, user_ids } = addCommentDto;
    if (text === '')
      throw new BadRequestException(ERRORS.COMMENT_CANNOT_BE_EMPTY);

    const task = await isTaskExist(task_id);

    const event = await isEventExist(task.event_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [company_id, , time_zone] = await withCompanyScope(
      user,
      task.event_id,
    );

    const createdComment = await this.communicationService.communication(
      {
        text,
        event_id: task.event_id,
        commentable_type: CommentableTypes.TASK,
        commentable_id: task_id,
        user_ids,
      },
      'create-comment',
      user,
    );

    if (user_ids?.length) {
      await smsEmailForMentionedUser(
        user_ids,
        company_id,
        task,
        event,
        user,
        this.communicationService,
        this.pusherService,
        createdComment.id,
      );
    }

    const updatedTask = await getTaskByIdQuery(
      task_id,
      task.event_id,
      time_zone,
    );

    // Send real-time updates through the helper function

    sendRealTimeData(
      updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    sendTaskUpdate(
      updatedTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return createdComment;
  }

  async uploadAttachment(uploadAttachmentDto: UploadAttachmentDto, user: User) {
    const { task_id, url, name } = uploadAttachmentDto;

    const task = await isTaskExist(task_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    // create image entry
    const createdImage = await this.imageService.createImage(
      task_id,
      PolymorphicType.TASK,
      url,
      name,
      user.id,
      null,
      user.name,
    );

    const updatedTask = await getTaskByIdQuery(
      task_id,
      task.event_id,
      time_zone,
    );

    sendRealTimeData(
      updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    // Send real-time updates through the helper function
    sendTaskUpdate(
      updatedTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return {
      id: createdImage.id,
      url: createdImage.url,
      name: createdImage.name,
    };
  }

  async cloneListsOrTasks(
    cloneListOrTaskDto: CloneListOrTaskDto,
    event_id: number,
    user: User,
  ) {
    const { listed_tasks, standalone_tasks } = cloneListOrTaskDto;

    if (!listed_tasks.length && !standalone_tasks.length)
      throw new BadRequestException(_ERRORS.THE_TASK_LISTS_ARE_EMPTY);

    await isEventExist(event_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    const transaction = await this.sequelize.transaction();

    try {
      await cloneTasksDataValidation(
        cloneListOrTaskDto,
        event_id,
        user,
        time_zone,
        transaction,
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.pusherService.sendMultipleTasksUpdate(
      RESPONSES.createdSuccessfully('Tasks'),
      event_id,
    );

    sendTaskCountUpdate(event_id, this.pusherService);

    return { message: _MESSAGES.TASKS_OR_LISTS_ARE_CLONED_SUCCESSFULLY };
  }

  async getAllTaskNamesByList(
    taskNamesQueryParams: TaskNamesQueryParams,
    user: User,
  ) {
    const { task_list_id, event_id } = taskNamesQueryParams;

    const [, , time_zone] = await withCompanyScope(user, event_id);

    // checking task_list is exist or not against task_list_id and event_id
    if (task_list_id) await isTaskListExist(task_list_id, event_id);

    return await Task.findAll({
      attributes: ['id', 'name'],
      where: await tasksByListWhereQuery(taskNamesQueryParams, user, time_zone),
      include: [
        {
          model: TaskList,
          attributes: [],
        },
        ...commonStatusCountIncludeWithSubtasks,
      ],
    });
  }

  async getAllEventNames(eventNameQuery: EventNamesQueryParams, user: User) {
    const { page, page_size, keyword, company_id } = eventNameQuery;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    // checking permission
    await checkPermissions(company_id, user);

    const event = await Event.findAndCountAll({
      where: await getEventNameSearch(keyword, company_id),
      attributes: ['id', 'name'],
      include: !isUpperRoles(+user['role']) ? [EventUserModel(user.id)] : [],
      limit: _page_size || parseInt(this.configService.get('PAGE_LIMIT')),
      offset: _page_size * _page || parseInt(this.configService.get('PAGE')),
      order: [['createdAt', SortBy.DESC]],
      subQuery: false,
    });

    const { rows, count } = event;

    return {
      data: rows,
      pagination: calculatePagination(
        count,
        _page_size || parseInt(this.configService.get('PAGE_LIMIT')),
        _page || parseInt(this.configService.get('PAGE')),
      ),
    };
  }

  async getAllDivisionNamesByEvent(event_id: number, user: User) {
    // checking the right access of this user to passed event
    await withCompanyScope(user, event_id);

    return await IncidentDivision.findAll({
      attributes: [
        [Sequelize.literal('CAST("IncidentDivision"."id" AS INTEGER)'), 'id'],
        'name',
      ],
      include: [
        {
          model: EventIncidentDivision,
          where: { event_id },
          attributes: [],
        },
      ],
      order: [['name', SortBy.ASC]],
    });
  }

  async getTaskById(
    id: number,
    taskQuery: GetTaskQueryParamsDto,
    user: User,
    req: Request = undefined,
    res: Response = undefined,
  ) {
    const { event_id, pdf = undefined, file_name = undefined } = taskQuery;

    // checking task exist or not
    await isTaskExist(id, event_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    const task = await getTaskByIdQuery(id, event_id, time_zone);

    if (pdf) {
      return await generatePdfForTask(
        task,
        file_name,
        req,
        res,
        this.httpService,
        time_zone,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: task,
      }),
    );
  }

  async getTaskChangeLogs(
    id: number,
    paginationDto: PaginationDto,
    user: User,
  ) {
    const task = await isTaskExist(id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , timezone] = await withCompanyScope(user, task.event_id);

    // all change logs against task
    const { data, pagination } = await this.changeLogService.getChangeLogs({
      id,
      types: [PolymorphicType.TASK],
      page: paginationDto.page,
      page_size: paginationDto.page_size,
    });

    const translatedChangelogs =
      await this.translateService.translateChangeLogs(
        user,
        data,
        PolymorphicType.TASK,
        timezone,
      );

    return {
      data: translatedChangelogs,
      pagination,
    };
  }

  async getTaskComments(
    id: number,
    getTaskCommentDto: GetTaskCommentQueryDto,
    user: User,
  ) {
    const task = await isTaskExist(id);

    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, task.event_id);
    const { page, page_size, comment_id } = getTaskCommentDto;
    // all comments against task
    const data = {
      id,
      event_id: task.event_id,
      type: CommentableTypes.TASK,
      page,
      page_size,
      comment_id,
    };

    try {
      return await this.communicationService.communication(
        data,
        'get-comment-list',
        user,
      );
    } catch (err) {
      console.log(
        '🚀 ~ TaskService ~ Communcation Error While Getting Comments ~ err:',
        err,
      );
      throwCatchError(err);
    }
  }

  async getTaskStatusCount(
    countTaskStatusDto: TaskListQueryDto | TaskByListDto,
    user: User,
  ) {
    const { event_id } = countTaskStatusDto;

    const [, , time_zone] = await withCompanyScope(user, event_id);

    // Get unfiltered task counts
    const taskCounts = await taskStatusCount(
      event_id,
      time_zone,
      false,
      countTaskStatusDto,
      user,
      true,
    );

    // Get filtered task counts
    const filteredTaskCounts = await taskStatusCount(
      event_id,
      time_zone,
      true,
      countTaskStatusDto,
      user,
    );

    return {
      taskCounts,
      filteredTaskCounts,
    };
  }

  async updateMultipleTasks(
    updateMultipleTasksDto: UpdateMultipleTasksDto,
    user: User,
  ) {
    const {
      task_ids,
      list_id,
      event_id,
      user_id,
      incident_division_id,
      deadline,
      recursive,
    } = updateMultipleTasksDto;

    let lastOrder: number;

    const [company_id] = await withCompanyScope(user, event_id);

    // add validation before proceeding with bulk update
    await updateMultipleTaskValidation(updateMultipleTasksDto);

    // checking all tasks exist against event_id
    const existingTasks = await isMultipleTaskExist(task_ids, event_id);

    const { assigneeUser } = await updateMultipleTaskValidation(
      updateMultipleTasksDto,
    );

    // getting lowest order task
    const lowestOrderTask = await Task.findOne({
      attributes: ['id', 'order', 'task_list_id'],
      where: {
        id: { [Op.in]: task_ids },
      },
      order: [['order', SortBy.ASC]],
    });

    // getting last order of updated list to maintain the new tasks order
    if (list_id !== undefined || recursive) {
      lastOrder = await lastTaskOrder(
        event_id,
        list_id || existingTasks[0].task_list_id,
      );
    }

    const transaction = await this.sequelize.transaction();

    try {
      // When all tasks are being moved to the private list, the assignee needs to be removed.
      if (list_id === null) {
        await UserTask.destroy({
          where: { task_id: { [Op.in]: task_ids } },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as DestroyOptions & {
          editor: Editor;
        });
      }

      // assing to user functionality
      if (user_id) {
        await bulkLinkAssignee(
          task_ids,
          assigneeUser,
          existingTasks,
          transaction,
          this.communicationService,
          user,
          this.pusherService,
          company_id,
        );
      }

      const updateBulkTasks = task_ids.map((task_id, index) => {
        const updateFields = {
          task_list_id: list_id,
          ...(list_id !== undefined && { order: lastOrder + index + 1 }),
          ...(incident_division_id && { incident_division_id }), // if bulk incident division update
          ...(deadline && { deadline }), // if bulk deadline update
          ...(list_id === null && { department_id: null }),
        };

        return Task.update(updateFields, {
          where: { id: task_id, event_id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & {
          editor: Editor;
        });
      });

      await Promise.all(updateBulkTasks);

      if (recursive?.start_dates && recursive?.deadlines) {
        const updatedMultipleTaskDto = {
          ...updateMultipleTasksDto,
          recursive,
          user_id,
        } as UpdateMultipleTasksDto;

        await updateRecursiveTasks(
          updatedMultipleTaskDto,
          existingTasks,
          transaction,
          user,
          lastOrder,
        );
      }

      // updating the order of remaining tasks
      if (list_id !== undefined)
        await shiftUpRemainingTasks(
          event_id,
          lowestOrderTask.task_list_id,
          lowestOrderTask.order,
          transaction,
        );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.pusherService.sendMultipleTasksUpdate(
      RESPONSES.updatedSuccessfully('Tasks'),
      event_id,
    );

    return { message: RESPONSES.updatedSuccessfully('Tasks') };
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto, user: User) {
    const {
      event_id,
      category_ids,
      taskAttachments,
      order,
      status,
      deadline,
      task_list_id,
    } = updateTaskDto;
    const bulkUrls = [];
    let isOrderUpdated = false;

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    const task = await isTaskExist(id, event_id, time_zone);
    const _task = task.get({ plain: true });

    // Before starting the transaction, check if deadline update should be ignored

    if (_task['is_date_locked'] && _task.deadline !== deadline) {
      delete updateTaskDto.deadline;
    }

    // getting old values of task for send old data in socket
    const oldStatus = task.status;
    const oldTaskListId = task.task_list_id;
    const oldTaskListName = _task['list_name'];

    // if a task updates to standalone or link to a list
    let updatedOrder = null;

    // validating data before updating a task.
    await createOrUpdateTaskValidation(updateTaskDto);

    // if the status changes to 'completed' within deadline, saving completed_past_due true else false
    if (status === TaskStatus.COMPLETED) {
      // Set completed_past_due based on deadline and current timestamp
      updateTaskDto['completed_past_due'] =
        task.deadline < currentTimestamp(time_zone);

      if (_task['is_past_due']) {
        updateTaskDto['completed_past_due_duration'] = momentTimezone
          .tz(time_zone)
          .diff(momentTimezone(_task.deadline))
          .toString();
      }

      updateTaskDto['completed_at'] = momentTimezone()
        .tz(time_zone)
        .toISOString();
    } else {
      updateTaskDto['completed_past_due'] = false;
    }

    // If the deadline changes and the task is already completed, adjust the past due status
    if (
      updateTaskDto?.deadline > currentTimestamp(time_zone) &&
      task.status === TaskStatus.COMPLETED
    )
      updateTaskDto['completed_past_due'] = false;

    /**
     * If URLs object is present while updating a subtask then saving multple images againts subtask
     * Make a URLs array according to DTO of creating a image
     * Passing this array to imageService for saving bulk Images
     */
    if (taskAttachments?.length) {
      for (const url of taskAttachments) {
        bulkUrls.push({
          name: url.name,
          url: url.url,
          imageable_id: task.id,
          imageable_type: PolymorphicType.TASK,
          creator_id: user.id,
        });
      }
    }

    const transaction = await this.sequelize.transaction();

    try {
      // if order needs to be updated
      if (order >= 0) {
        await updateTaskOrder(
          event_id,
          task.task_list_id,
          order, // order to be updated
          _task.order, // current order
          transaction,
        );

        isOrderUpdated = true;
      }

      if (category_ids)
        await linkCategories(category_ids, task.id, user, true, transaction);

      // if this task updates to standalone or link to otherlist, need to update its order as well
      if (task_list_id || task_list_id === null) {
        // reorder remaining tasks
        await reorderTask(event_id, task.task_list_id, task.order, transaction);

        updatedOrder = await lastTaskOrder(event_id, task_list_id);

        updateTaskDto = { ...updateTaskDto, order: updatedOrder + 1 };
      }

      // if task is going to make a standalone task, then need to reset assigned information
      if (task_list_id === null) {
        // if department assigned, removing department
        if (task.department_id) {
          updateTaskDto = { ...updateTaskDto, department_id: null };
        } else {
          // if user assigned, removing user
          await UserTask.destroy({
            where: { task_id: id },
            transaction,
          });
        }

        // Unassigning department and user assignee subtasks
        await removeSubTasksAssignee(task.id, transaction);
      }

      await Task.update(updateTaskDto, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      // if attachments, then creating attachments
      bulkUrls?.length &&
        (await this.imageService.createBulkImage(bulkUrls, user, transaction));

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedTask = await getTaskByIdQuery(
      task.id,
      task.event_id,
      time_zone,
      {
        useMaster: true,
      },
    );
    const _updatedTask = updatedTask.get({ plain: true });

    _updatedTask['old_status'] = oldStatus;
    _updatedTask['old_task_list_id'] = oldTaskListId;
    _updatedTask['old_task_list_name'] = oldTaskListName;
    _updatedTask['isOrderUpdated'] = isOrderUpdated;

    // send updates through pusher
    sendRealTimeData(
      _updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    // Send real-time updates through the helper function
    sendTaskUpdate(
      _updatedTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    sendTaskCountUpdate(event_id, this.pusherService);

    return updatedTask;
  }

  async updateTaskPriority(id: number, user: User) {
    const task = await Task.findOne({
      where: { id, parent_id: null },
      attributes: ['id', 'priority', 'event_id'],
    });
    if (!task) throw new NotFoundException(RESPONSES.notFound('Task'));

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    const transaction = await this.sequelize.transaction();

    try {
      await Task.update({ priority: !task.priority }, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedTask = await getTaskByIdQuery(
      task.id,
      task.event_id,
      time_zone,
    );

    sendRealTimeData(
      updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    // Send real-time updates through the helper function
    sendTaskUpdate(
      updatedTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return updatedTask;
  }

  async updateTaskAssignee(
    id: number,
    updateTaskAssigneeDto: UpdateTaskAssigneeDto,
    user: User,
  ) {
    const { event_id, user_id, department_id } = updateTaskAssigneeDto;
    let assigneeUser: User;

    const task = await isTaskExist(id, event_id);

    if (user_id) {
      assigneeUser = await isEventUserExist(user_id, event_id);
    } else if (department_id) {
      // checking, is department exist or not
      await isEventDepartmentExist(department_id, event_id);
    } else {
      throw new BadRequestException(
        _ERRORS.USER_ID_OR_DEPARTMENT_ID_IS_REQUIRED,
      );
    }

    // Check if user has access to this event or not based on its company or subcompany
    const [company_id, , time_zone] = await withCompanyScope(user, event_id);

    const transaction = await this.sequelize.transaction();

    try {
      if (user_id) {
        // updating department_id
        await Task.update({ department_id: null }, {
          where: { id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & {
          editor: Editor;
        });

        // linked a user to this task
        await linkAssignee(
          assigneeUser,
          task,
          company_id,
          null,
          true,
          transaction,
          this.communicationService,
          user,
          this.pusherService,
        );
      } else {
        // destroy existed user task record
        await UserTask.destroy({
          where: { task_id: id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as DestroyOptions & {
          editor: Editor;
        });

        // updating department_id
        await Task.update({ department_id }, {
          where: { id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & {
          editor: Editor;
        });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedTask = await getTaskByIdQuery(
      task.parent_id || task.id,
      task.event_id,
      time_zone,
      { useMaster: true },
    );

    const socketTask = await getTaskByIdQuery(
      task.id,
      task.event_id,
      time_zone,
      { useMaster: true },
    );

    sendRealTimeData(
      updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    // Send real-time updates through the helper function
    sendTaskUpdate(
      socketTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return updatedTask;
  }

  async pinTask(id: number, user: User) {
    const task = await isTaskExist(id);

    // Check if user has access to this event based on company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    const isPinned = task.is_pinned;
    const targetOrder = isPinned
      ? await lastTaskOrder(task.event_id, task.task_list_id) // Unpin scenario
      : (await getLastPinnedOrder(task.event_id, task.task_list_id)) + 1; // Pin scenario

    // Shift the task orders based on pin/unpin action
    await updateTaskOrder(
      task.event_id,
      task.task_list_id,
      targetOrder,
      task.order,
    );

    // Update the task's order and pinned status
    task.order = targetOrder;
    task.is_pinned = !isPinned;
    await task.save();

    // Get updated task details and send real-time data
    const updatedTask = await getTaskByIdQuery(
      task.id,
      task.event_id,
      time_zone,
      {
        useMaster: true,
      },
    );

    sendRealTimeData(
      updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    // Send real-time updates through the helper function
    sendTaskUpdate(
      updatedTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    const actionMessage = isPinned
      ? 'Task Successfully Unpinned'
      : 'Task Successfully Pinned';

    return { message: actionMessage };
  }

  async deleteMultipleTasks(deleteMultipleTasks: DeleteMultipleTasksDto) {
    const { task_ids, event_id } = deleteMultipleTasks;

    // checking all tasks exist against event_id
    await isMultipleTaskExist(task_ids, event_id);

    await Task.destroy({ where: { id: task_ids } });

    this.pusherService.sendMultipleTasksUpdate(
      RESPONSES.destroyedSuccessfully('Tasks'),
      event_id,
    );

    sendTaskCountUpdate(event_id, this.pusherService);

    return { message: RESPONSES.destroyedSuccessfully('Tasks') };
  }

  async deleteTask(id: number, event_id: number, user: User) {
    const task = (await isTaskExist(id, event_id)).get({
      plain: true,
    });

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, event_id);

    // re-order task on deleting a task
    await reorderTask(event_id, task.task_list_id, task.order);

    await Task.destroy({ where: { id } });

    task['isDeleted'] = true;

    sendRealTimeData(task, task.event_id, this.pusherService, user, time_zone);

    // Send real-time updates through the helper function
    sendTaskUpdate(task, false, SocketTypesStatus.DELETE, this.pusherService);

    sendTaskCountUpdate(event_id, this.pusherService);

    return { message: RESPONSES.destroyedSuccessfully('Task') };
  }

  async removeTaskAssignee(id: number, user: User) {
    const task = await isTaskExist(id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    const transaction = await this.sequelize.transaction();

    try {
      if (task.department_id) {
        await Task.update({ department_id: null }, {
          where: { id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as UpdateOptions & {
          editor: Editor;
        });
      } else {
        const userTask = await UserTask.findOne({
          where: { task_id: id },
        });
        if (!userTask)
          throw new NotFoundException(RESPONSES.notFound('Task Assignee'));

        await UserTask.destroy({
          where: { task_id: id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
        } as DestroyOptions & {
          editor: Editor;
        });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedTask = await getTaskByIdQuery(
      task.parent_id || task.id,
      task.event_id,
      time_zone,
      { useMaster: true },
    );

    const socketTask = await getTaskByIdQuery(
      task.id,
      task.event_id,
      time_zone,
      { useMaster: true },
    );

    sendRealTimeData(
      updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    // Send real-time updates through the helper function
    sendTaskUpdate(
      socketTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return { message: 'Remove Task Assignee Successfully' };
  }

  async deleteAttachment(id: number, attachmentId: number, user: User) {
    let deletedImage: Image;

    // checking subtask exist or not
    const task = await isTaskExist(id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    const targetImage = await Image.findOne({
      where: {
        id: attachmentId,
        imageable_id: id,
        imageable_type: PolymorphicType.TASK,
      },
      attributes: ['id', 'creator_id'],
    });

    if (!targetImage) {
      throw new NotFoundException(RESPONSES.notFound('Attachment'));
    }

    // Check if user has a restricted role
    const isRestrictedRole = restrictedDeleteImageRoleTaskModule(
      getUserRole(user),
    );

    // Apply deletion logic based on role restrictions
    if (isRestrictedRole && targetImage.creator_id !== user.id) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    const transaction = await this.sequelize.transaction();

    try {
      // delete attachment
      deletedImage = await this.imageService.deleteImage(
        attachmentId,
        user,
        transaction,
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    deletedImage['isDeleted'] = true;

    this.pusherService.sendUpdatedAttachment(
      deletedImage,
      PolymorphicType.TASK,
      id,
    );

    const updatedTask = await getTaskByIdQuery(
      task.id,
      task.event_id,
      time_zone,
      {
        useMaster: true,
      },
    );

    sendRealTimeData(
      updatedTask,
      task.event_id,
      this.pusherService,
      user,
      time_zone,
    );

    // Send real-time updates through the helper function
    sendTaskUpdate(
      updatedTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return { message: RESPONSES.destroyedSuccessfully('Task Attachment') };
  }
}
