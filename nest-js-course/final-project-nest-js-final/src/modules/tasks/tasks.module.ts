import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BullModule } from '@nestjs/bull';
import { UsersModule } from 'src/modules/users/users.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from '../../database/models/tasks.model';
import { UserTask } from '../../database/models/user-task.model';
import { TasksProcessor } from './tasks.processor';
import { User } from 'src/database/models/users.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Task, UserTask, User]),
    UsersModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'task-status',
    }),
  ],
  controllers: [TasksController],
  providers: [TasksProcessor, TasksService],
})
export class TasksModule {}
