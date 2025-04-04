import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import {
  CreateTaskValidationDto,
  UpdateTaskDto,
  FindAllTaskDto,
  DeleteTaskDto,
  FindTaskByIdDto,
} from './dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(@Body() createTaskDto: CreateTaskValidationDto) {
    return this.tasksService.createTask(createTaskDto);
  }

  @Get()
  async findAllTask(@Query() findAllTaskDto: FindAllTaskDto) {
    return this.tasksService.findAllTasks(findAllTaskDto);
  }

  @Get('/:id')
  async findTaskById(@Param() params: FindTaskByIdDto) {
    return this.tasksService.findTaskById(params.id);
  }

  @Put('/:id')
  async updateTask(
    @Param() params: FindTaskByIdDto,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(params.id, updateTaskDto);
  }
  @Delete('/:id')
  async deleteTask(@Param() params: DeleteTaskDto) {
    return this.tasksService.deleteTask(params.id);
  }
}
