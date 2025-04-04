import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { ConversationService } from './conversation.service';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { User } from '@ontrack-tech-group/common/models';
import {
  GetIncidentConversationDto,
  UpdateIncidentConversationDto,
} from './dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @ApiOperation({
    summary: 'Get an Incident Conversation',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CONVERSATION_VIEW_ALL)
  @Get('')
  getIncidentConversation(
    @Query() getIncidentConversationDto: GetIncidentConversationDto,
    @AuthUser() user: User,
  ) {
    return this.conversationService.getIncidentConversation(
      getIncidentConversationDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update an Incident Conversation',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CONVERSATION_UPDATE)
  @Put(':id')
  updateIncidentConversation(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateIncidentConversationDto: UpdateIncidentConversationDto,
  ) {
    return this.conversationService.updateIncidentConversation(
      pathParamIdDto.id,
      updateIncidentConversationDto,
    );
  }
}
