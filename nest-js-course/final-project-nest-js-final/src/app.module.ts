import { Module } from '@nestjs/common';

import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { sequelizeConfig } from './database/config/database.config';
import { User } from './database/models/users.model';
import { Task } from './database/models/tasks.model';
import { Notification } from './database/models/notifications.models';
import { UserTask } from './database/models/user-task.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    SequelizeModule.forRoot(sequelizeConfig),
    SequelizeModule.forFeature([User, Task, Notification, UserTask]),
    TasksModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'task-status',
    }),

    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
