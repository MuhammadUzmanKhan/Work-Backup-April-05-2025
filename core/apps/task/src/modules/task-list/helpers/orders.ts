import { Sequelize } from 'sequelize';
import { Task } from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { TaskSortingColumns } from '@Common/constants';

export const taskByListOrder = (
  sort_column: TaskSortingColumns,
  sort_by: SortBy,
  standalone: boolean,
): any => {
  const isNameSorting = sort_column === TaskSortingColumns.NAME;

  return [
    [Sequelize.literal('"is_pinned"'), SortBy.DESC],

    // Flattened name sorting directly into the main array
    ...(isNameSorting
      ? [
          // First sorting condition: alphabetic sorting
          // This condition removes all numeric characters from the task name and converts it to lowercase
          // Sorting alphabetically in case-insensitive manner
          [
            Sequelize.literal(`
              CASE
                WHEN "Task"."name" ~ '^[0-9]+' THEN regexp_replace("Task"."name", '^(\\d+).*', '\\1')::int
                ELSE NULL
              END
            `),
            sort_by || SortBy.ASC,
          ],
          // Second sorting condition: numeric sorting (natural order)
          // This condition extracts numeric characters from the task name (if present) and casts them to integer
          // It allows sorting by numeric portions after the alphabetic part, handling cases like "Task 2" and "Task 11"
          [
            Sequelize.literal(`
              regexp_replace(lower("Task"."name"), '^\\d+', '', 'g')
            `),
            sort_by || SortBy.ASC,
          ],
        ]
      : []),

    sort_column === TaskSortingColumns.STATUS
      ? standalone
        ? Task._taskStatusSequence
        : Task.taskStatusSequence
      : sort_column === TaskSortingColumns.DEPARTMENT
        ? [Sequelize.col('"event->departments"."name"'), sort_by || SortBy.DESC]
        : sort_column === TaskSortingColumns.INCIDENT_DIVISION
          ? [
              Sequelize.col('"event->incident_divisions"."name"'),
              sort_by || SortBy.DESC,
            ]
          : sort_column && sort_column !== TaskSortingColumns.NAME // Avoid including 'order' if sorting by name
            ? [sort_column, sort_by || SortBy.ASC]
            : ['order', sort_by || SortBy.ASC],

    [Sequelize.literal('"Task"."created_at"'), SortBy.ASC],

    // ordering for Task Category
    [Sequelize.col('"task_categories"."name"'), SortBy.ASC],

    // ordering for Task Attachments
    [Sequelize.col('"images"."created_at"'), SortBy.DESC],

    // Ordering for subtasks
    [
      Sequelize.literal(
        `CASE WHEN "subtasks"."status" = 'Completed' THEN 1 ELSE 0 END`,
      ),
      SortBy.DESC,
    ],
    [Sequelize.col('"subtasks"."completed_at"'), SortBy.ASC],
    [Sequelize.col('"subtasks"."deadline"'), SortBy.ASC],
  ].filter(Boolean);
};

export const taskListOrder = (
  sort_column: TaskSortingColumns,
  sort_by: SortBy,
): any => {
  const isNameSorting = sort_column === TaskSortingColumns.NAME;

  return [
    [Sequelize.col('"task_list_orders"."is_pinned"'), SortBy.DESC],

    // Task list order on the base of user list orders
    [Sequelize.col('"task_list_orders"."order"'), SortBy.ASC],

    [Sequelize.col('"TaskList.created_at"'), SortBy.ASC],

    // ordering for Task
    [Sequelize.literal('"tasks"."is_pinned"'), SortBy.DESC],

    // Flattened name sorting directly into the main array
    ...(isNameSorting
      ? [
          [
            Sequelize.literal(`
              CASE
                WHEN "tasks"."name" ~ '^[0-9]+' THEN regexp_replace("tasks"."name", '^(\\d+).*', '\\1')::int
                ELSE NULL
              END
           `),
            sort_by || SortBy.ASC,
          ],
          [
            Sequelize.literal(`
              regexp_replace(lower("tasks"."name"), '^\\d+', '', 'g')
            `),
            sort_by || SortBy.ASC,
          ],
        ]
      : []),

    sort_column === TaskSortingColumns.STATUS
      ? Task._taskStatusSequence
      : sort_column === TaskSortingColumns.DEPARTMENT
        ? [
            Sequelize.col('"tasks->event->departments"."name"'),
            sort_by || SortBy.DESC,
          ]
        : sort_column === TaskSortingColumns.INCIDENT_DIVISION
          ? [
              Sequelize.col('"tasks->event->incident_divisions"."name"'),
              sort_by || SortBy.DESC,
            ]
          : sort_column && sort_column !== TaskSortingColumns.NAME // Avoid including 'order' if sorting by name
            ? [{ model: Task, as: 'tasks' }, sort_column, sort_by || SortBy.ASC]
            : [{ model: Task, as: 'tasks' }, 'order', sort_by || SortBy.ASC],

    [Sequelize.col('"tasks"."created_at"'), SortBy.ASC],

    // Task Category Sorting
    [Sequelize.col('"tasks->task_categories"."name"'), SortBy.ASC],

    // Task Attachment Sorting
    [Sequelize.col('"tasks->images"."created_at"'), SortBy.DESC],

    // Ordering for subtasks
    [
      Sequelize.literal(
        `CASE WHEN "tasks->subtasks"."status" = 'Completed' THEN 1 ELSE 0 END`,
      ),
      SortBy.DESC,
    ],
    [Sequelize.col('"tasks->subtasks"."completed_at"'), SortBy.ASC],
    [Sequelize.col('"tasks->subtasks"."deadline"'), SortBy.ASC],
  ].filter(Boolean);
};
