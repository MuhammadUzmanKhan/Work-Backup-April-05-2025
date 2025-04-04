import { Response } from 'express';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { DownloadAttachmentsService } from './download-attachments.service';

@ApiTags('Download Attachments')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('download-attachments')
export class DownloadAttachmentsController {
  constructor(
    private readonly downloadAttachmentsService: DownloadAttachmentsService,
  ) {}

  @Post()
  downloadAttachments(@Res() res: Response, @Body() urls: string[]) {
    return this.downloadAttachmentsService.downloadAttachments(res, urls);
  }
}
