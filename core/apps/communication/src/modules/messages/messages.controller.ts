import { Observable, of } from 'rxjs';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { MessagePattern } from '@nestjs/microservices';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  Public,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  RolePermissionGuard,
  WebhookPermission,
} from '@ontrack-tech-group/common/services';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
  X_API_KEY,
  X_API_SECRET,
} from '@ontrack-tech-group/common/constants';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import {
  CreateMessageDto,
  CreateMessageSQSDto,
  GetGroupMessagesDto,
  GetIncidentMessagesDto,
  MessagesQueryParamsDto,
} from './dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Create a message' })
  @Post()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MESSAGE_SEND_MESSAGE)
  createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.messagesService.createMessage(createMessageDto, user, req);
  }

  @ApiOperation({
    summary: 'Create a message object for SQS using message body and number',
  })
  @Public()
  @ApiHeader(X_API_KEY)
  @ApiHeader(X_API_SECRET)
  @Post('/create-messages')
  @UseGuards(WebhookPermission)
  createMessagesForSQS(@Body() userNumbersWithMessage: CreateMessageSQSDto) {
    return this.messagesService.createMessagesForSQS(userNumbersWithMessage);
  }

  @Public()
  @Post('telnyx')
  telnyxWebhook(@Req() req: RawBodyRequest<Request>, @Body() webhookData: any) {
    return this.messagesService.telnyxWebhook(req, webhookData);
  }

  @Public()
  @Post('twilio')
  twilioWebhook(@Req() req: RawBodyRequest<Request>, @Body() webhookData: any) {
    return this.messagesService.twilioWebhook(req, webhookData);
  }

  @MessagePattern('send-message')
  async sendPublicContactEmail(createMessageSQSDto: {
    body: string;
  }): Promise<Observable<any>> {
    try {
      const decryptedCreateMessageSQSDtoBody: CreateMessageSQSDto = decryptData(
        createMessageSQSDto.body,
      ) as unknown as CreateMessageSQSDto;

      const sendMessage = await this.messagesService.createMessagesForSQS(
        decryptedCreateMessageSQSDtoBody,
      );
      return of(sendMessage);
    } catch (error) {
      return of(error.response);
    }
  }

  @ApiOperation({
    summary: 'Sent and received messages of staff/driver',
  })
  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MESSAGE_VIEW_MESSAGES)
  getMessages(@Query() query: MessagesQueryParamsDto) {
    return this.messagesService.getMessages(query);
  }

  @ApiOperation({
    summary: 'Messages sent to particular message group',
  })
  @Get('/group-messages')
  getGroupMessages(@Query() getGroupMessagesDto: GetGroupMessagesDto) {
    return this.messagesService.getGroupMessages(getGroupMessagesDto);
  }

  @ApiOperation({
    summary: 'Script to assign message number to user',
  })
  @Get('assign-users-numbers')
  assignNumberToUser() {
    return this.messagesService.assignNumberToUser();
  }

  @ApiOperation({
    summary: 'Script to assign message number to campers after user',
  })
  @Get('assign-campers-numbers')
  assignNumberToCampers() {
    return this.messagesService.assignNumberToCampers();
  }

  @ApiOperation({
    summary: 'Get Incident Messages',
  })
  @Get('incidents')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.MESSAGE_VIEW_MESSAGES)
  getIncidentMessages(
    @AuthUser() user: User,
    @Query() getIncidentMessagesDto: GetIncidentMessagesDto,
  ) {
    return this.messagesService.getIncidentMessages(
      user,
      getIncidentMessagesDto,
    );
  }
}
