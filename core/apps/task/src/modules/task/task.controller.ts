import { Response, Request } from 'express';
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  EventIdQueryDto,
  PaginationDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
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
import { RemoveAttachmentDto } from '@Common/dto';
import { TaskByListDto, TaskListQueryDto } from '@Modules/task-list/dto';
import { getAllTaskLists } from '@Modules/task-list/body';
import { TaskService } from './task.service';
import {
  AddCommentDto,
  CreateTaskDto,
  UpdateTaskAssigneeDto,
  UpdateTaskDto,
  CreateBulkTaskDto,
  CloneListOrTaskDto,
  UploadAttachmentDto,
  DeleteMultipleTasksDto,
  UpdateMultipleTasksDto,
  EventNamesQueryParams,
  TaskNamesQueryParams,
  GetTaskQueryParamsDto,
  GetTaskCommentQueryDto,
} from './dto';
import {
  addComment,
  assignTask,
  createBulkTask,
  createTask,
  updateTask,
  uploadAttachment,
  cloneListsOrTasks,
  updateMultipleTasks,
  deleteMultipleTasks,
} from './body';

@ApiTags('Tasks')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({
    summary: 'Create a Task',
  })
  @ApiBody(createTask)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CREATE)
  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto, @AuthUser() user: User) {
    return this.taskService.createTask(createTaskDto, user);
  }

  @ApiOperation({
    summary: 'Create multiple tasks',
  })
  @ApiBody(createBulkTask)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CREATE_MULTIPLE)
  @Post('/multiple')
  createBulkTask(
    @Body() createBulkTaskDto: CreateBulkTaskDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.createBulkTask(createBulkTaskDto, user);
  }

  @ApiOperation({
    summary: 'Add a comment against a task',
  })
  @ApiBody(addComment)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_ADD_COMMENT)
  @Post('/add-comment')
  addTaskComment(@Body() addCommentDto: AddCommentDto, @AuthUser() user: User) {
    return this.taskService.addTaskComment(addCommentDto, user);
  }

  @ApiOperation({
    summary: 'Upload attachment of a specific task',
  })
  @ApiBody(uploadAttachment)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_UPLOAD_ATTACHMENT)
  @Post('/upload-attachment')
  uploadSubtaskAttachment(
    @Body() uploadAttachmentDto: UploadAttachmentDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.uploadAttachment(uploadAttachmentDto, user);
  }

  @ApiOperation({
    summary: 'Clone Lists or tasks from an event to current event',
  })
  @ApiBody(cloneListsOrTasks)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CLONE)
  @Post('/clone')
  cloneListsOrTasks(
    @Body() cloneListOrTaskDto: CloneListOrTaskDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.cloneListsOrTasks(
      cloneListOrTaskDto,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get counts of tasks with or without filters',
  })
  @ApiBody(getAllTaskLists)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_VIEW_TASKS)
  @Post('/status-count')
  async getTaskStatusCount(
    @Body() countTaskStatusDto: TaskListQueryDto | TaskByListDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.getTaskStatusCount(countTaskStatusDto, user);
  }

  @ApiOperation({
    summary: 'Get all Task Names by list',
  })
  @Get('/names')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_VIEW)
  getAllTaskNamesByList(
    @Query() taskNamesQueryParams: TaskNamesQueryParams,
    @AuthUser() user: User,
  ) {
    return this.taskService.getAllTaskNamesByList(taskNamesQueryParams, user);
  }

  @ApiOperation({
    summary:
      'Get all Event Names of provied compoany_id which event had task_future',
  })
  @Get('/event-names')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_VIEW)
  getAllEventNames(
    @Query() eventNameQuery: EventNamesQueryParams,
    @AuthUser() user: User,
  ) {
    return this.taskService.getAllEventNames(eventNameQuery, user);
  }

  @ApiOperation({
    summary: 'Fetch All Incident Divisions Names',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_DIVISION_VIEW_ALL)
  @Get('/division-names')
  getAllDivisionNamesByEvent(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.getAllDivisionNamesByEvent(
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get all change-logs of a Task by task id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CHANGE_LOGS)
  @Get('/:id/change-logs')
  getTaskChangeLogs(
    @Param() taskIdPathDto: PathParamIdDto,
    @Query() paginationDto: PaginationDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.getTaskChangeLogs(
      taskIdPathDto.id,
      paginationDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get all comments of a Task by task id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_COMMENTS)
  @Get('/:id/comments')
  getTaskComments(
    @Param() taskIdPathDto: PathParamIdDto,
    @Query() getTaskComment: GetTaskCommentQueryDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.getTaskComments(
      taskIdPathDto.id,
      getTaskComment,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get a Task by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_VIEW, UserAccess.TASK_EXPORT_CSV_PDF)
  @Get('/:id')
  getTaskById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() getTaskQueryParamsDto: GetTaskQueryParamsDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.taskService.getTaskById(
      pathParamIdDto.id,
      getTaskQueryParamsDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'Update Multiple Tasks => Make Standalone, Link to a List',
  })
  @ApiBody(updateMultipleTasks)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_UPDATE, UserAccess.TASK_MAKE_RECURRING)
  @Put('/multiple')
  updateMultipleTasks(
    @Body() updateMultipleTasksDto: UpdateMultipleTasksDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.updateMultipleTasks(updateMultipleTasksDto, user);
  }

  @ApiOperation({
    summary: 'Update a Task',
  })
  @ApiBody(updateTask)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.TASK_UPDATE,
    UserAccess.TASK_UPDATE_LOCATION,
    UserAccess.TASK_UPDATE_DIVISION,
    UserAccess.TASK_UPDATE_STATUS,
    UserAccess.TASK_UPDATE_NAME,
    UserAccess.TASK_UPDATE_DESCRIPTION,
    UserAccess.TASK_MAKE_STANDALONE,
    UserAccess.TASK_LINK_TO_LIST,
    UserAccess.TASK_FLAG,
  )
  @Put('/:id')
  updateTask(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTaskDto: UpdateTaskDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.updateTask(pathParamIdDto.id, updateTaskDto, user);
  }

  @ApiOperation({
    summary: 'Update a Task Priority',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_PRIORITY)
  @Put('/:id/priority')
  updateTaskPriority(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.updateTaskPriority(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Assiging a Task to a User or Department',
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
    summary: 'Pin a Task',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_PIN)
  @Put('/:id/pin')
  pinTask(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.taskService.pinTask(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Destroy Multiple Tasks',
  })
  @ApiBody(deleteMultipleTasks)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_DELETE)
  @Delete('/multiple')
  deleteMultipleTasks(@Body() deleteMultipleTasksDto: DeleteMultipleTasksDto) {
    return this.taskService.deleteMultipleTasks(deleteMultipleTasksDto);
  }

  @ApiOperation({
    summary: 'Destroy a Task',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_DELETE)
  @Delete('/:id')
  deleteTask(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.deleteTask(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
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

  @ApiOperation({
    summary: 'Delete attachment of a specific task',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_REMOVE_ATTACHMENT)
  @Delete('/:id/attachment/:attachment_id')
  deleteAttachment(
    @Param() removeAttachmentDto: RemoveAttachmentDto,
    @AuthUser() user: User,
  ) {
    return this.taskService.deleteAttachment(
      removeAttachmentDto.id,
      removeAttachmentDto.attachment_id,
      user,
    );
  }
}
