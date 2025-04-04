import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Put,
  Param,
  Req,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { SendgridWebhookGuard } from '@ontrack-tech-group/common/services';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { LegalChatService } from './legal-chat.service';
import {
  AuthUser,
  Public,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { UserAccess } from '@ontrack-tech-group/common/constants';
import { User } from '@ontrack-tech-group/common/models';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  PaginationDto,
  PathParamIncidentIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  SendLegalMessageDto,
  GetLegalChatDto,
  UpdateLegalGroupStatusDto,
} from './dto';
import { sendLegalMessage } from './body';

@ApiTags('Legal Chat')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('legal-chat')
export class LegalChatController {
  constructor(private readonly legalChatService: LegalChatService) {}

  @ApiOperation({
    summary: 'Send a Legal Chat Message',
  })
  @ApiBody(sendLegalMessage)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.LEGAL_CHAT_SEND_MESSAGE)
  @Post('/')
  async sendLegalMessage(
    @Body() sendLegalMessage: SendLegalMessageDto,
    @AuthUser() user: User,
  ) {
    return this.legalChatService.sendLegalMessage(sendLegalMessage, user);
  }

  @Public()
  @UseGuards(SendgridWebhookGuard)
  @Post('/webhook')
  @UseInterceptors(AnyFilesInterceptor())
  async handleEmailWebhook(@Req() req: Request, @Res() res: Response) {
    return this.legalChatService.handleEmailWebhook(req.body, res);
  }

  @ApiOperation({
    summary: 'Get all change-logs of a Legal Group by Incident Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.LEGAL_CHAT_CHANGELOGS)
  @Get('/:incident_id/change-logs')
  getLegalGroupChangeLogs(
    @Param() incidentIdDto: PathParamIncidentIdDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.legalChatService.getLegalGroupChangeLogs(
      incidentIdDto.incident_id,
      paginationDto,
    );
  }

  @ApiOperation({
    summary: 'Get All Chat Messages for a Legal Group',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.LEGAL_CHAT_VIEW_MESSAGES,
    UserAccess.INCIDENT_VIEW_LEGAL_LOGS,
  )
  @Get('/:incident_id/chat-messages')
  async getChatMessages(
    @Param() incidentIdDto: PathParamIncidentIdDto,
    @Query() getLegalChatDto: GetLegalChatDto,
  ) {
    return this.legalChatService.getAllChatMessages(
      incidentIdDto.incident_id,
      getLegalChatDto,
    );
  }

  @ApiOperation({
    summary: 'Update Legal Group Status by Incident Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.LEGAL_CHAT_STATUS_UPDATE)
  @Put('/:incident_id/status')
  async updateLegalGroupStatus(
    @Param() incidentIdDto: PathParamIncidentIdDto,
    @Body() updateLegalGroupStatusDto: UpdateLegalGroupStatusDto,
    @AuthUser() user: User,
  ) {
    return this.legalChatService.updateLegalGroupStatus(
      incidentIdDto.incident_id,
      updateLegalGroupStatusDto,
      user,
    );
  }
}
