import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import * as pg from 'pg';
import * as dotenv from 'dotenv';
import { databaseProviders } from './database.providers';

dotenv.config();

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      dialectModule: pg,
      replication: {
        read: [
          {
            host: process.env.DB_READER,
          },
        ],
        write: {
          host: process.env.DB_HOST,
        },
      },
      pool: {
        max: 20,
        idle: 30000,
        acquire: 60000,
      },
    }),
    ConfigModule.forRoot(),
  ],
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
