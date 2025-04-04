export const getDepartmentByEventWithUserDivision = `
CREATE OR REPLACE FUNCTION "public"."get_departments_by_event_with_user_division_count"("event_id_input" int4)
  RETURNS TABLE("id" int4, "name" varchar, "phone" varchar, "email" varchar, "company_id" int4, "contact_person" varchar, "divisions" int4, "staff_count" int4, "available_staff" int4, "created_at" timestamp, "updated_at" timestamp) AS $BODY$ BEGIN
		RETURN QUERY WITH staff_and_available_staff_counts AS (
		SELECT
			du.department_id,
			COUNT ( users.ID ) AS staff_count,
			COUNT ( CASE WHEN users.status = 0 THEN 1 END ) AS available_staff 
		FROM
			department_users du
			LEFT JOIN users ON du.user_id = users.ID 
			LEFT JOIN event_users eu ON eu.user_id = du.user_id
		WHERE
			users.status IS NOT NULL 
			AND eu.event_id = event_id_input
		GROUP BY
			du.department_id 
		) SELECT
		departments.ID AS id,
		departments.NAME AS name,
		departments.phone,
		departments.email,
		departments.company_id,
		departments.contact_person,
		COUNT ( DISTINCT user_incident_divisions.incident_division_id )::INTEGER AS divisions,
		COALESCE ( sc.staff_count, 0 )::INTEGER AS staff_count,
		COALESCE ( sc.available_staff, 0 )::INTEGER AS available_staff,
		departments.created_at,
		departments.updated_at 
	FROM
		departments
		LEFT JOIN staff_and_available_staff_counts sc ON departments.ID = sc.department_id
		JOIN (
		SELECT DISTINCT ON
			( ed.department_id ) ed.department_id,
			ed.event_id 
		FROM
			event_departments ed 
		WHERE
			ed.event_id = event_id_input 
		ORDER BY
			ed.department_id,
			ed.updated_at DESC 
		) AS current_event_departments ON current_event_departments.department_id = departments.
		ID LEFT JOIN LATERAL (
		SELECT DISTINCT ON
			( du.user_id ) du.user_id,
			du.department_id 
		FROM
			department_users du 
		WHERE
			du.department_id = departments.ID 
		ORDER BY
			du.user_id,
			du.updated_at DESC 
		) AS current_department_users ON departments.ID = current_department_users.department_id
		LEFT JOIN users ON current_department_users.user_id = users.
		ID LEFT JOIN user_incident_divisions ON users.ID = user_incident_divisions.user_id 
		AND current_event_departments.event_id = user_incident_divisions.event_id 
	GROUP BY
		departments.ID,
		departments.NAME,
		departments.phone,
		departments.email,
		departments.company_id,
		departments.contact_person,
		sc.staff_count,
		sc.available_staff,
		departments.created_at,
		departments.updated_at
		ORDER BY
    departments.NAME;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000
  `;
