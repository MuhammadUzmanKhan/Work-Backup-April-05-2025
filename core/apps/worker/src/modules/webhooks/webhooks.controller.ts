import {
  Controller,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Body,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('telnyx')
  telnyxWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Query() query: { event_id: number },
    @Body() webhookData: any,
  ) {
    return this.webhooksService.telnyxWebhook(req, query, webhookData);
  }
}
