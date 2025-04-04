export const getAllPinnedEventsData = `
CREATE OR REPLACE FUNCTION get_all_pinned_events_data(userId integer, VARIADIC pinnedEventIds integer[])
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(json_data) INTO result
    FROM (
        SELECT
            (
                SELECT json_agg(json_build_object(
                    'incidentType', incident_type,
                    'count', incident_count
                ))
                FROM (
                    SELECT
                        incident_type,
                        COUNT(incident_type)::INTEGER AS incident_count
                    FROM incidents
                    WHERE incidents.event_id = pinned_id
                    GROUP BY incident_type
                    ORDER BY incident_count DESC
                    LIMIT 10
                ) AS incidentsByType
            ) AS incidentsByType,
                (
                SELECT json_agg(json_build_object(
                    'status', status_name,
                    'priority', priority_name,
                    'count', incident_count
                ))
                FROM (
                    SELECT
                        CASE 
                            WHEN priority = 0 THEN 'Low'
                            WHEN priority = 1 THEN 'Medium'
                            WHEN priority = 2 THEN 'High'
                            WHEN priority = 3 THEN 'Critical'
                            ELSE NULL
                        END AS priority_name,
                        CASE 
                            WHEN status = 0 THEN 'Open'
                            WHEN status = 1 THEN 'Dispatched'
                            WHEN status = 2 THEN 'Resolved'
                            WHEN status = 3 THEN 'Dispatched'
                            WHEN status = 4 THEN 'Follow Up'
                            WHEN status = 5 THEN 'Dispatched'
                            WHEN status = 6 THEN 'Dispatched'
                            WHEN status = 7 THEN 'Dispatched'
                            ELSE NULL
                        END AS status_name,
                        COUNT(*)::INTEGER AS incident_count
                    FROM incidents
                    WHERE incidents.event_id = pinned_id
                    GROUP BY status, priority
                    ORDER BY status ASC
                ) AS incidentsByPriority
              ) AS incidentsByPriority,
            (
                SELECT COUNT(*) FROM incidents WHERE incidents.event_id = pinned_id
            ) AS totalIncidents,
            (
                SELECT COUNT(*) FROM incidents WHERE incidents.event_id = pinned_id AND priority = 3 -- Assuming 'CRITICAL' is represented as 3
            ) AS criticalIncidents,
           (
                SELECT
                    AVG(EXTRACT(EPOCH FROM (
                        SELECT
                            CASE
                                WHEN "status_changes"."status" = 'resolved' THEN
                                    "status_changes"."created_at" - "Incidents"."created_at"
                            END
                        FROM
                            status_changes
                        WHERE
                            "Incidents"."id" = "status_changes"."status_changeable_id"
                            AND "status_changes"."status_changeable_type" = 'Incident'
                        ORDER BY
                            "status_changes"."created_at" DESC
                        LIMIT 1
                    ))) AS avgResolvedTime
                FROM
                    incidents AS "Incidents"
                LEFT JOIN
                    status_changes ON "Incidents"."id" = "status_changes"."status_changeable_id"
                WHERE
                    "Incidents"."event_id" = pinned_id
                    AND "Incidents"."status" = 2
            ) AS resolvedTime,
            (
                SELECT json_build_object(
                    'id', events.id,
                    'company_id', company_id,
                    'name', name,
                    'expected_attendance', expected_attendance,
                    'daily_attendance', daily_attendance,
                    'status', CASE 
        WHEN status IS NOT NULL THEN 
        CASE 
            WHEN status = 0 THEN 'on_hold'
            WHEN status = 1 THEN 'completed'
            WHEN status = 2 THEN 'in_progress'
            WHEN status = 3 THEN 'upcoming'
            ELSE NULL
          END
        ELSE NULL
      END,
                    'averageAttendance', CASE WHEN CAST(EXTRACT(DAY FROM AGE(public_end_date, public_start_date)) AS INTEGER) = 0 THEN 0 ELSE expected_attendance / CAST(EXTRACT(DAY FROM AGE(public_end_date, public_start_date)) AS INTEGER) END,
                    'order', user_pins.order
                )
                FROM events
                LEFT JOIN user_pins ON events.id = user_pins.pinable_id
                WHERE events.id = pinned_id AND pinable_type = 'DashboardEvent' AND user_pins.user_id = userId
                LIMIT 1
            ) AS singleEvent
        FROM unnest(pinnedEventIds) AS pinned_id
    ) AS json_data;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
`;
