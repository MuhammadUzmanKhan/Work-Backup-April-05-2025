import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PusherService } from '@ontrack-tech-group/common/services';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';

@Module({
  controllers: [VendorController],
  providers: [VendorService, PusherService],
  exports: [VendorService],
  imports: [ConfigModule, HttpModule],
})
export class VendorModule {}
