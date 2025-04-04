import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, PusherService],
  imports: [ConfigModule],
  exports: [CommentsService],
})
export class CommentsModule {}
