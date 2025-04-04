import { CreateUpdateTaskCategoryDto } from '../dto';

export const createTaskCategory = {
  type: CreateUpdateTaskCategoryDto,
  examples: {
    Example: {
      value: {
        name: 'Task Category Name',
        company_id: 6,
      },
    },
  },
};

export const updateTaskCategory = {
  type: CreateUpdateTaskCategoryDto,
  examples: {
    Example: { value: { name: 'Updated Task Category Name', company_id: 6 } },
  },
};
