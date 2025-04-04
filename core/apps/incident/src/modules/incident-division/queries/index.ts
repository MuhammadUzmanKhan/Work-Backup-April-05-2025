import { Sequelize } from 'sequelize';

export const getDivisionStaffCount: any = (
  companyId: number,
  event_id: number,
  role_id: number,
) => [
  Sequelize.literal(
    `(SELECT COUNT
      ( DISTINCT ( "User"."id" ) ) ::integer AS "count" 
      FROM
      "users" AS "User"
      LEFT OUTER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
      AND "event_users"."event_id" = ${event_id}
      INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id"
      INNER JOIN ( "event_departments" AS "department->events->EventDepartment" INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) ON "department"."id" = "department->events->EventDepartment"."department_id" 
      AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = ${event_id} )
      INNER JOIN "user_incident_divisions" AS "user_incident_divisions" ON "User"."id" = "user_incident_divisions"."user_id" 
      AND "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" 
      LEFT OUTER JOIN "incident_divisions" AS "user_incident_divisions->incident_division" ON "user_incident_divisions"."incident_division_id" = "user_incident_divisions->incident_division"."id" 
      INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${companyId}
      AND ${generateRoleExclusionCase(role_id)})`,
  ),
  'staff_count',
];

export const divisionAllStaffCount: any = (
  companyId: number,
  role_id: number,
) => [
  Sequelize.literal(
    `(SELECT COUNT
      ( DISTINCT ( "User"."id" ) ) ::integer AS "count" 
      FROM
      "users" AS "User"
      INNER JOIN ( "department_users" AS "department->DepartmentUsers"
      INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" )
      ON "User"."id" = "department->DepartmentUsers"."user_id"
      INNER JOIN "user_incident_divisions" AS "user_incident_divisions" ON "User"."id" = "user_incident_divisions"."user_id" 
      AND "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" 
      LEFT OUTER JOIN "incident_divisions" AS "user_incident_divisions->incident_division"
      ON "user_incident_divisions"."incident_division_id" = "user_incident_divisions->incident_division"."id"
      INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${companyId}
      AND ${generateRoleExclusionCase(role_id)})`,
  ),
  'division_staff_count',
];

export const getDivisionActiveStaffCount: any = (
  companyId: number,
  event_id: number,
  role_id: number,
) => [
  Sequelize.literal(
    `(SELECT COUNT
      ( DISTINCT ( "User"."id" ) ) ::integer AS "count" 
      FROM
      "users" AS "User"
      INNER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
      AND "event_users"."event_id" = ${event_id}
      INNER JOIN ( "department_users" AS "department->DepartmentUsers" 
      INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) 
      ON "User"."id" = "department->DepartmentUsers"."user_id"
      INNER JOIN ( "event_departments" AS "department->events->EventDepartment" 
      INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) 
      ON "department"."id" = "department->events->EventDepartment"."department_id" 
      AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = ${event_id} )
      INNER JOIN "user_incident_divisions" AS "user_incident_divisions" ON "User"."id" = "user_incident_divisions"."user_id" 
      AND "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" 
      LEFT OUTER JOIN "incident_divisions" AS "user_incident_divisions->incident_division" ON "user_incident_divisions"."incident_division_id" = "user_incident_divisions->incident_division"."id" 
      INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${companyId}
      AND ${generateRoleExclusionCase(role_id)})`,
  ),
  'active_staff',
];

export const getDepartmentCount: any = (
  company_id: number,
  event_id: number,
  role_id: number,
) => [
  Sequelize.literal(
    `(SELECT COUNT( DISTINCT ("department_users"."department_id") ):: integer AS "count"
        FROM "user_incident_divisions"
        INNER JOIN users ON "user_incident_divisions"."user_id" = "users"."id"
        INNER JOIN "department_users" ON "users"."id" = "department_users"."user_id"
        INNER JOIN "departments" ON "department_users"."department_id" = "departments"."id" AND "departments"."company_id" = ${company_id}
        INNER JOIN "users_companies_roles" AS "ucr" ON "users"."id" = "ucr"."user_id"
        AND ${generateRoleExclusionCase(role_id)}
        WHERE "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" 
        AND "user_incident_divisions"."event_id" = ${event_id}
        AND "ucr"."company_id" = ${company_id})`,
  ),
  'department_count',
];

export const getLinkedIncidentCount: any = (event_id: number) => [
  Sequelize.literal(`(
      SELECT COUNT ("incidents"."id")::INTEGER FROM incident_multiple_divisions
      INNER JOIN incidents ON incident_multiple_divisions.incident_id = incidents.id
      WHERE incident_multiple_divisions.incident_division_id = "IncidentDivision"."id" AND incidents.event_id = ${event_id}
    )`),
  'incidents_count',
];

export const generateRoleExclusionCase = (role_id: number) => {
  const condition = `CASE 
      WHEN ${role_id} = 0 THEN "ucr"."role_id" NOT IN (0, 2, 28, 26, 27, 32, 33, 36)
      WHEN ${role_id} = 1 THEN "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33, 36)
      WHEN ${role_id} = 2 THEN "ucr"."role_id" NOT IN (0, 28, 26, 2, 27, 32, 33, 36)
      WHEN ${role_id} = 26 THEN "ucr"."role_id" NOT IN (0, 28, 2, 26, 27, 32, 33, 36)
      WHEN ${role_id} = 27 THEN "ucr"."role_id" NOT IN (0, 28, 2, 26, 27, 32, 33, 36)
      WHEN ${role_id} = 28 THEN "ucr"."role_id" NOT IN (0, 2, 28, 26, 27, 32, 33, 36)
      WHEN ${role_id} = 30 THEN "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33, 36)
      WHEN ${role_id} = 32 THEN "ucr"."role_id" NOT IN (0, 2, 28, 26, 27, 33, 36)
      WHEN ${role_id} = 33 THEN "ucr"."role_id" NOT IN (0, 28, 26, 27, 2, 32, 33, 36)
      ELSE ( "ucr"."role_id" NOT IN ( 0, 28, 26, 27, 2, 32, 33, 36))
    END`;
  return condition;
};

export const unavailableStaffCount = (eventId: number, companyId: number) => [
  Sequelize.literal(`(
    SELECT COUNT(DISTINCT "User"."id")::integer
    FROM "users" AS "User"
    INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${companyId}
    INNER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id"
    AND "event_users"."event_id" = ${eventId}
    INNER JOIN "department_users" AS "department->DepartmentUsers" 
      INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" 
      ON "User"."id" = "department->DepartmentUsers"."user_id"
    INNER JOIN "event_departments" AS "department->events->EventDepartment" 
      INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" 
      ON "department"."id" = "department->events->EventDepartment"."department_id" 
      AND ("department->events"."deleted_at" IS NULL AND "department->events"."id" = ${eventId})
    WHERE ("ucr"."role_id" NOT IN (0, 2, 28))
      ) -
      (
        SELECT COUNT(DISTINCT "user_incident_divisions"."id")::integer
        FROM "user_incident_divisions" 
        WHERE "user_incident_divisions"."event_id" = ${eventId}
        AND "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id"
      )
  
  `),
  'unavailable_staff_count',
];

export const availableStaffCount = (
  eventId: number,
  companyId: number,
  roleId: number,
) => [
  Sequelize.literal(`(SELECT COUNT
    ( DISTINCT ( "User"."id" ) ) ::integer AS "count" 
    FROM
    "users" AS "User"
    LEFT OUTER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
    AND "event_users"."event_id" = ${eventId}
    INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id"
    INNER JOIN ( "event_departments" AS "department->events->EventDepartment" INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) ON "department"."id" = "department->events->EventDepartment"."department_id" 
    AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = ${eventId} )
    INNER JOIN "user_incident_divisions" AS "user_incident_divisions" ON "User"."id" = "user_incident_divisions"."user_id" 
    AND "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" 
    AND "user_incident_divisions"."event_id" = ${eventId}
    LEFT OUTER JOIN "incident_divisions" AS "user_incident_divisions->incident_division" ON "user_incident_divisions"."incident_division_id" = "user_incident_divisions->incident_division"."id" 
    INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${companyId}
    AND ${generateRoleExclusionCase(roleId)})`),
  'available_staff_count',
];

export const totalStaffCount = (eventId: number, companyId: number) => [
  Sequelize.literal(
    `(SELECT COUNT
        ( DISTINCT ( "User"."id" ) ) ::integer AS "count" 
      FROM
        "users" AS "User"
        INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" AND "ucr"."company_id" = ${companyId}
        INNER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
        AND "event_users"."event_id" = ${eventId}
        INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id"
        INNER JOIN ( "event_departments" AS "department->events->EventDepartment" INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) ON "department"."id" = "department->events->EventDepartment"."department_id" 
        AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = ${eventId} )
        WHERE
        ( "ucr"."role_id" NOT IN ( 0, 2, 28 ) ))`,
  ),
  'total_staff_count',
];

export const departmentsCount = (eventId: number) => [
  Sequelize.literal(
    `(SELECT COUNT(DISTINCT department_id)::integer FROM "user_incident_divisions" 
        LEFT OUTER JOIN "users" ON "user_incident_divisions"."user_id" = "users"."id" LEFT OUTER JOIN "department_users" ON "users"."id" = "department_users"."user_id"
        WHERE "user_incident_divisions"."incident_division_id" = "IncidentDivision"."id" AND "user_incident_divisions"."event_id" = ${eventId})`,
  ),
  'departments_count',
];

export const eventsCount = Sequelize.literal(`(
    SELECT COUNT(*)::INTEGER FROM "events"
    INNER JOIN "event_incident_divisions" ON "events"."id" = "event_incident_divisions"."event_id"
    WHERE "events"."deleted_at" IS NULL AND "event_incident_divisions"."incident_division_id" = "IncidentDivision"."id"
  )`);

export const isAssigned = (eventId: number) =>
  Sequelize.literal(`EXISTS (
    SELECT 1 FROM "event_incident_divisions"
    WHERE "event_incident_divisions"."incident_division_id" = "IncidentDivision"."id" 
    AND "event_incident_divisions"."event_id" = ${eventId}
  )`);

export const incidentsCount = (eventId: number) =>
  Sequelize.literal(`(
    SELECT COUNT ("incidents"."id")::INTEGER FROM incident_multiple_divisions
    INNER JOIN incidents ON incident_multiple_divisions.incident_id = incidents.id
    WHERE incident_multiple_divisions.incident_division_id = "IncidentDivision"."id" AND incidents.event_id = ${eventId}
  )`);
