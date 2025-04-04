import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DownloadAttachmentsService } from './download-attachments.service';
import { DownloadAttachmentsController } from './download-attachments.controller';

@Module({
  imports: [ConfigModule],
  controllers: [DownloadAttachmentsController],
  providers: [DownloadAttachmentsService, ConfigService],
})
export class DownloadAttachmentsModule {}
