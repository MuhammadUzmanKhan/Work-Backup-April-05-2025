// src/user/user.module.ts

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { UserService } from './user.service';

import { User } from './user.entity';
import { UserController } from './user.controller';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UserService, UserModule],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
