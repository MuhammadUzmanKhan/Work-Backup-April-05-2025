import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { CadTypeController } from './cad-type.controller';
import { CadTypeService } from './cad-type.service';

@Module({
  controllers: [CadTypeController],
  providers: [CadTypeService, PusherService],
  imports: [HttpModule, ConfigModule],
  exports: [CadTypeService],
})
export class CadTypeModule {}
