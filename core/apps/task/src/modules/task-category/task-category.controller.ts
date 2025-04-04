import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { TaskCategoryService } from './task-category.service';
import { CreateUpdateTaskCategoryDto, TaskCategoryQueryDto } from './dto';
import { createTaskCategory, updateTaskCategory } from './body';

@ApiTags('Task Categories')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('task-categories')
export class TaskCategoryController {
  constructor(private readonly taskCategoryService: TaskCategoryService) {}

  @ApiOperation({
    summary: 'Create a Task Category',
  })
  @ApiBody(createTaskCategory)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CATEGORY_CREATE)
  @Post()
  createTaskCategory(
    @Body() createTaskCategoryDto: CreateUpdateTaskCategoryDto,
  ) {
    return this.taskCategoryService.createTaskCategory(createTaskCategoryDto);
  }

  @ApiOperation({
    summary: 'Fetch all Task Categories',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CATEGORY_VIEW)
  @Get()
  getAllTaskCategories(@Query() taskCategoryQueryDto: TaskCategoryQueryDto) {
    return this.taskCategoryService.getAllTaskCategories(taskCategoryQueryDto);
  }

  @ApiOperation({
    summary: 'Update a Task Category',
  })
  @ApiBody(updateTaskCategory)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CATEGORY_UPDATE)
  @Put('/:id')
  updateTaskCategory(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTaskCategoryDto: CreateUpdateTaskCategoryDto,
  ) {
    return this.taskCategoryService.updateTaskCategory(
      pathParamIdDto.id,
      updateTaskCategoryDto,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Task Category',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TASK_CATEGORY_DELETE)
  @Delete('/:id')
  deleteTaskCategory(@Param() pathParamIdDto: PathParamIdDto) {
    return this.taskCategoryService.deleteTaskCategory(pathParamIdDto.id);
  }
}
