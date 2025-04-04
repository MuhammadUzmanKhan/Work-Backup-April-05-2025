import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pg from 'pg';
import { Sequelize } from 'sequelize-typescript';
import {
  FrameWork,
  Library,
  Project,
  ProjectFrameWork,
  ProjectLibrary,
  Role,
  UserRoles,
  UserSessions,
  Users,
} from '../models';

export const databaseProviders: Provider[] = [
  {
    provide: 'SEQUELIZE',
    useFactory: async (configService: ConfigService) => {
      const sequelize = new Sequelize({
        dialect: 'postgres',
        host: configService.get('DB_HOST'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        logging: !!Number(configService.get('DB_LOGGING'))
          ? console.log
          : false,
        dialectModule: pg,
      });
      sequelize.addModels([
        Users,
        Project,
        FrameWork,
        ProjectFrameWork,
        Role,
        UserRoles,
        Library,
        ProjectLibrary,
        UserSessions,
      ]);
      if (!!Number(configService.get('SYNC_DATABASE'))) {
        await sequelize.sync({ alter: true, force: false });

        // Create admin if not exists
        // const usersService: UsersService = new UsersService(configService, s3Service, mailService);
        // await usersService.createSuperUserAdmin();
      }
      return sequelize;
    },
    inject: [ConfigService],
  },
];
