import { Sequelize } from 'sequelize';

export const isListDivisionLocked: any = [
  Sequelize.literal(`(
    SELECT "is_division_locked" FROM "task_lists"
    WHERE "task_lists"."id" = "Task"."task_list_id"
  )`),
  'is_division_locked',
];

export const isListDateLocked: any = [
  Sequelize.literal(`(
    SELECT "is_date_locked" FROM "task_lists"
    WHERE "task_lists"."id" = "Task"."task_list_id"
  )`),
  'is_date_locked',
];
