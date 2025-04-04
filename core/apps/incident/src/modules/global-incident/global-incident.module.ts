import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  ImageService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { UserService } from '@Modules/user/user.service';
import { GlobalIncidentService } from './global-incident.service';
import { GlobalIncidentController } from './global-incident.controller';

@Module({
  controllers: [GlobalIncidentController],
  imports: [HttpModule],
  providers: [GlobalIncidentService, UserService, ImageService, PusherService],
})
export class GlobalIncidentModule {}
