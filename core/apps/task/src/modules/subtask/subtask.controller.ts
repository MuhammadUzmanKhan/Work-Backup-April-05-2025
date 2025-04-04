import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { TaskIdQueryParamDto } from '@Common/dto';
import { TaskService } from '@Modules/task/task.service';
import { assignTask } from '@Modules/task/body';
import { UpdateTaskAssigneeDto } from '@Modules/task/dto';
import { SubtaskService } from './subtask.service';
import {
  CreateSubtaskDto,
  RemoveSubtaskAttachmentsDto,
  UpdateSubtaskDto,
  UploadSubtaskAttachmentDto,
} from './dto';
import {
  createSubtaskTask,
  removeSubtaskAttachments,
  updateSubtask,
  uploadSubtaskAttachment,
} from './body';

@ApiTags('Subtasks')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('subtasks')
export class SubtaskController {
  constructor(
    private readonly subtaskService: SubtaskService,
    private readonly taskService: TaskService,
  ) {}

  @ApiOperation({
    summary: 'Create a subtask against a task using parent_id',
  })
  @ApiBody(createSubtaskTask)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_SUBTASK_CREATE)
  @Post()
  createSubtask(
    @Body() createEventSubtaskDto: CreateSubtaskDto,
    @AuthUser() user: User,
  ) {
    return this.subtaskService.createSubtask(createEventSubtaskDto, user);
  }

  @ApiOperation({
    summary: 'Upload attachments of a specific subtask',
  })
  @ApiBody(uploadSubtaskAttachment)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_SUBTASK_UPLOAD_ATTACHMENT)
  @Post('/upload-attachment')
  uploadSubtaskAttachment(
    @Body() uploadSubtaskAttachmentDto: UploadSubtaskAttachmentDto,
    @AuthUser() user: User,
  ) {
    return this.subtaskService.uploadSubtaskAttachment(
      uploadSubtaskAttachmentDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get all subtasks of a task using parent_id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_SUBTASK_VIEW_ALL)
  @Get()
  getAllSubtasks(
    @Query() taskIdQueryParam: TaskIdQueryParamDto,
    @AuthUser() user: User,
  ) {
    return this.subtaskService.getAllSubtasks(taskIdQueryParam.parent_id, user);
  }

  @ApiOperation({
    summary: 'Get specific subtask of a task using subtask "id"',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_SUBTASK_VIEW)
  @Get('/:id')
  getSubtaskById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() taskIdQueryParamDto: TaskIdQueryParamDto,
    @AuthUser() user: User,
  ) {
    return this.subtaskService.getSubtaskById(
      pathParamIdDto.id,
      taskIdQueryParamDto.parent_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update specific subtask using subtask "id"',
  })
  @ApiBody(updateSubtask)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_SUBTASK_UPDATE)
  @Put('/:id')
  updateSubtask(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
    @AuthUser() user: User,
  ) {
    return this.subtaskService.updateSubtask(
      pathParamIdDto.id,
      updateSubtaskDto,
      user,
    );
  }

  @ApiOperation({
    summary:
      'Remove/Destroy a Multiple subtask attachment using Subtask Id and Attachment Ids',
  })
  @ApiBody(removeSubtaskAttachments)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_SUBTASK_REMOVE_ATTACHMENT)
  @Put(':id/remove-attachments')
  removeSubtaskAttachment(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() removeSubtaskAttachmentsDto: RemoveSubtaskAttachmentsDto,
    @AuthUser() user: User,
  ) {
    return this.subtaskService.removeSubtaskAttachment(
      pathParamIdDto.id,
      removeSubtaskAttachmentsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Assiging a subtask to a User or Department',
  })
  @ApiBody(assignTask)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_ASSIGNEE)
  @Put('/:id/assignee')
  updateTaskAssignee(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTaskAssigneeDto: UpdateTaskAssigneeDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.updateTaskAssignee(
      pathParamIdDto.id,
      updateTaskAssigneeDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Remove/Destroy a specific subtask using subtask "id"',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_SUBTASK_DELETE)
  @Delete('/:id')
  removeSubtask(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() taskIdQueryParam: TaskIdQueryParamDto,
    @AuthUser() user: User,
  ) {
    return this.subtaskService.removeSubtask(
      pathParamIdDto.id,
      taskIdQueryParam.parent_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Remove Assignee from a Task',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_REMOVE_ASSIGNEE)
  @Delete('/:id/assignee')
  removeTaskAssignee(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.removeTaskAssignee(pathParamIdDto.id, user);
  }
}
