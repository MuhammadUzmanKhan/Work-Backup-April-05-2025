import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhookPermission } from '@ontrack-tech-group/common/services';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-messages.dto';

@ApiTags('Messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('create-messages')
  @UseGuards(WebhookPermission)
  createMessages(@Body() userNumbersWithMessage: CreateMessageDto) {
    return this.messagesService.createMessages(userNumbersWithMessage);
  }
}
