import { Sequelize } from 'sequelize';
import { User } from '@ontrack-tech-group/common/models';
import {
  isLowerRoleIncludingOperationManager,
  isWithRestrictedVisibility,
  notUpperRole,
} from '@ontrack-tech-group/common/constants';

export const _divisionRawIncludeInTask: any = (
  user_id: number,
) => `("Task"."task_list_id" IS NULL OR "task_list"."is_division_locked" = FALSE) OR
  ("task_list"."is_division_locked" = TRUE AND "task_list"."created_by" = ${user_id}) OR 
  ("task_list"."is_division_locked" = TRUE AND "task_list"."created_by" != ${user_id} AND 
  ("incidentDivision->user_incident_divisions"."user_id" = ${user_id} 
    OR "Task"."incident_division_id" IS NULL 
    OR "users->UserTask"."user_id" = ${user_id}
    OR "subtasks->users->UserTask"."user_id" = ${user_id}))`;

export const standaloneQuery: any = (user_id: number) => [
  Sequelize.literal(`(
  (
    "Task"."task_list_id" IS NOT NULL
    OR ("Task"."task_list_id" IS NULL AND "Task"."created_by" = ${user_id})
  )
  )`),
];

export const divisionRawIncludeLiteral: any = (userId: number) => [
  Sequelize.literal(divisionRawInclude(userId)),
];

export const divisionlockWithRestrictedVisibilityLiteral: any = (
  userId: number,
) => [Sequelize.literal(divisionlockWithRestrictedVisibility(userId))];

// This division lock raw query is for incidents
export const divisionRawInclude: any = (userId: number) =>
  `(
    "event"."division_lock_service" = FALSE OR
    ("event"."division_lock_service" = TRUE AND "Incident"."created_by" = ${userId}) OR
    ("event"."division_lock_service" = TRUE AND "Incident"."created_by" != ${userId} AND
    ("incident_divisions->user_incident_divisions"."user_id" = ${userId} 
     OR "incident_divisions->IncidentMultipleDivision" IS NULL 
     OR "users"."id" = ${userId})
  ))`;

// This division lock with restricted visibility raw query is for incidents
export const divisionlockWithRestrictedVisibility: any = (userId: number) =>
  `(
    "Incident"."created_by" = ${userId} OR
    ("event"."division_lock_service" = TRUE AND "Incident"."created_by" != ${userId} AND
    "users"."id" = ${userId})
  )`;

export const moduleCounts: any = (user: User) => {
  let query = null;
  let incidentCountQuery = null;

  if (notUpperRole(user['role'])) {
    query = _divisionRawIncludeInTask(user.id);
  }

  // This division lock and restricted visibility based on user role and same as implemented in incident module
  if (isLowerRoleIncludingOperationManager(+user['role'])) {
    if (isWithRestrictedVisibility(+user['role'])) {
      incidentCountQuery = divisionlockWithRestrictedVisibility(user.id);
    } else {
      incidentCountQuery = divisionRawInclude(user.id);
    }
  }

  return [
    Sequelize.literal(`(
      SELECT json_build_object(
        'incident_future', (
          SELECT COUNT(DISTINCT("Incident"."id")) FROM "incidents" AS "Incident"
          LEFT OUTER JOIN "events" AS "event" ON "Incident"."event_id" = "event"."id" AND ( "event"."deleted_at" IS NULL )
          LEFT OUTER JOIN ( "incident_multiple_divisions" AS "incident_divisions->IncidentMultipleDivision" INNER JOIN "incident_divisions" AS "incident_divisions" ON "incident_divisions"."id" = "incident_divisions->IncidentMultipleDivision"."incident_division_id" ) ON "Incident"."id" = "incident_divisions->IncidentMultipleDivision"."incident_id"
          LEFT OUTER JOIN "user_incident_divisions" AS "incident_divisions->user_incident_divisions" ON "incident_divisions"."id" = "incident_divisions->user_incident_divisions"."incident_division_id"  
          LEFT OUTER JOIN ( "incident_department_users" AS "users->IncidentDepartmentUsers" INNER JOIN "users" AS "users" ON "users"."id" = "users->IncidentDepartmentUsers"."user_id" ) ON "Incident"."id" = "users->IncidentDepartmentUsers"."incident_id" 
          WHERE "Incident"."event_id" = "Event"."id" ${incidentCountQuery ? `AND (${incidentCountQuery})` : ''}
        ),
        'task_future', (
          SELECT count(DISTINCT("Task"."id")) AS "count" FROM "tasks" AS "Task"
          LEFT OUTER JOIN "task_lists" AS "task_list" ON "Task"."task_list_id" = "task_list"."id" 
          LEFT OUTER JOIN "incident_divisions" AS "incidentDivision" ON "Task"."incident_division_id" = "incidentDivision"."id" 
          LEFT OUTER JOIN "user_incident_divisions" AS "incidentDivision->user_incident_divisions" ON "incidentDivision"."id" = "incidentDivision->user_incident_divisions"."incident_division_id" 
          LEFT OUTER JOIN ( "user_tasks" AS "users->UserTask" INNER JOIN "users" AS "users" ON "users"."id" = "users->UserTask"."user_id") ON "Task"."id" = "users->UserTask"."task_id"
          LEFT OUTER JOIN "tasks" AS "subtasks" ON "Task"."id" = "subtasks"."parent_id"
          LEFT OUTER JOIN ( "user_tasks" AS "subtasks->users->UserTask" INNER JOIN "users" AS "subtasks->users" ON "subtasks->users"."id" = "subtasks->users->UserTask"."user_id") ON "subtasks"."id" = "subtasks->users->UserTask"."task_id"
          WHERE "Event"."id" = "Task"."event_id" AND "Task"."parent_id" IS NULL
          AND (
            "Task"."task_list_id" IS NOT NULL
            OR ("Task"."task_list_id" IS NULL AND "Task"."created_by" = ${user.id})
          )
          ${query ? `AND (${query})` : ''}
          ),
        'dot_map_service_v2',(
          SELECT COUNT(DISTINCT("DotMapDot"."id")) FROM "dotmap"."dots" AS "DotMapDot"
          WHERE "DotMapDot"."event_id" = "Event"."id" AND "DotMapDot"."placed" = true AND "DotMapDot"."deleted_at" IS NULL)
      ) AS "module_counts"
    )`),
    'module_counts',
  ];
};

export const isEventCads: any = [
  Sequelize.literal(`EXISTS (
      SELECT 1 FROM "event_cads" 
      WHERE "event_cads"."event_id" = "Event"."id"
    )`),
  'isEventCads',
];

export const eventCadsCount: any = [
  Sequelize.literal(`(
    SELECT COUNT( "event_cads"."id" )::INTEGER FROM "event_cads"
    WHERE "event_cads"."event_id" = "Event"."id"
  )`),
  'eventCadsCount',
];

export const isCads: any = [
  Sequelize.literal(`EXISTS (
    SELECT 1 FROM "cads" 
    WHERE "cads"."event_id" = "Event"."id"
  )`),
  'isCads',
];

export const isPinnedIncidentTypes: any = [
  Sequelize.literal(`EXISTS (
      SELECT 1 FROM "incident_types" 
     INNER JOIN "event_incident_types" ON 
      "event_incident_types"."event_id" = "Event"."id" 
      AND "event_incident_types"."incident_type_id" = "incident_types"."id"
      WHERE "incident_types"."pinned" = true
    )`),
  'isPinnedIncidentTypes',
];

export const pinnedIncidentTypesCount: any = [
  Sequelize.literal(`(
      SELECT COUNT(*)::INTEGER FROM "incident_types" 
      INNER JOIN "event_incident_types" ON 
      "event_incident_types"."event_id" = "Event"."id" 
      AND "event_incident_types"."incident_type_id" = "incident_types"."id"
      WHERE "incident_types"."pinned" = true
    )`),
  'pinnedIncidentTypesCount',
];

export const divisionRawIncludeInTask: any = (user_id: number) => [
  Sequelize.literal(`(
    ${_divisionRawIncludeInTask(user_id)}
  )`),
];
