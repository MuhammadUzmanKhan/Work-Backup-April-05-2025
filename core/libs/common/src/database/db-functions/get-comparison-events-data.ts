export const getComparisonEventsData = `
CREATE OR REPLACE FUNCTION get_graph_comparison_events_data(VARIADIC eventIds integer[])
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
                    WHERE incidents.event_id = eventId
                    GROUP BY incident_type
                    ORDER BY incident_count DESC
                    LIMIT 3
                ) AS incidentsByType
            ) AS incidentsByType,
            (
                SELECT COUNT(*) FROM incidents WHERE incidents.event_id = eventId
            ) AS totalIncidents,
            (
                SELECT COUNT(*) FROM incidents WHERE incidents.event_id = eventId AND priority = 3
            ) AS criticalIncidents,
            (
                SELECT json_build_object(
                    'id', events.id,
                    'company_id', company_id,
                    'name', name,
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
                            END
                )
                FROM events WHERE events.id = eventId
                LIMIT 1
            ) AS singleEvent
        FROM unnest(eventIds) AS eventId
    ) AS json_data;

    RETURN result;
END;
$$ LANGUAGE plpgsql;
`;
