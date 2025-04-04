import { Sequelize } from 'sequelize';
import { isPastDue } from '@Common/helpers';

export const isTaskExistAttributes = (eventTimezone: string): any => {
  const attributes = [
    'id',
    'name',
    'created_by',
    'event_id',
    'parent_id',
    'task_list_id',
    'department_id',
    'deadline',
    'start_date',
    'status',
    'color',
    'completed_past_due',
    'createdAt',
    'location',
    'order',
    'is_pinned',
    [Sequelize.col('task_list.is_date_locked'), 'is_date_locked'],
    [Sequelize.literal('"task_list"."name"'), 'list_name'],
  ];

  if (eventTimezone) attributes.push(isPastDue('Task', eventTimezone));

  return attributes;
};
