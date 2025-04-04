import momentTimezone from 'moment-timezone';
import { Response, Request } from 'express';
import moment from 'moment';
import {
  BulkCreateOptions,
  CreateOptions,
  DestroyOptions,
  Op,
  Sequelize,
  Transaction,
  UpdateOptions,
} from 'sequelize';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  CommentableTypes,
  CsvOrPdf,
  Editor,
  ERRORS,
  Options,
  RESPONSES,
  RolesNumberEnum,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  Company,
  Department,
  Event,
  EventDepartment,
  EventIncidentDivision,
  EventUser,
  Image,
  IncidentDivision,
  Task,
  TaskCategory,
  TaskList,
  TaskTaskCategory,
  User,
  UserTask,
} from '@ontrack-tech-group/common/models';
import { isEventExist, isUserExist } from '@ontrack-tech-group/common/helpers';
import {
  CommunicationService,
  PusherService,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import { lastTaskListOrder, taskStatusCount } from '@Modules/task-list/helpers';
import {
  CloneORCopy,
  TaskListIdName,
  TaskStatus,
  _ERRORS,
  _MESSAGES,
  _PDFTypes,
} from '@Common/constants';
import {
  currentTimestamp,
  imageInclude,
  imageIncludeForCloning,
  isPastDue,
  pushNotificationAndSMS,
} from '@Common/helpers';
import { excludeAttributes } from '@Modules/subtask/helper';
import { taskDeparmentInclude, taskDepartmentName } from '@Common/queries';
import { subtasksAssignees } from '@Modules/task-list/helpers/query';
import {
  CloneListOrTaskDto,
  CreateTaskDto,
  ListedTasksDto,
  SingleTaskDto,
  TasksDto,
  UpdateMultipleTasksDto,
  UpdateTaskDto,
} from '../dto';
import { isListDateLocked, isListDivisionLocked } from '../queries';
import { isTaskExistAttributes } from './attributes';

export const getTaskWhere = (id: number, event_id?: number) => {
  const _where = { id };

  if (event_id) _where['event_id'] = event_id;

  return _where;
};

export const getTaskListWhere = (id: number, event_id?: number) => {
  const _where = { id };

  if (event_id) _where['event_id'] = event_id;

  if (!_where[Op.and]) _where[Op.and] = [];

  return _where;
};

export const isTaskExist = async (
  id: number,
  event_id?: number,
  eventTimeZone?: string,
) => {
  const task = await Task.findOne({
    where: getTaskWhere(id, event_id),
    attributes: isTaskExistAttributes(eventTimeZone),
    include: [
      {
        model: TaskList,
        attributes: [],
      },
    ],
  });
  if (!task) throw new NotFoundException(RESPONSES.notFound('Task'));

  return task;
};

export const isTaskListExist = async (id: number, event_id?: number) => {
  const taskList = await TaskList.findOne({
    where: getTaskListWhere(id, event_id),
    attributes: [
      'id',
      'name',
      'event_id',
      'is_division_locked',
      'is_date_locked',
      [
        Sequelize.literal(`(
          SELECT "incident_division_id" FROM "tasks"
          WHERE "tasks"."task_list_id" = "TaskList"."id"
          LIMIT 1
        )`),
        'task_division',
      ],
    ],
    raw: true,
  });
  if (!taskList) throw new NotFoundException(RESPONSES.notFound('Task List'));

  return taskList;
};

export const isEventIncidentDivisionExist = async (
  incident_division_id: number,
  event_id: number,
) => {
  const eventIncidentDivision = await EventIncidentDivision.findOne({
    where: { incident_division_id, event_id },
    attributes: ['id'],
  });
  if (!eventIncidentDivision)
    throw new NotFoundException(
      _MESSAGES.INICDENT_DIVISION_NOT_FOUND_AGAINST_THIS_EVENT,
    );
};

export const isEventDepartmentExist = async (
  department_id: number,
  event_id: number,
) => {
  const eventDepartment = await EventDepartment.findOne({
    where: { department_id, event_id },
    attributes: ['id'],
  });
  if (!eventDepartment)
    throw new NotFoundException(
      _MESSAGES.DEPARTMENT_NOT_FOUND_AGAINST_THIS_EVENT,
    );
};

export const createOrUpdateTaskValidation = async (
  taskDto: CreateTaskDto | UpdateTaskDto,
) => {
  const { task_list_id, department_id, incident_division_id, event_id } =
    taskDto;
  let taskList: TaskList;
  let assigneeUser: User;
  // checking event exist or not
  await isEventExist(event_id);

  // checking list exist or not If List_ID is present in Query
  if (task_list_id) taskList = await isTaskListExist(task_list_id, event_id);

  // checking user exist or not If user_id is present in Query
  if ((taskDto as CreateTaskDto)?.user_id)
    assigneeUser = await isEventUserExist(
      (taskDto as CreateTaskDto)?.user_id,
      event_id,
    );

  // checking department exist or not against this event If department_id is present in Query
  if (department_id) await isEventDepartmentExist(department_id, event_id);

  // checking incident division exist or not against this event If incident_division_id is present in Query
  if (incident_division_id)
    await isEventIncidentDivisionExist(incident_division_id, event_id);

  return { taskList, assigneeUser };
};

export const updateMultipleTaskValidation = async (
  multipleTaskDto: UpdateMultipleTasksDto,
) => {
  const { user_id, incident_division_id, event_id, list_id } = multipleTaskDto;
  let assigneeUser: User;

  // checking event exist or not
  await isEventExist(event_id);

  // checking user exist or not If user_id is present in Query
  if (user_id) {
    assigneeUser = await isEventUserExist(user_id, event_id);
  }

  // Link to task -> need to check the given list_id exist against given event_id
  if (list_id) await isTaskListExist(list_id, event_id);

  // checking incident division exist or not against this event If incident_division_id is present in Query
  if (incident_division_id)
    await isEventIncidentDivisionExist(incident_division_id, event_id);

  return { assigneeUser };
};

export const isEventUserExist = async (user_id: number, event_id: number) => {
  const user = await User.findByPk(user_id, {
    attributes: ['id', 'name', 'cell', 'country_code', 'email'],
    include: [
      {
        model: Department,
        attributes: [],
        required: true,
        include: [
          {
            model: Event,
            attributes: [],
            where: { id: event_id },
            required: true,
          },
        ],
      },
    ],
  });
  if (!user)
    throw new NotFoundException(_MESSAGES.USER_NOT_FOUND_AGAINST_THIS_EVENT);

  return user;
};

export const linkCategories = async (
  category_ids: number[],
  task_id: number,
  user: User,
  needChangeLog: boolean,
  transaction?: Transaction,
) => {
  if (category_ids?.length) {
    // Fetch existing task categories linked to the task
    const existingCategories = await TaskTaskCategory.findAll({
      where: { task_id },
      attributes: ['task_category_id'],
      transaction,
    });

    const existingCategoryIds = existingCategories.map(
      ({ task_category_id }) => task_category_id,
    );

    // Separate new categories that need to be added
    const newCategoryIds = category_ids.filter(
      (id) => !existingCategoryIds.includes(id),
    );

    // Insert only new categories that don't already exist
    if (newCategoryIds.length > 0) {
      const newCategories = newCategoryIds.map((task_category_id) => ({
        task_id,
        task_category_id,
      }));

      await TaskTaskCategory.bulkCreate(newCategories, {
        transaction,
        editor: needChangeLog
          ? { editor_id: user.id, editor_name: user.name }
          : null,
      } as BulkCreateOptions & {
        editor: Editor;
      });
    }

    // Optionally, handle the case where old categories that are no longer needed can be removed
    const categoriesToRemove = existingCategoryIds.filter(
      (id) => !category_ids.includes(id),
    );

    if (categoriesToRemove.length > 0) {
      await TaskTaskCategory.destroy({
        where: {
          task_id,
          task_category_id: categoriesToRemove,
        },
        transaction,
        individualHooks: true,
        editor: needChangeLog
          ? { editor_id: user.id, editor_name: user.name }
          : null,
      } as DestroyOptions & {
        editor: Editor;
      });
    }
  }

  if (category_ids?.length === 0) {
    await TaskTaskCategory.destroy({
      where: {
        task_id,
      },
      transaction,
      individualHooks: true,
      editor: needChangeLog
        ? { editor_id: user.id, editor_name: user.name }
        : null,
    } as DestroyOptions & {
      editor: Editor;
    });
  }
};

export const linkAssignee = async (
  assigneeUser: User,
  task: Task,
  company_id: number,
  listName?: string,
  needChangeLog?: boolean,
  transaction?: Transaction,
  communicationService?: CommunicationService,
  currentUser?: User,
  pusherService?: PusherService,
) => {
  let _task = task.get({ plain: true });

  // if list name, then manually adding list_name in _task object (Create Task Case)
  if (listName) _task = { ..._task, list_name: listName };

  const event = (await isEventExist(task.event_id)).get({ plain: true });
  const parentTask = task.parent_id
    ? await isTaskExist(task.parent_id, task.event_id)
    : null;
  const userTask = await UserTask.findOne({
    where: { task_id: task.id },
  });

  // If user is assigned to this task, then no need to update again
  if (userTask?.user_id === assigneeUser.id) return;

  if (userTask) {
    await UserTask.update({ user_id: assigneeUser.id }, {
      where: { id: userTask.id },
      transaction,
      individualHooks: true,
      editor: needChangeLog
        ? { editor_id: currentUser.id, editor_name: currentUser.name }
        : null,
    } as UpdateOptions & {
      editor: Editor;
    });
  } else {
    await UserTask.create({ user_id: assigneeUser.id, task_id: task.id }, {
      transaction,
      editor: needChangeLog
        ? { editor_id: currentUser.id, editor_name: currentUser.name }
        : null,
    } as CreateOptions & {
      editor: Editor;
    });
  }

  if (!assigneeUser.cell) return;

  try {
    // to sending push notification on mobile and sending SMS to user
    pushNotificationAndSMS(
      assigneeUser,
      _task,
      parentTask?.name || null,
      event,
      communicationService,
      company_id,
      pusherService,
    );
  } catch (err) {
    console.log('🚀 ~ err: Error On Push Notification', err);
  }
};

export const bulkLinkAssignee = async (
  task_ids: number[],
  assigneeUser: User,
  existingTasks: Task[],
  transaction: Transaction,
  communicationService: CommunicationService,
  currentUser: User,
  pusherService: PusherService,
  company_id: number,
) => {
  // Fetch existing user-task associations for the given task_ids
  const existingUserTasks = await UserTask.findAll({
    where: { task_id: { [Op.in]: task_ids } },
    transaction,
  });

  const existingUserTaskIds = existingUserTasks.map(({ task_id }) => task_id);

  // Filter out tasks where the user is already assigned
  const tasksToUpdate = existingUserTasks.filter(
    (userTask) => userTask.user_id !== assigneeUser.id,
  );

  // Update only those tasks where the user_id is different
  if (tasksToUpdate.length) {
    await UserTask.update({ user_id: assigneeUser.id }, {
      where: {
        task_id: { [Op.in]: tasksToUpdate.map(({ task_id }) => task_id) },
      },
      transaction,
      individualHooks: true,
      editor: { editor_id: currentUser.id, editor_name: currentUser.name },
    } as UpdateOptions & { editor: Editor });
  }

  // Create new assignees for tasks not in existingUserTaskIds
  const newBulkTaskAssignees = task_ids
    .filter((task_id) => !existingUserTaskIds.includes(task_id))
    .map((task_id) => ({ user_id: assigneeUser.id, task_id }));

  if (newBulkTaskAssignees.length) {
    await UserTask.bulkCreate(newBulkTaskAssignees, {
      transaction,
      editor: { editor_id: currentUser.id, editor_name: currentUser.name },
    } as BulkCreateOptions & { editor: Editor });
  }

  // Fetching event to send to pushNotificationAndSMS
  const event = await isEventExist(existingTasks[0].event_id);

  // Prepare notification data for tasks
  const parentTaskNames = await Promise.all(
    existingTasks.map(async (task) => {
      if (task.parent_id) {
        const parentTask = await Task.findOne({
          where: { id: task.parent_id },
          attributes: ['name'],
        });

        return parentTask?.name || null;
      }
      return null;
    }),
  );

  // Send notifications and SMS only for tasks that were updated or newly assigned
  const relevantTasks = existingTasks.filter(
    (task) =>
      tasksToUpdate.some((ut) => ut.task_id === task.id) ||
      newBulkTaskAssignees.some((nt) => nt.task_id === task.id),
  );

  await Promise.all(
    relevantTasks.map((task, index) => {
      pushNotificationAndSMS(
        assigneeUser,
        task,
        parentTaskNames[index],
        event,
        communicationService,
        company_id,
        pusherService,
      );
    }),
  );
};

export const updateRecursiveTasks = async (
  updateTaskDto: UpdateMultipleTasksDto,
  existingTasks: Task[],
  transaction: Transaction,
  user: User,
  lastOrder: number,
) => {
  const {
    recursive: { deadlines, start_dates },
  } = updateTaskDto;

  // Map recursive tasks with unique order values
  const bulkUpdateRecursiveTask = existingTasks.flatMap((task) =>
    start_dates.map((start_date, index) => {
      delete task.id;

      return {
        ...task,
        start_date,
        incident_division_id: null,
        deadline: deadlines[index],
        is_recursive: true,
        status: TaskStatus.OPEN,
        created_by: user.id,
        order: ++lastOrder,
      };
    }),
  );

  // Perform bulk creation or updating of tasks
  await Task.bulkCreate(bulkUpdateRecursiveTask, {
    transaction,
    editor: { editor_id: user.id, editor_name: user.name },
  } as BulkCreateOptions & {
    editor: Editor;
  });

  return { message: RESPONSES.updatedSuccessfully('Recursive Tasks') };
};

export const divisionIdsValidation = async (
  tasks: SingleTaskDto[],
  event_id: number,
) => {
  const divisionIds = tasks
    .map((task) => task.incident_division_id)
    .filter((id) => !!id);

  if (divisionIds.length) {
    const uniqueDivisionIds = [...new Set(divisionIds)];

    const incidentDivisions = await EventIncidentDivision.count({
      where: {
        event_id,
        incident_division_id: { [Op.in]: uniqueDivisionIds },
      },
    });

    if (uniqueDivisionIds.length !== incidentDivisions)
      throw new BadRequestException(
        _ERRORS.SOME_OF_DIVISION_IDS_ARE_NOT_FOUND_AGAINST_THIS_EVENT,
      );
  }
};

/**
 * It clones tasks or lists from an event to current event.
 * @param cloneListOrTaskDto
 * @param currentEventId
 * @param sequelize
 */
export const cloneTasksDataValidation = async (
  cloneListOrTaskDto: CloneListOrTaskDto,
  currentEventId: number,
  user: User,
  eventTimezone: string,
  transaction: Transaction,
) => {
  const {
    standalone_tasks: standaloneTasks,
    listed_tasks: listedTasks,
    cloning_event_id: event_id,
  } = cloneListOrTaskDto;

  const tasksToBeCreated = [];

  if (listedTasks.length) {
    const sortedListedTasks = sortTasksById(listedTasks) as ListedTasksDto[];

    await validationOfUsersDepartmentsDivisions(listedTasks, currentEventId);

    const oldListedTasks = await Task.findAll({
      where: {
        event_id,
        [Op.or]: listedTasks.map(({ id, task_list_id }) => ({
          id,
          task_list_id,
        })),
      },
      attributes: [
        ...commonFindAttributes,
        'task_list_id',
        [Sequelize.literal(`"task_list"."name"`), 'list_name'],
      ],
      include: [
        ...commonIncludes,
        {
          model: TaskList,
          attributes: [],
        },
      ],
      order: [['id', SortBy.ASC]],
    });

    if (oldListedTasks.length !== listedTasks.length)
      throw new BadRequestException(
        _ERRORS.SOME_LISTED_TASKS_NOT_FOUND_AGAINST_CLONING_EVENT_OR_LIST,
      );

    const uniqueTaskListsProvided = [
      ...new Set(
        oldListedTasks.map((task) =>
          JSON.stringify({
            id: task.task_list_id,
            name: task.getDataValue('list_name'),
          }),
        ),
      ),
    ].map((taskList) => JSON.parse(taskList));

    const afterClonedNames = await checkAndCloneNames(
      uniqueTaskListsProvided,
      currentEventId,
      CloneORCopy.CLONE,
    );

    const _lastTaskListOrder = await lastTaskListOrder(currentEventId, user.id);

    const createdTaskLists = await TaskList.bulkCreate(
      afterClonedNames.map((taskList, index) => {
        const taskListData = {
          name: taskList.name,
          event_id: currentEventId,
          created_by: user.id,
        };

        // Conditionally include task_list_orders
        if (_lastTaskListOrder >= 0) {
          taskListData['task_list_orders'] = [
            {
              user_id: user.id,
              event_id: currentEventId,
              order: _lastTaskListOrder + (index + 1),
            },
          ];
        }

        return taskListData;
      }),
      {
        include: [{ association: 'task_list_orders' }],
        transaction,
      },
    );

    // This loop is for duplicating stand alone tasks and pushed the cloned objects in a correct format in an array.
    for (const [index, task] of sortedListedTasks.entries()) {
      const newTask = await formatTaskAndGetAssociations(
        task,
        oldListedTasks[index],
        currentEventId,
        index,
        user.id,
        eventTimezone,
        afterClonedNames,
        createdTaskLists,
      );

      // pushing to tasksToBeCreated array with is used for bulk create at the end.
      tasksToBeCreated.push(newTask);
    }
  }

  if (standaloneTasks) {
    const sortedStandaloneTask = sortTasksById(standaloneTasks) as TasksDto[];

    await validationOfUsersDepartmentsDivisions(
      standaloneTasks,
      currentEventId,
    );

    const oldStandaloneTasks = await Task.findAll({
      where: {
        event_id,
        id: { [Op.in]: standaloneTasks.map((task) => task.id) },
      },
      attributes: commonFindAttributes,
      include: [...commonIncludes],
      order: [['id', SortBy.ASC]],
    });

    if (oldStandaloneTasks.length !== standaloneTasks.length)
      throw new BadRequestException(
        _ERRORS.SOME_STANDALONE_TASKS_NOT_FOUND_AGAINST_CLONING_EVENT,
      );

    // This loop is for duplicating stand alone tasks and pushed the cloned objects in a correct format in an array.
    for (const [index, task] of sortedStandaloneTask.entries()) {
      const newTask = await formatTaskAndGetAssociations(
        task,
        oldStandaloneTasks[index],
        currentEventId,
        index,
        user.id,
        eventTimezone,
      );

      // pushing to tasksToBeCreated array with is used for bulk create at the end.
      tasksToBeCreated.push(newTask);
    }
  }

  if (tasksToBeCreated.length) {
    await Task.bulkCreate(tasksToBeCreated, {
      include: [
        { association: 'images' },
        { association: 'subtasks', include: [{ association: 'images' }] },
        { association: 'task_task_categories' },
        { association: 'user_tasks' },
      ],
      transaction,
      editor: { editor_id: user.id, editor_name: user.name },
    } as BulkCreateOptions & {
      editor: Editor;
    });
  }
};

export const checkAndCloneNames = async (
  uniqueTaskListsProvided: TaskListIdName[],
  event_id: number,
  cloneOrCopy: string,
): Promise<TaskListIdName[]> => {
  const clonedNames = [];

  const existingNames = await TaskList.findAll({
    where: {
      event_id,
    },
    attributes: ['name'],
  });

  if (!existingNames.length) return uniqueTaskListsProvided;

  for (const taskList of uniqueTaskListsProvided) {
    let newName = taskList.name;

    while (true) {
      const existingName = existingNames.find(
        (_taskList) => _taskList.name.toLowerCase() === newName.toLowerCase(),
      );

      if (existingName) {
        newName = `${cloneOrCopy} - ${newName}`;
      } else {
        clonedNames.push({ id: taskList.id, name: newName });
        break;
      }
    }
  }

  for (const clonedName of clonedNames) {
    const index = uniqueTaskListsProvided.findIndex(
      (taskList) => taskList.id === clonedName.id,
    );
    if (index !== -1) {
      uniqueTaskListsProvided[index].name = clonedName.name;
    }
  }

  return uniqueTaskListsProvided;
};

export const createRecursiveTasks = async (
  createTaskDto: CreateTaskDto,
  transaction: Transaction,
  user: User,
  lastOrder: number,
) => {
  const bulkCreateRecursiveTask = [];

  const {
    recursive: { deadlines, start_dates },
    user_id,
    category_ids,
  } = createTaskDto;

  for (let i = 0; i < start_dates.length; i++) {
    const start_date = start_dates[i];
    const deadline = deadlines[i];

    bulkCreateRecursiveTask.push({
      ...createTaskDto,
      created_by: user.id,
      order: lastOrder + (i + 1),
      start_date,
      deadline,
    });
  }

  // creating bulk task
  const recursiveTasks = await Task.bulkCreate(bulkCreateRecursiveTask, {
    transaction,
    editor: { editor_id: user.id, editor_name: user.name },
  } as BulkCreateOptions & {
    editor: Editor;
  });

  // fetching created bulk task ids for further use i.e for link assignee, link categories
  const recursiveTaskIds = recursiveTasks
    .map((task) => task.get({ plain: true }))
    .map(({ id }) => id);

  // link assignee to multiple created recursive task
  if (user_id) {
    const taskAssignee = recursiveTaskIds.map((id) => ({
      user_id,
      task_id: id,
    }));

    await UserTask.bulkCreate(taskAssignee, {
      transaction,
    });
  }

  if (category_ids?.length) {
    // if all task category exist then saving task_id and task_category_id in TaskTaskCategory Table
    const bulkTaskCategories = recursiveTaskIds.flatMap((taskId) =>
      category_ids.map((taskCategoryId) => ({
        task_id: taskId,
        task_category_id: taskCategoryId,
      })),
    );

    await TaskTaskCategory.bulkCreate(bulkTaskCategories, {
      transaction,
    });
  }

  return { message: RESPONSES.createdSuccessfully('Recursive Tasks') };
};

export const sendRealTimeData = async (
  task: Task,
  eventId: number,
  pusherService: PusherService,
  user: User,
  eventTimeZone: string,
) => {
  // getting count of tasks according to their status and priority
  const taskCounts = await taskStatusCount(
    eventId,
    eventTimeZone,
    null,
    null,
    user,
  );

  pusherService.sendUpdatedTask(task);
  pusherService.sendUpdatedTaskCount(taskCounts, eventId);
};

const sortTasksById = (tasks: TasksDto[] | ListedTasksDto[]) => {
  return tasks.sort((task1, task2) => (task1.id >= task2.id ? 1 : -1));
};

const formatTaskAndGetAssociations = async (
  task: TasksDto | ListedTasksDto,
  oldTask: Task,
  currentEventId: number,
  index: number,
  userId: number,
  eventTimezone: string,
  afterClonedNames?: TaskListIdName[],
  createdTaskLists?: TaskList[],
) => {
  const {
    name,
    description,
    priority,
    subtasks,
    images,
    task_task_categories,
  } = oldTask;

  const {
    status,
    start_date,
    deadline,
    user_id,
    department_id,
    incident_division_id,
    completed_at,
  } = task;

  let taskListId = null;

  if ((task as ListedTasksDto).task_list_id) {
    const indexOfClonedListName = afterClonedNames.findIndex(
      ({ id }) => (task as ListedTasksDto).task_list_id === id,
    );

    if (indexOfClonedListName !== -1) {
      taskListId = createdTaskLists[indexOfClonedListName].id;
    }
  }

  // getting last order of this event and this task list
  const lastOrder = await lastTaskOrder(currentEventId, taskListId);

  const newTask = {
    start_date,
    deadline,
    name,
    description,
    priority,
    status,
    incident_division_id,
    task_task_categories,
    completed_at,
    event_id: currentEventId,
    task_list_id: taskListId,
    order: lastOrder + index + 1,
    created_by: userId,
  };

  // if the status changes to 'completed' within deadline, saving completed_past_due true else false
  if (status === TaskStatus.COMPLETED) {
    // Set completed_past_due based on deadline and current timestamp
    newTask['completed_past_due'] = deadline < currentTimestamp(eventTimezone);

    newTask['completed_past_due_duration'] = momentTimezone
      .tz(eventTimezone)
      .diff(momentTimezone(deadline))
      .toString();

    newTask['completed_at'] = momentTimezone().tz(eventTimezone).toISOString();
  }

  if (user_id) {
    newTask['department'] = null;
    newTask['user_tasks'] = { user_id };
  } else if (department_id) {
    newTask['department_id'] = department_id;
  }

  if (task.isAttachmentsClone && task.isSubtasksClone) {
    // when both options selected
    newTask['subtasks'] = subtasks
      .map((subtask) => subtask.get({ plain: true }))
      .map((_subtask) => ({
        ..._subtask,
        status: 'Open',
        event_id: currentEventId,
      }));

    newTask['images'] = images;
  } else if (task.isAttachmentsClone && images.length) {
    // when only attachment selected
    newTask['images'] = images;
  } else if (task.isSubtasksClone && subtasks.length) {
    // If only subtask selected but not attachments so removing attachments of subtask
    const subtasksWithoutAttachments = subtasks
      .map((subtask) => subtask.get({ plain: true }))
      .map(({ name, description, deadline }) => ({
        name,
        description,
        deadline,
        status: 'Open',
        event_id: currentEventId,
      }));

    newTask['subtasks'] = subtasksWithoutAttachments;
  }

  return newTask;
};

export const isUserListExist = async (userIds: number[], event_id: number) => {
  if (userIds.length) {
    const uniqueUserIds = [...new Set(userIds)];

    const eventUser = await User.findAll({
      where: { id: { [Op.in]: uniqueUserIds } },
      include: [
        {
          model: Department,
          attributes: [],
          required: true,
          include: [
            {
              model: Event,
              attributes: [],
              where: { id: event_id },
              required: true,
            },
          ],
        },
      ],
    });

    if (eventUser.length !== uniqueUserIds.length)
      throw new NotFoundException(
        _ERRORS.SOME_OF_THE_USERS_NOT_FOUND_AGAINST_THIS_EVENT,
      );
  }
};

export const isEventDepartmentListExist = async (
  departmentIds: number[],
  event_id: number,
) => {
  if (departmentIds.length) {
    const uniqueDepartmentIds = [...new Set(departmentIds)];

    const eventDepartment = await EventDepartment.findAll({
      where: { department_id: { [Op.in]: uniqueDepartmentIds }, event_id },
      attributes: ['id'],
    });
    if (eventDepartment.length !== uniqueDepartmentIds.length)
      throw new NotFoundException(
        _ERRORS.SOME_OF_THE_DEPARTMENTS_NOT_FOUND_AGAINST_THIS_EVENT,
      );
  }
};

export const isEventDivisionListExist = async (
  incidentDivisionIds: number[],
  event_id: number,
) => {
  if (incidentDivisionIds.length) {
    const uniqueDivisionIds = [...new Set(incidentDivisionIds)];

    const eventDivisions = await EventIncidentDivision.findAll({
      where: {
        incident_division_id: { [Op.in]: uniqueDivisionIds },
        event_id,
      },
      attributes: ['id'],
    });
    if (eventDivisions.length !== uniqueDivisionIds.length)
      throw new NotFoundException(
        _ERRORS.SOME_OF_THE_INCIDENT_DIVISIONS_NOT_FOUND_AGAINST_THIS_EVENT,
      );
  }
};

export const validationOfUsersDepartmentsDivisions = async (
  tasks: TasksDto[],
  currentEventId: number,
) => {
  // check if all user provided in any of the tasks are exist and belongs to current event or not
  await isUserListExist(
    tasks.filter((task) => !!task.user_id).map((task) => task.user_id),
    currentEventId,
  );

  // check if all departments provided in any of the tasks are exist and belongs to current event or not
  await isEventDepartmentListExist(
    tasks
      .filter((task) => !!task.department_id)
      .map((task) => task.department_id),
    currentEventId,
  );

  // check if all divisions provided in any of the tasks are exist and belongs to current event or not
  await isEventDivisionListExist(
    tasks
      .filter((task) => !!task.incident_division_id)
      .map((task) => task.incident_division_id),
    currentEventId,
  );
};

export const isMultipleTaskExist = async (
  task_ids: number[],
  event_id: number,
) => {
  const tasks = await Task.findAll({
    where: { id: { [Op.in]: task_ids }, event_id },
    attributes: {
      include: [[Sequelize.literal('"task_list"."name"'), 'list_name']],
    },
    include: [
      {
        model: TaskList,
        attributes: [],
      },
    ],
    raw: true,
  });

  if (tasks.length !== task_ids.length)
    throw new NotFoundException(
      _ERRORS.SOME_OF_TASK_ARE_NOT_FOUND_AGAINST_THIS_EVENT,
    );

  return tasks;
};

export const getEventNameSearch = async (
  keyword: string,
  company_id: number,
) => {
  const _where = {};

  if (keyword) {
    _where['name'] = {
      [Op.iLike]: `%${keyword.toLowerCase()}%`,
    };
  }

  _where['task_future'] = true;

  _where['company_id'] = company_id;

  return _where;
};

export const checkPermissions = async (companyId: number, user: User) => {
  if (
    user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
    user['role'] !== RolesNumberEnum.ONTRACK_MANAGER &&
    user['role'] !== RolesNumberEnum.GLOBAL_ADMIN &&
    user['role'] !== RolesNumberEnum.GLOBAL_MANAGER &&
    user['role'] !== RolesNumberEnum.REGIONAL_MANAGER &&
    user['role'] !== RolesNumberEnum.REGIONAL_ADMIN &&
    companyId !== user['company_id']
  )
    throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

  // fetching all subcompanies by company_id in other user's case but for global admin, taking its own company id
  const company_id =
    user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
    user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_ADMIN
      ? user['company_id']
      : companyId;

  // We need to find subcompanies only for global or super admin. As other users can have only access to their own company.
  let subCompanies = [];
  if (
    (user['role'] === RolesNumberEnum.SUPER_ADMIN ||
      user['role'] === RolesNumberEnum.ONTRACK_MANAGER ||
      user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
      user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
    company_id
  )
    subCompanies = await findAllSubcompaniesByCompanyId(company_id);

  // If companyId provided in params is one of the subcompanies Id
  const isCompanyOneOfSubcompany: boolean =
    subCompanies.map(({ id }) => id).indexOf(companyId) !== -1 || false;

  // Exception if provided company id in params not belongs to neither global admin's company nor its subcompanies
  if (
    (user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
      user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
    companyId !== user['company_id']
  ) {
    if (!isCompanyOneOfSubcompany) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }
  }
};

const findAllSubcompaniesByCompanyId = async (company_id: number) => {
  const company = await Company.findByPk(company_id);
  if (!company) throw new NotFoundException(ERRORS.COMPANY_NOT_FOUND);

  return await Company.findAll({
    where: { parent_id: company_id },
    attributes: ['id', 'name'],
    order: [['name', SortBy.ASC]],
  });
};

export const lastTaskOrder = async (event_id: number, task_list_id: number) => {
  const lastOrder = await Task.findOne({
    attributes: ['id', 'order'],
    where: {
      event_id,
      task_list_id: task_list_id ? task_list_id : null,
      parent_id: null,
    },
    order: [['order', SortBy.DESC]],
  });

  return lastOrder?.order ?? -1;
};

export const removeSubTasksAssignee = async (
  parentTaskId: number,
  transaction: Transaction,
) => {
  const subtaskIds = (
    await Task.findAll({
      where: { parent_id: parentTaskId },
      attributes: ['id'],
    })
  ).map(({ id }) => id);

  if (!subtaskIds?.length) return;

  // removing department association
  await Task.update(
    { department_id: null },
    {
      where: {
        id: { [Op.in]: subtaskIds },
      },
      transaction,
    },
  );

  // removing user assignee association
  await UserTask.destroy({
    where: {
      task_id: { [Op.in]: subtaskIds },
    },
    transaction,
  });
};

export const updateTaskOrder = async (
  event_id: number,
  task_list_id: number,
  newOrder: number,
  currentOrder: number,
  transaction?: Transaction,
) => {
  // If the new order is greater than the current order, we need to shift down the next task lists.
  if (newOrder > currentOrder) {
    const tasksToShiftDown = await Task.findAll({
      where: {
        event_id,
        task_list_id: task_list_id ? task_list_id : null,
        order: {
          [Op.gt]: currentOrder,
          [Op.lte]: newOrder, // Include newOrder
        },
      },
    });

    for (const task of tasksToShiftDown) {
      await task.update({ order: task.order - 1 }, { transaction });
    }
  }
  // If the new order is less than the current order, we need to shift up the previous task lists.
  else if (newOrder < currentOrder) {
    const taskToShiftUp = await Task.findAll({
      where: {
        event_id,
        task_list_id: task_list_id ? task_list_id : null,
        order: {
          [Op.gte]: newOrder, // Include newOrder
          [Op.lt]: currentOrder,
        },
      },
    });

    for (const task of taskToShiftUp) {
      await task.update({ order: task.order + 1 }, { transaction });
    }
  }
};

export const reorderTask = async (
  event_id: number,
  task_list_id: number,
  deletedOrder: number,
  transaction?: Transaction,
) => {
  // Now, we need to shift up the order of task lists that were below the deleted task list.
  const taskToShiftUp = await Task.findAll({
    attributes: ['id', 'order'],
    where: {
      event_id,
      task_list_id: task_list_id ? task_list_id : null,
      order: {
        [Op.gt]: deletedOrder,
      },
    },
  });

  for (const task of taskToShiftUp) {
    await task.update({ order: task.order - 1 }, { transaction });
  }
};

export const getLastPinnedOrder = async (
  event_id: number,
  task_list_id: number,
) => {
  const task = await Task.findOne({
    where: {
      event_id,
      task_list_id: task_list_id ? task_list_id : null,
      is_pinned: true,
      parent_id: null,
    },
    attributes: ['id', 'order'],
    order: [['order', SortBy.DESC]],
  });

  return task ? task.order : -1;
};

export const shiftUpRemainingTasks = async (
  event_id: number,
  task_list_id: number,
  order: number,
  transaction: Transaction,
) => {
  // updating the order of task which order is greater than lowest order task
  const tasks = await Task.findAll({
    attributes: ['id', 'order'],
    where: {
      event_id,
      task_list_id,
      order: { [Op.gt]: order },
    },
    order: [['order', SortBy.ASC]],
  });

  for (let i = 0; i < tasks.length; i++) {
    tasks[i].order = order + i;

    await tasks[i].save({ transaction });
  }
};

export const EventUserModel = (user_id: number) => {
  return {
    model: EventUser,
    attributes: [],
    where: { user_id },
    required: true,
  };
};

// using in clone
const commonIncludes: any = [
  {
    model: TaskTaskCategory,
    attributes: ['task_category_id'],
  },
  {
    model: Task,
    as: 'subtasks',
    attributes: [
      'name',
      'description',
      'deadline',
      'status',
      'event_id',
      'department_id',
    ],
    include: [
      imageIncludeForCloning([
        Sequelize.literal(`"subtasks->users->images->created_by"."name"`),
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
            Sequelize.literal(`"subtasks->users->images->created_by"."name"`),
            'createdBy',
          ]),
        ],
      },
    ],
  },
  imageIncludeForCloning([
    Sequelize.literal(`"images->created_by"."name"`),
    'createdBy',
  ]),
];

// using in clone
const commonFindAttributes = ['id', 'name', 'description', 'priority', 'order'];

export const getTaskByIdQuery = async (
  id: number,
  event_id: number,
  eventTimeZone: string,
  options?: Options,
) => {
  return await Task.findOne({
    where: { id, event_id },
    attributes: {
      include: [
        [
          Sequelize.literal(`
            (
              SELECT COUNT(*)::INTEGER FROM "tasks"
              WHERE  "tasks"."event_id" = ${event_id} AND "tasks"."parent_id" IS NULL
              AND (
                "tasks"."task_list_id" = "Task"."task_list_id"
                OR ("tasks"."task_list_id" IS NULL AND "Task"."task_list_id" IS NULL)
              )
            )
          `),
          'total_task_count',
        ],
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
              WHERE "Image"."imageable_id" = "Task"."id" AND "Image"."imageable_type" = 'Task'
            )
          `),
          'attachmentCount',
        ],
        [Sequelize.literal('"event->departments"."name"'), 'department_name'],
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
        [
          Sequelize.literal(`
            (
              SELECT name FROM "tasks"
              WHERE "tasks"."id" = "Task"."parent_id"
            )
          `),
          'parent_task_name',
        ],
        isPastDue('Task', eventTimeZone),
        subtasksAssignees('Task'),
        isListDateLocked,
        isListDivisionLocked,
      ],
      exclude: ['updatedAt'],
    },
    include: [
      {
        model: User,
        as: 'creator',
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
        attributes: [
          'name',
          'start_date',
          'end_date',
          'event_location',
          'company_id',
        ],
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
      {
        model: Task,
        as: 'subtasks',
        attributes: {
          exclude: excludeAttributes,
          include: [taskDepartmentName('')],
        },
        include: [
          imageInclude([
            Sequelize.literal(`"images->created_by"."name"`),
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
                Sequelize.literal(`"users->images->created_by"."name"`),
                'createdBy',
              ]),
            ],
          },
          taskDeparmentInclude(event_id, 'Task'),
        ],
        order: [
          [
            Sequelize.literal(
              `CASE WHEN "Task"."status" = 'Completed' THEN 1 ELSE 0 END`,
            ),
            SortBy.DESC,
          ],
          ['completed_at', SortBy.ASC],
          ['deadline', SortBy.ASC],
        ],
        separate: true,
      },
      {
        model: TaskList,
        attributes: ['created_by'],
      },
      imageInclude([
        Sequelize.literal(`"images->created_by"."name"`),
        'createdBy',
      ]),
    ],
    order: [
      [{ model: TaskCategory, as: 'task_categories' }, 'name', 'ASC'],
      [{ model: Image, as: 'images' }, 'createdAt', 'DESC'],
    ],
    ...options,
  });
};

export const generatePdfForTask = async (
  task: Task,
  file_name: string,
  req: Request,
  res: Response,
  httpService: HttpService,
  eventTimeZone?: string,
) => {
  const formattedTaskDataForPdf = getFormattedTaskDataForPdf(
    task,
    eventTimeZone,
  );

  // Api call to lambda for getting pdf
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedTaskDataForPdf,
    CsvOrPdf.PDF,
    _PDFTypes.TASK_DETAIL_REPORT,
    file_name,
  );

  return res.send(response.data);
};

const getFormattedTaskDataForPdf = (_task: Task, eventTimeZone?: string) => {
  const task = _task.get({ plain: true });

  const getSubTaskFormated = (subtasks: Task[]) => {
    return subtasks.map((subtask: Task) => {
      return {
        name: subtask.name,
        due_date_and_time: getDateFormated(subtask.deadline, true, true),
        subtask_attachment_counts: subtask?.images?.length || 0,
      };
    });
  };

  const getImagesFormated = (images) => {
    return images.map((image) => {
      const fileType = image.url.split('.').pop().split('?')[0]; // To handle URLs with query parameters
      return {
        url: image.url,
        type: fileType,
        name: image.name,
      };
    });
  };

  const getCategoriesFormated = (categories) => {
    return categories.map((category) => {
      return {
        category: category.name,
      };
    });
  };

  const getDateFormated = (
    date: string,
    reffer: boolean = false,
    timezone: boolean = false,
  ) => {
    let format = 'MM/DD/YY';
    if (reffer) format = 'MM/DD/YY - hh:mm A';

    if (timezone) return momentTimezone(date).tz(eventTimeZone).format(format);

    return moment(date).format(format);
  };

  return {
    header: {
      datetime: getDateFormated(task.deadline, true, true),
    },
    event_name: task.event.name || 'N/A',
    event_date:
      getDateFormated(task.event.start_date) +
      ' - ' +
      getDateFormated(task.event.end_date),
    event_location: task.event.event_location || 'N/A',
    task_name: task.name || 'N/A',
    task_description: task.description,
    assigned_to:
      (task.users.length ? task.users[0].name : task['department_name']) ||
      'N/A',
    division: task['incident_division_name'] || 'N/A',
    categories: task.task_categories.length
      ? getCategoriesFormated(task.task_categories)
      : [{ category: 'N/A' }],
    start_date: task.start_date
      ? getDateFormated(task.start_date, true, true)
      : 'N/A',
    due_date: getDateFormated(task.deadline, true, true),
    status: task.status || 'N/A',
    task_notes: '',
    task_attachments: getImagesFormated(task.images),
    sub_tasks: getSubTaskFormated(task.subtasks),
    timezone: eventTimeZone,
  };
};
