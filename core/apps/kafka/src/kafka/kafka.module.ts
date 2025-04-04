import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';

import { KafkaService } from './kafka.service';
import { KafkaController } from './kafka.controller';

@Module({
  imports: [],
  controllers: [KafkaController],
  providers: [KafkaService, PusherService, ConfigService],
  exports: [KafkaService],
})
export class KafkaModule {}
