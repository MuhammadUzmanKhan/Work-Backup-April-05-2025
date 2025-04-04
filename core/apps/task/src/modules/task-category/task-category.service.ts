import { Sequelize } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskCategory } from '@ontrack-tech-group/common/models';
import {
  RESPONSES,
  SocketTypesStatus,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { checkIfNameAlreadyExistModel } from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import { getTaskCategoryById, getTaskCategoryWhereQuery } from './helpers';
import { CreateUpdateTaskCategoryDto, TaskCategoryQueryDto } from './dto';

@Injectable()
export class TaskCategoryService {
  constructor(private readonly pusherService: PusherService) {}

  async createTaskCategory(createTaskCategoryDto: CreateUpdateTaskCategoryDto) {
    const { company_id, name } = createTaskCategoryDto;

    // checking if task category already exist with the same name
    await checkIfNameAlreadyExistModel(
      TaskCategory,
      'Task Category',
      name,
      company_id,
      null,
      null,
    );

    const createdTaskCategory = await TaskCategory.create({
      ...createTaskCategoryDto,
    });

    const taskCategory = (
      await getTaskCategoryById(createdTaskCategory.id, { useMaster: true })
    ).get({ plain: true });

    this.pusherService.sendUpdatedTaskCategory(
      taskCategory,
      SocketTypesStatus.CREATE,
    );

    return taskCategory;
  }

  async getAllTaskCategories(taskCategoryQueryDto: TaskCategoryQueryDto) {
    const { keyword, company_id } = taskCategoryQueryDto;

    return await TaskCategory.findAll({
      where: getTaskCategoryWhereQuery(keyword, company_id),
      attributes: [
        'id',
        'name',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER
            FROM "task_task_categories"
            WHERE "task_task_categories"."task_category_id" = "TaskCategory"."id"
          )`),
          'linkedCount',
        ],
      ],
      order: [['created_at', SortBy.DESC]],
    });
  }

  async updateTaskCategory(
    id: number,
    updateTaskCategoryDto: CreateUpdateTaskCategoryDto,
  ) {
    const { company_id, name } = updateTaskCategoryDto;

    // Check if the task category exists
    const taskCategory = await getTaskCategoryById(id);

    // Check if another category with the same name exists in the same company
    await checkIfNameAlreadyExistModel(
      TaskCategory,
      'Task Category',
      name,
      company_id,
      null,
      id,
    );

    await taskCategory.update(updateTaskCategoryDto);

    // Fetch the updated task category to return
    const taskCategoryUpdated = (
      await getTaskCategoryById(taskCategory.id, { useMaster: true })
    ).get({ plain: true });

    this.pusherService.sendUpdatedTaskCategory(
      taskCategoryUpdated,
      SocketTypesStatus.UPDATE,
    );

    return taskCategoryUpdated;
  }

  async deleteTaskCategory(id: number) {
    const taskCategory = await getTaskCategoryById(id);
    if (!taskCategory)
      throw new NotFoundException(RESPONSES.notFound('Task Category'));

    await taskCategory.destroy();

    this.pusherService.sendUpdatedTaskCategory(
      taskCategory.get({ plain: true }),
      SocketTypesStatus.DELETE,
    );

    return { message: RESPONSES.destroyedSuccessfully('Task Category') };
  }
}
