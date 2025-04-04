import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { PusherService } from '@ontrack-tech-group/common/services';
import { PresetController } from './preset.controller';
import { PresetService } from './preset.service';

@Module({
  controllers: [PresetController],
  providers: [PresetService, PusherService],
  imports: [
    HttpModule,
    ConfigModule,
    SequelizeModule.forFeature([]), // Add User and Company models here if using Sequelize
  ],
})
export class PresetModule {}
