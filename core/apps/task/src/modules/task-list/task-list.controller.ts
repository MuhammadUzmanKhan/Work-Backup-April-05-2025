import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  Get,
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
import { Request, Response } from 'express';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { TaskListService } from './task-list.service';
import {
  CreateTaskListDto,
  TaskByListDto,
  TaskListNamesQueryDto,
  TaskListQueryDto,
  UpdateMultipleTasksDto,
  UpdateTaskListDto,
} from './dto';
import {
  createTaskList,
  getAllTaskListNames,
  getAllTaskLists,
  getAllTasksByList,
  updateMultipleTaskList,
  updateTaskList,
} from './body';

@ApiTags('Task Lists')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('task-lists')
export class TaskListController {
  constructor(private readonly taskListService: TaskListService) {}

  @ApiOperation({
    summary: 'Create a Task List',
  })
  @ApiBody(createTaskList)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_CREATE)
  @Post()
  createTaskList(
    @Body() createTaskListDto: CreateTaskListDto,
    @AuthUser() user: User,
  ) {
    return this.taskListService.createTaskList(createTaskListDto, user);
  }

  @ApiOperation({
    summary: 'Fetch all Task Lists with Tasks',
  })
  @ApiBody(getAllTaskLists)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.TASK_LIST_VIEW_TASKS,
    UserAccess.TASK_EXPORT_CSV_PDF,
  )
  @Post('/tasks')
  getAllTaskLists(
    @Body() taskListQueryDto: TaskListQueryDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.taskListService.getAllTaskLists(
      taskListQueryDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary:
      'Fetch all Tasks by Task List (If not task_list_id exist return all standalone tasks',
  })
  @ApiBody(getAllTasksByList)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_VIEW_TASKS)
  @Post('/tasks-by-list')
  getAllTasksByList(
    @Body() tasksByListDto: TaskByListDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.taskListService.getAllTasksByList(tasksByListDto, user, res);
  }

  @ApiOperation({
    summary: 'Fetch all Task Lists names with filters',
  })
  @ApiBody(getAllTaskListNames)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_NAMES)
  @Post('/names')
  getAllTaskListNamesWithFilters(
    @Body() taskListNamesQueryDto: TaskListNamesQueryDto,
    @AuthUser() user: User,
    @Res() res: Response,
  ) {
    return this.taskListService.getAllTaskListNamesWithFilters(
      taskListNamesQueryDto,
      user,
      res,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Task Lists names',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_NAMES)
  @Get('/names')
  getAllTaskListNames(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.taskListService.getAllTaskListNames(
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update a Task List',
  })
  @ApiBody(updateTaskList)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_UPDATE)
  @Put('/:id')
  updateTaskList(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTaskListDto: UpdateTaskListDto,
    @AuthUser() user: User,
  ) {
    return this.taskListService.updateTaskList(
      pathParamIdDto.id,
      updateTaskListDto,
      user,
    );
  }

  @ApiOperation({
    summary:
      'Update `date` and `incident_division_id` multiple tasks againt list_id',
  })
  @ApiBody(updateMultipleTaskList)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_MULTIPLE_UPDATE)
  @Put('/:id/multiple')
  updateMultipleTaskList(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateMultipleTasksDto: UpdateMultipleTasksDto,
    @AuthUser() user: User,
  ) {
    return this.taskListService.updateMultipleTaskList(
      pathParamIdDto.id,
      updateMultipleTasksDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Pin/Unpin a Task List',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_PIN)
  @Put('/:id/pin')
  pinTaskList(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.taskListService.pinTaskList(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Lock/Unlock Incident Divisions',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_LOCK_DIVISIONS)
  @Put('/:id/lock-divisions')
  toggleLockDivisions(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.taskListService.toggleLockDivisions(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Lock/Unlock Dates',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_LOCK_DATES)
  @Put('/:id/lock-dates')
  toggleLockDates(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.taskListService.toggleLockDates(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Destroy a Task List',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_LIST_DELETE)
  @Delete('/:id')
  deleteTaskList(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.taskListService.deleteTaskList(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }
}
