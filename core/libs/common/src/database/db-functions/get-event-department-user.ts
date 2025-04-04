export const getEventDepartmentStaff = `
CREATE OR REPLACE FUNCTION "public"."geteventdepartmentstaff"("param_event_id" int4, "param_department_id" int4)
  RETURNS "pg_catalog"."varchar" AS $BODY$
	BEGIN
  RETURN (SELECT COUNT
	( DISTINCT ( "User"."id" ) ) :: INTEGER AS "count" 
	FROM
		"users" AS "User"
		LEFT OUTER JOIN "event_users" AS "event_users" ON "User"."id" = "event_users"."user_id" 
		AND "event_users"."event_id" = param_event_id
		INNER JOIN ( "department_users" AS "department->DepartmentUsers" INNER JOIN "departments" AS "department" ON "department"."id" = "department->DepartmentUsers"."department_id" ) ON "User"."id" = "department->DepartmentUsers"."user_id" 
		AND "department"."id" = param_department_id
		INNER JOIN ( "event_departments" AS "department->events->EventDepartment" INNER JOIN "events" AS "department->events" ON "department->events"."id" = "department->events->EventDepartment"."event_id" ) ON "department"."id" = "department->events->EventDepartment"."department_id" 
		AND ( "department->events"."deleted_at" IS NULL AND "department->events"."id" = param_event_id ) 
		INNER JOIN "users_companies_roles" AS "ucr" ON "User"."id" = "ucr"."user_id" 
		AND "department"."company_id" = "ucr"."company_id" 
		WHERE
		( "ucr"."role_id" NOT IN ( 0, 2, 28 ) )
);
END
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  `;
