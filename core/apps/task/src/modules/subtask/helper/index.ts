import {
  DestroyOptions,
  Sequelize,
  Transaction,
  UpdateOptions,
} from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import {
  CommunicationService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  Task,
  TaskList,
  User,
  UserTask,
} from '@ontrack-tech-group/common/models';
import {
  Editor,
  RESPONSES,
  SocketTypesStatus,
} from '@ontrack-tech-group/common/constants';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { UpdateTaskAssigneeDto } from '@Modules/task/dto';
import { sendTaskUpdate } from '@Common/helpers/sockets';
import {
  getTaskByIdQuery,
  isEventDepartmentExist,
  isEventUserExist,
  linkAssignee,
} from '@Modules/task/helpers';
import { isPastDue } from '@Common/helpers';

/**
 * Send updated task to pusher
 */
export const sendRealTimeData = async (
  taskId: number,
  pusherService: PusherService,
  eventId: number,
  eventTimezone: string,
) => {
  const task = await getTaskByIdQuery(taskId, eventId, eventTimezone);

  pusherService.sendUpdatedTask(task);
};

export const getSubtaskByIdHelper = async (
  id: number,
  parent_id: number,
  eventTimezone: string,
) => {
  const subtask = await Task.findOne({
    where: { id, parent_id },
    attributes: [
      'id',
      'status',
      'name',
      'description',
      'deadline',
      'start_date',
      'event_id',
      'parent_id',
      isPastDue('Task', eventTimezone),
      [Sequelize.col('task_list.is_date_locked'), 'is_date_locked'],
    ],
    include: [
      {
        model: TaskList,
        attributes: [],
      },
    ],
  });
  if (!subtask) throw new NotFoundException(RESPONSES.notFound('Subtask'));

  return subtask;
};

export const isSubtaskExist = async (id: number, parent_id: number) => {
  const subtask = await Task.findOne({
    where: { id, parent_id },
    attributes: ['id', 'event_id', 'name'],
  });
  if (!subtask) throw new NotFoundException(RESPONSES.notFound('Subtask'));

  return subtask;
};

// common excluded attributes
export const excludeAttributes = [
  'incident_division_id',
  'task_list_id',
  'is_recursive',
];

export const createdSubtaskAssignee = async (
  id: number,
  updateTaskAssigneeDto: UpdateTaskAssigneeDto,
  subtask: Task,
  pusher: PusherService,
  communicationService?: CommunicationService,
  user?: User,
  transaction?: Transaction,
) => {
  const { event_id, user_id, department_id } = updateTaskAssigneeDto;
  const [company_id] = await withCompanyScope(user, event_id);
  let assigneeUser: User;

  if (user_id) {
    // checking, is user exist or not
    assigneeUser = await isEventUserExist(user_id, event_id);

    // If a task is already assigned to department then need to update the department value as null
    if (subtask.department_id) {
      await Task.update({ department_id: null }, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });
    }

    // linked a user to this task
    await linkAssignee(
      assigneeUser,
      subtask,
      company_id,
      null,
      true,
      transaction,
      communicationService,
      user,
      pusher,
    );
  } else if (department_id) {
    // checking, is department exist or not
    await isEventDepartmentExist(department_id, event_id);

    // updating department_id
    await Task.update({ department_id }, {
      where: { id },
      transaction,
      individualHooks: true,
      editor: { editor_id: user.id, editor_name: user.name },
    } as UpdateOptions & {
      editor: Editor;
    });

    // destroy existed user task record
    await UserTask.destroy({
      where: { task_id: id },
      transaction,
      individualHooks: true,
      editor: { editor_id: user.id, editor_name: user.name },
    } as DestroyOptions & {
      editor: Editor;
    });
  }

  return;
};

export const handleTaskUpdate = async (
  taskId: number,
  eventId: number,
  timeZone: string,
  isNew: boolean,
  socketType: SocketTypesStatus,
  pusherService: PusherService,
) => {
  // Fetch task data
  const subtask = await getTaskByIdQuery(taskId, eventId, timeZone, {
    useMaster: true,
  });

  // Send the task update through the helper function
  sendTaskUpdate(subtask, isNew, socketType, pusherService);

  if (subtask) {
    const task = await getTaskByIdQuery(subtask.parent_id, eventId, timeZone, {
      useMaster: true,
    });

    sendTaskUpdate(task, false, SocketTypesStatus.UPDATE, pusherService);
  }
};
