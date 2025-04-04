import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
import { AuthUser } from '@ontrack-tech-group/common/decorators';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { MessagesService } from './messages.service';
import { CreateMessageDto, MessagesQueryParamsDto } from './dto';

@ApiTags('Messages')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Create a message', deprecated: true })
  @Post()
  createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @AuthUser() user: User,
  ) {
    return this.messagesService.createMessage(createMessageDto, user);
  }

  @ApiOperation({
    summary: 'Sent and received messages of staff/driver',
    deprecated: true,
  })
  @Get()
  getMessages(@Query() query: MessagesQueryParamsDto) {
    return this.messagesService.getMessages(query);
  }
}
