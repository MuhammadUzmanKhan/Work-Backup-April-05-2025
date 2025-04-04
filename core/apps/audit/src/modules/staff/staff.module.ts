import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';

import { ShiftService } from '@Modules/shift/shift.service';
import { VendorV2Service } from '@Modules/vendor/vendor.v2.service';
import { VendorPositionV2Service } from '@Modules/vendor-position/vendor-position.v2.service';

import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { StaffV2Controller } from './staff.v2.controller';
import { StaffV2Service } from './staff.v2.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [StaffController, StaffV2Controller],
  providers: [
    StaffService,
    StaffV2Service,
    PusherService,
    ShiftService,
    VendorV2Service,
    VendorPositionV2Service,
  ],
})
export class StaffModule {}
