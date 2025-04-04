import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ImageService } from './image.service';
import { PusherService } from '../pusher.service';

@Module({
  providers: [PusherService, ImageService],
  imports: [ConfigModule],
  exports: [ImageService],
})
export class ImageModule {}
