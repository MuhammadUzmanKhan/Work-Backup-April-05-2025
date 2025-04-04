import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { TasksService } from './tasks.service';

@Processor('task-status')
export class TasksProcessor {
  constructor(private readonly tasksService: TasksService) {}

  @Process('update-task-status')
  async handleTaskStatusUpdate(job: Job) {
    const { taskId, status } = job.data;
    try {
      await this.tasksService.updateTaskStatus(taskId, status);
    } catch (error) {
      console.error(`Failed to update task status: ${error.message}`);
      throw error;
    }
  }
}
