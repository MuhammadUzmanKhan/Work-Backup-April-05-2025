// src/sequelize-config.ts

import { SequelizeModuleOptions } from '@nestjs/sequelize';

export const sequelizeConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: '1234',
  database: 'nest-db-1',
  autoLoadModels: true,
  synchronize: true, // Set to false in production
};
