import { Module } from '@nestjs/common';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ConfigService } from '@nestjs/config';
import { ReferenceMapService } from './reference-map.service';
import { ReferenceMapController } from './reference-map.controller';

@Module({
  controllers: [ReferenceMapController],
  providers: [ReferenceMapService, PusherService, ConfigService],
})
export class ReferenceMapModule {}
