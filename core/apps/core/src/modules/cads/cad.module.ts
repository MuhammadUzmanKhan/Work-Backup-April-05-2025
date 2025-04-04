import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { Module } from '@nestjs/common';
import { ImageModule } from '@Modules/image/image.module';
import { CadController } from './cad.controller';
import { CadService } from './cad.service';

@Module({
  controllers: [CadController],
  providers: [CadService, PusherService],
  imports: [ImageModule, HttpModule, ConfigModule],
  exports: [CadService],
})
export class CadModule {}
