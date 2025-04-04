import { Module } from '@nestjs/common';
import { UserService } from '@Modules/user/user.service';
import { ScanCountService } from './scan-count.service';
import { ScanCountController } from './scan-count.controller';
import { HttpModule } from '@nestjs/axios';
import { PusherService } from '@ontrack-tech-group/common/services';

@Module({
  controllers: [ScanCountController],
  imports: [HttpModule],
  providers: [ScanCountService, UserService, PusherService],
})
export class ScanCountModule {}
