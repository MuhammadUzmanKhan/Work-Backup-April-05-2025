import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';

@Module({
  controllers: [ImageController],
  providers: [PusherService, ImageService],
  imports: [ConfigModule],
  exports: [ImageService],
})
export class ImageModule {}
