import { NotFoundException } from '@nestjs/common';
import { NotificationService } from 'src/modules/notifications/notifications.service';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';

import { Task } from '../../../database/models/tasks.model';
import { UserTask } from 'src/database/models/user-task.model';
import { User } from 'src/database/models/users.model';

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
  userModel: typeof User,
  notificationService: NotificationService,
  notificationsGateway: NotificationsGateway,
) => {
  const existingUserTasks = await UserTask.findAll({
    where: {
      taskId: task.id,
    },
  });
  const existingUserIds = existingUserTasks.map((ut) => ut.userId);

  const users = await findUsersByIds(userModel, userIds);

  const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));
  await UserTask.destroy({
    where: {
      taskId: task.id,
    },
  });

  for (const user of users) {
    await UserTask.create({ userId: user.id, taskId: task.id });
    if (newUserIds.includes(user.id)) {
      const notification = await notificationService.createNotification({
        message: `You have been assigned a new task: ${task.name}`,
        userId: user.id,
      });
      notificationsGateway.sendNotification(user.id, notification.message);
    }
  }
};
