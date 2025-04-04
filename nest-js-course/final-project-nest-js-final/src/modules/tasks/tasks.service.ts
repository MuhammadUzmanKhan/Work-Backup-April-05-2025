import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TaskStatus } from './enums/task-status.enum';
import { Op } from 'sequelize';
import { Task } from '../../database/models/tasks.model';
import { CreateTaskValidationDto } from './dto/create-task.dto';
import { NotificationService } from 'src/modules/notifications/notifications.service';

import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  findUsersByIds,
  findTaskWithDetails,
  updateTaskAssignees,
} from './helpers';
import { UserTask } from '../../database/models/user-task.model';
import { FindAllTaskDto } from './dto/find-all-task.dto';
import { User } from 'src/database/models/users.model';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task) private readonly taskModel: typeof Task,
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly notificationService: NotificationService,
    private readonly notificationsGateway: NotificationsGateway,
    @InjectQueue('task-status') private taskStatusQueue: Queue,
  ) {}

  async createTask(createTaskDto: CreateTaskValidationDto): Promise<Task> {
    const {
      name,
      description,
      status,
      userIds,
      parentTaskId,
      startDate,
      endDate,
    } = createTaskDto;
    const taskStatus = status || TaskStatus.InProgress;

    const users = await findUsersByIds(this.userModel, userIds);

    const task = await this.taskModel.create({
      name,
      description,
      status: taskStatus,
      parentTaskId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    for (const user of users) {
      await UserTask.create({ userId: user.id, taskId: task.id });
      const notification = await this.notificationService.createNotification({
        message: `You have been assigned a new task: ${name}`,
        userId: user.id,
      });
      this.notificationsGateway.sendNotification(user.id, notification.message);
    }

    // Schedule status updates based on startDate
    await this.scheduleStatusUpdates(
      task.id,
      new Date(startDate),
      new Date(endDate),
    );

    return await findTaskWithDetails(this.taskModel, task.id);
  }

  async scheduleStatusUpdates(
    taskId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    const now = new Date().getTime();
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();
    const delayToInProgress = startDateTime - now;
    const delayToCompleted = endDateTime - now;

    if (delayToInProgress > 0) {
      await this.taskStatusQueue.add(
        'update-task-status',
        { taskId, status: TaskStatus.InProgress },
        { delay: delayToInProgress },
      );
    } else {
      console.warn(
        `Task ${taskId} start time is in the past, immediately setting to InProgress`,
      );
      await this.updateTaskStatus(taskId, TaskStatus.InProgress);
    }

    if (delayToCompleted > 0) {
      await this.taskStatusQueue.add(
        'update-task-status',
        { taskId, status: TaskStatus.Completed },
        { delay: delayToCompleted },
      );
    } else {
      console.warn(
        `Task ${taskId} end time is in the past, immediately setting to Completed`,
      );
      await this.updateTaskStatus(taskId, TaskStatus.Completed);
    }
  }

  async updateTaskStatus(taskId: number, status: TaskStatus): Promise<void> {
    try {
      const task = await this.taskModel.findByPk(taskId, {
        include: [
          {
            model: User,
            attributes: ['id', 'username'],
            through: { attributes: [] },
            as: 'assignees',
          },
        ],
      });

      if (task) {
        task.status = status;
        await task.save();

        if (status === TaskStatus.Completed) {
          if (Array.isArray(task.assignees)) {
            for (const user of task.assignees) {
              const notification =
                await this.notificationService.createNotification({
                  message: `The task "${task.name}" has been marked as completed.`,
                  userId: user.id,
                });
              this.notificationsGateway.sendNotification(
                user.id,
                notification.message,
              );
            }
          } else {
            console.error(
              `Task with ID ${taskId} does not have any assignees or assignees are not an array`,
            );
          }
        }
      } else {
        console.error(`Task with ID ${taskId} not found`);
      }
    } catch (error) {
      console.error(
        `Failed to update task status for task ID ${taskId}:`,
        error,
      );
    }
  }

  async findTaskById(taskId: number): Promise<Task> {
    return await findTaskWithDetails(this.taskModel, taskId);
  }

  async findAllTasks(
    findAllTaskDto: FindAllTaskDto,
  ): Promise<{ message: string; tasks: Task[] }> {
    const { keyword, userId } = findAllTaskDto;

    const whereClause: any = {};
    const userWhereClause: any = {};

    if (keyword) {
      whereClause[Op.or] = [
        {
          name: { [Op.iLike]: `%${keyword.toLowerCase()}%` },
        },
        {
          '$"assignees"."username"$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
      ];
    }

    if (userId && userId.length > 0) {
      userWhereClause.id = { [Op.in]: userId };
    }

    const tasks = await this.taskModel.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'username'],
          through: { attributes: [] },
        },
        {
          model: Task,
          as: 'SubTasks',
          attributes: ['id', 'name', 'status'],
          include: [
            {
              model: User,
              attributes: ['id', 'username'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    return { message: 'Tasks retrieved successfully', tasks };
  }

  async updateTask(
    taskId: number,
    updateTaskDto: UpdateTaskDto,
  ): Promise<{ message: string; task: Task }> {
    const task = await this.taskModel.findByPk(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const { name, description, status, userIds, parentTaskId } = updateTaskDto;

    if (name) task.name = name;
    if (description) task.description = description;
    if (status) task.status = status;
    if (parentTaskId !== undefined) task.parentTaskId = parentTaskId;

    if (userIds) {
      await updateTaskAssignees(
        task,
        userIds,
        this.userModel,
        this.notificationService,
        this.notificationsGateway,
      );
    }

    await task.save();

    return {
      message: 'Task updated successfully',
      task: await findTaskWithDetails(this.taskModel, task.id),
    };
  }

  async deleteTask(taskId: number): Promise<{ message: string }> {
    const task = await this.taskModel.findByPk(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    await task.destroy();
    return { message: 'Task successfully deleted' };
  }
}
