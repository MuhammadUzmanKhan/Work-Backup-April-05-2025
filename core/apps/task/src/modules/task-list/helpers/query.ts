import { User } from '@ontrack-tech-group/common/models';
import { Sequelize } from 'sequelize';

export const isListCreator = (userId: number): any => [
  Sequelize.literal(
    `CASE WHEN "TaskList"."created_by" = ${userId} THEN TRUE ELSE FALSE END`,
  ),
  'is_list_creator',
];

export const subtasksAssignees: any = (model: string) => [
  Sequelize.literal(`(
    COALESCE((
      SELECT ARRAY_AGG(jsonb_build_object(
        'assignee_name', assignee_name,
        'user_id', user_id,
        'department_id', department_id,
        'status', status
      ))::jsonb[] FROM (
        SELECT
          CASE
            WHEN "Subtask"."department_id" IS NOT NULL THEN "Department"."name"
            WHEN "UserTask"."user_id" IS NOT NULL THEN "User"."name"
          END AS assignee_name,
          "UserTask"."user_id" AS user_id,
          "Subtask"."status" AS status,
          "Subtask"."department_id" AS department_id
        FROM "tasks" AS "Subtask"
        LEFT JOIN "departments" AS "Department" ON "Subtask"."department_id" = "Department"."id"
        LEFT JOIN "user_tasks" AS "UserTask" ON "Subtask"."id" = "UserTask"."task_id"
        LEFT JOIN "users" AS "User" ON "UserTask"."user_id" = "User"."id"
        WHERE "Subtask"."parent_id" = "${model}"."id"
      ) AS sub
      WHERE assignee_name IS NOT NULL
    ), ARRAY[]::jsonb[])
  )`),
  'subtask_assignees',
];

export const _standaloneQuery: any = (user_id: number) => [
  Sequelize.literal(`(
      (
        "Task"."task_list_id" IS NOT NULL
        OR ("Task"."task_list_id" IS NULL AND "Task"."created_by" = ${user_id})
      )
  )`),
];

export const divisionRawInclude: any = (user_id: number) => [
  Sequelize.literal(`(
    "TaskList"."is_division_locked" = FALSE OR
    ("TaskList"."is_division_locked" = TRUE AND "TaskList"."created_by" = ${user_id}) OR
    ("TaskList"."is_division_locked" = TRUE AND "TaskList"."created_by" != ${user_id} AND
    ("tasks->incidentDivision->user_incident_divisions"."user_id" = ${user_id} 
     OR "tasks"."incident_division_id" IS NULL 
     OR "tasks->users->UserTask"."user_id" = ${user_id}
     OR "tasks->subtasks->users->UserTask"."user_id" = ${user_id})
  ))`),
];

export const _divisionRawInclude: any = (user_id: number) => [
  Sequelize.literal(`(
    ("Task"."task_list_id" IS NULL OR "task_list"."is_division_locked" = FALSE) OR
    ("task_list"."is_division_locked" = TRUE AND "task_list"."created_by" = ${user_id}) OR
    ("task_list"."is_division_locked" = TRUE AND "task_list"."created_by" != ${user_id} AND
    ("incidentDivision->user_incident_divisions"."user_id" = ${user_id} 
      OR "Task"."incident_division_id" IS NULL
      OR "users->UserTask"."user_id" = ${user_id}
      OR "subtasks->users->UserTask"."user_id" = ${user_id}) 
  ))`),
];

export const divisionRawIncludeInTask: any = (user_id: User) => [
  Sequelize.literal(`(
    ("Task"."task_list_id" IS NULL OR "task_list"."is_division_locked" = FALSE) OR
    ("task_list"."is_division_locked" = TRUE AND "task_list"."created_by" = ${user_id}) OR 
    ("task_list"."is_division_locked" = TRUE AND "task_list"."created_by" != ${user_id} AND 
    ("incidentDivision->user_incident_divisions"."user_id" = ${user_id} 
      OR "Task"."incident_division_id" IS NULL
      OR "users->UserTask"."user_id" = ${user_id}
      OR "subtasks->users->UserTask"."user_id" = ${user_id})  
  ))`),
];
