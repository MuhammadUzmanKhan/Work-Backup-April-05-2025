import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { IncidentModule } from '@Modules/incident/incident.module';
import { SourceService } from './source.service';
import { SourceController } from './source.controller';

@Module({
  imports: [HttpModule, forwardRef(() => IncidentModule)],
  controllers: [SourceController],
  providers: [SourceService, PusherService, ConfigService],
  exports: [SourceService],
})
export class SourceModule {}
