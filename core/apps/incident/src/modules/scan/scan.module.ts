import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ChangeLogService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { IncidentModule } from '@Modules/incident/incident.module';
import { UserService } from '@Modules/user/user.service';
import { ScanService } from './scan.service';
import { ScanController } from './scan.controller';

@Module({
  controllers: [ScanController],
  imports: [ConfigModule, IncidentModule],
  providers: [ScanService, UserService, ChangeLogService, PusherService],
})
export class ScanModule {}
