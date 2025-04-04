import { NotFoundException } from '@nestjs/common';
import { NotificationService } from 'src/modules/notifications/notifications.service';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';

import { Task } from '../../../database/models/tasks.model';
import { UserTask } from 'src/database/models/user-task.model';
import { User } from 'src/database/models/users.model';
import { TaskStatus } from '../enums/task-status.enum';
import { Queue } from 'bull';

export const findUsersByIds = async (
  userModel: typeof User,
  userIds: number[],
): Promise<User[]> => {
  const users = await userModel.findAll({
    where: {
      id: userIds,
    },
  });

  if (users.length !== userIds.length) {
    throw new NotFoundException('One or more users not found');
  }

  return users;
};

export const findTaskWithDetails = async (
  taskModel: typeof Task,
  taskId: number,
): Promise<Task> => {
  const task = await taskModel.findByPk(taskId, {
    include: [
      {
        model: User,
        attributes: ['id', 'username'],
        through: { attributes: [] },
      },
      { model: Task, as: 'SubTasks', attributes: ['id', 'name', 'status'] },
    ],
  });

  if (!task) {
    throw new NotFoundException('Task not found');
  }

  return task;
};

export const updateTaskAssignees = async (
  task: Task,
  userIds: number[],
  notificationService: NotificationService,
  notificationsGateway: NotificationsGateway,
) => {
  await UserTask.destroy({ where: { taskId: task.id } });

  const bulkUserTasks = userIds.map((userId) => {
    return { userId, taskId: task.id };
  });

  await UserTask.bulkCreate(bulkUserTasks);

  for (const userId of userIds) {
    const notification = await notificationService.createNotification({
      userId,
      message: `You have been assigned a new task: ${task.name}`,
    });

    notificationsGateway.sendNotification(userId, notification.message);
  }
};

export const scheduleStatusUpdates = async (
  taskId: number,
  startDate: Date,
  endDate: Date,
  taskStatusQueue: Queue,
  updateTaskStatus: (taskId: number, status: TaskStatus) => Promise<void>,
) => {
  const now = new Date().getTime();
  const startDateTime = new Date(startDate).getTime();
  const endDateTime = new Date(endDate).getTime();
  const delayToInProgress = startDateTime - now;
  const delayToCompleted = endDateTime - now;

  if (delayToInProgress > 0) {
    await taskStatusQueue.add(
      'update-task-status',
      { taskId, status: TaskStatus.InProgress },
      { delay: delayToInProgress },
    );
  } else {
    console.warn(
      `Task ${taskId} start time is in the past, immediately setting to InProgress`,
    );
    await updateTaskStatus(taskId, TaskStatus.InProgress);
  }

  if (delayToCompleted > 0) {
    await taskStatusQueue.add(
      'update-task-status',
      { taskId, status: TaskStatus.Completed },
      { delay: delayToCompleted },
    );
  } else {
    console.warn(
      `Task ${taskId} end time is in the past, immediately setting to Completed`,
    );
    await updateTaskStatus(taskId, TaskStatus.Completed);
  }
};
