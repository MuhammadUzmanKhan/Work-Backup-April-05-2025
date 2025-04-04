import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ShiftModule } from '@Modules/shift/shift.module';
import { PositionModule } from '@Modules/position/position.module';
import { AreaModule } from '@Modules/area/area.module';
import { PositionNameModule } from '@Modules/position-name/position-name.module';
import { VendorModule } from '@Modules/vendor/vendor.module';
import { DotService } from './dot.service';
import { DotController } from './dot.controller';

@Module({
  controllers: [DotController],
  providers: [DotService, PusherService],
  imports: [
    ConfigModule,
    ShiftModule,
    PositionModule,
    AreaModule,
    PositionNameModule,
    VendorModule,
  ],
})
export class DotModule {}
