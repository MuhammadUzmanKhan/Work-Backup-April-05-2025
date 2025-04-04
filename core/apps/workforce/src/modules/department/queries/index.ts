import { Sequelize } from 'sequelize';

export const getDepartmentStaffCount: any = (
  company_id: number,
  event_id: number,
  role_id: number,
  attribute_name?: string,
) => [
  Sequelize.literal(`(SELECT COUNT
  ( DISTINCT ( "User"."id" ) ) :: INTEGER AS "count" 
    FROM
    "users" AS "User"
    LEFT OUTER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
    AND "event_users"."event_id" = ${event_id}
    INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id" 
    AND "department"."id" = "Department"."id"
    INNER JOIN ( "event_departments" AS "department->events->EventDepartment" INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) ON "department"."id" = "department->events->EventDepartment"."department_id" 
    AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = ${event_id} ) 
    INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" 
    AND "ucr"."company_id" = ${company_id}
    AND ${generateRoleExclusionCase(role_id)})`),
  attribute_name ? attribute_name : 'staff_count',
];

export const getAvailableStaffCount: any = (
  company_id: number,
  event_id: number,
  role_id: number,
) => [
  Sequelize.literal(`(SELECT COUNT(DISTINCT "User"."id")::INTEGER 
    FROM "users" AS "User"
    LEFT OUTER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
    AND "event_users"."event_id" = ${event_id}
    INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id" 
    AND "department"."id" = "Department"."id"
    AND "User"."status" = 0
    INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" 
    AND "ucr"."company_id" = ${company_id}
    AND ${generateRoleExclusionCase(role_id)})`),
  'available_staff',
];

export const getActiveStaffCount: any = (
  company_id: number,
  event_id: number,
  role_id: number,
) => [
  Sequelize.literal(`(SELECT COUNT
    ( DISTINCT ( "User"."id" ) ) :: INTEGER AS "count" 
    FROM
    "users" AS "User"
    INNER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
    AND "event_users"."event_id" = ${event_id}
    INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id" 
    AND "department"."id" = "Department"."id"
    INNER JOIN ( "event_departments" AS "department->events->EventDepartment" INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) ON "department"."id" = "department->events->EventDepartment"."department_id" 
    AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = ${event_id} ) 
    INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" 
    AND "ucr"."company_id" = ${company_id}
    AND ${generateRoleExclusionCase(role_id)})`),
  'active_staff',
];

export const getStaffLocationExist: any = (event_id: number) => [
  Sequelize.literal(`(SELECT 
    EXISTS (
      SELECT 1 FROM "users"
      INNER JOIN "event_users" ON "event_users"."user_id" = "users"."id"
      INNER JOIN "events" ON "events"."deleted_at" IS NULL 
      AND "events"."id" = "event_users"."event_id"
      INNER JOIN "locations" ON "locations"."locationable_id" = "users"."id" 
      AND "locations"."locationable_type" = 'User'
      INNER JOIN "department_users" ON "users"."id" = "department_users"."user_id" 
      WHERE "department_users"."department_id" = "Department"."id" 
      AND "events"."id" = ${event_id} LIMIT 1 )
    )`),
  'staff_location_exist',
];

const generateRoleExclusionCase = (role_id: number) => {
  const condition = `CASE 
    WHEN ${role_id} = 30 THEN "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33)
    WHEN ${role_id} = 32 THEN "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33)
    WHEN ${role_id} = 33 THEN "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33)
    WHEN ${role_id} = 1 THEN "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33)
    WHEN ${role_id} = 2 THEN "ucr"."role_id" NOT IN (0, 28, 26, 2 ,27, 32, 33)
    WHEN ${role_id} = 26 THEN "ucr"."role_id" NOT IN (0, 28, 2, 26, 27, 32, 33)
    WHEN ${role_id} = 28 THEN "ucr"."role_id" NOT IN (0, 2, 28, 26, 27, 32, 33)
    WHEN ${role_id} = 0 THEN "ucr"."role_id" NOT IN (0, 2, 28, 26, 27, 32, 33)
    ELSE "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33)
    END`;
  return condition;
};
