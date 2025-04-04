import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PusherService } from '@ontrack-tech-group/common/services';
import { UserService } from '@Modules/user/user.service';
import { LiveVideoService } from './live-video.service';
import { LiveVideoController } from './live-video.controller';

@Module({
  controllers: [LiveVideoController],
  imports: [HttpModule, ConfigModule],
  providers: [LiveVideoService, UserService, PusherService],
})
export class LiveVideoModule {}
