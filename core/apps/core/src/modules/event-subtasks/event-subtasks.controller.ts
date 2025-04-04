import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { EventSubtasksService } from './event-subtasks.service';
import { CreateEventSubtaskDto, UploadSubtaskAttachmentDto } from './dto';

@ApiTags('Event Subtasks')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('event-subtasks')
export class EventSubtasksController {
  constructor(private readonly eventSubtasksService: EventSubtasksService) {}

  @Post()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CREATE_TASK)
  async createSubtask(
    @Query('event_id') event_id: number,
    @Body() createEventSubtaskDto: CreateEventSubtaskDto,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.createSubtask(
      createEventSubtaskDto,
      event_id,
      user,
    );
  }

  @Post('/upload-attachment')
  @ApiBearerAuth()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_UPLOAD_TASK_ATTACHMENT)
  async uploadEventAttachment(
    @Body() uploadSubtaskAttachmentDto: UploadSubtaskAttachmentDto,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.uploadSubtaskAttachment(
      uploadSubtaskAttachmentDto,
      user,
    );
  }

  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW_TASK)
  async getAllSubtasks(
    @Query('event_id') event_id: number,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.getAllSubtasks(event_id, user);
  }

  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW_TASK)
  async getSubtaskById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query('event_id') event_id: number,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.getSubtaskById(
      pathParamIdDto.id,
      event_id,
      user,
    );
  }

  @Put('/status-change/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_UPDATE_TASK_STATUS)
  async updateCompleted(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query('event_id') event_id: number,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.updateCompleted(
      pathParamIdDto.id,
      event_id,
      user,
    );
  }

  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_UPDATE_TASK)
  async updateSubtask(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query('event_id') event_id: number,
    @Body() updateEventSubtask: CreateEventSubtaskDto,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.updateSubtask(
      pathParamIdDto.id,
      event_id,
      updateEventSubtask,
      user,
    );
  }

  @Delete(':id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_DELETE_TASK)
  async removeSubtask(
    @Param('id') id: number,
    @Query('event_id') event_id: number,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.removeSubtask(+id, event_id, user);
  }

  @Delete('/:id/attachment/:attachmentId')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_DELETE_TASK_ATTACHMENT)
  async removeSubtaskAttachment(
    @Param('id') id: number,
    @Param('attachmentId') attachmentId: number,
    @Query('event_id') event_id: number,
    @AuthUser() user: User,
  ) {
    return this.eventSubtasksService.removeSubtaskAttachment(
      +id,
      +attachmentId,
      event_id,
      user,
    );
  }
}
