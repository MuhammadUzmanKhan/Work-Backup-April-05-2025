export const getIncidentDivisionResolvedTime = `
CREATE OR REPLACE FUNCTION get_incident_divisions_avg_resolved_time(
    eventId INT,
    incident_divisions_ids INT[]
) RETURNS JSONB AS $$
DECLARE
    incident_id INT;
    open_time TIMESTAMP;
    resolved_time TIMESTAMP;
    total_resolved_seconds INT;
    count_incidents_with_resolved INT;
    avg_days INT;
    avg_hours TEXT;
    avg_minutes TEXT;
    last_status TEXT;
    avg_seconds INT;
    result JSONB;
BEGIN
    result := '{}';

    FOR i IN 1..array_length(incident_divisions_ids, 1)
    LOOP
        total_resolved_seconds := 0;
        count_incidents_with_resolved := 0;

        FOR incident_id IN
            SELECT incidents.id
            FROM incidents INNER JOIN incident_multiple_divisions ON incidents.id = incident_multiple_divisions.incident_id
            WHERE incidents.event_id = eventId
              AND incident_multiple_divisions.incident_division_id = incident_divisions_ids[i]
        LOOP
            SELECT created_at INTO open_time
            FROM status_changes
            WHERE status_changeable_type = 'Incident'
                AND status_changeable_id = incident_id
            ORDER BY created_at ASC
            LIMIT 1;

            SELECT status, created_at INTO last_status, resolved_time
            FROM status_changes
            WHERE status_changeable_type = 'Incident'
                AND status_changeable_id = incident_id
            ORDER BY created_at DESC
            LIMIT 1;

            IF last_status IN ('resolved', 'follow_up') THEN
                IF open_time IS NOT NULL AND resolved_time IS NOT NULL THEN
                    total_resolved_seconds := total_resolved_seconds + EXTRACT(EPOCH FROM (resolved_time - open_time));
                    count_incidents_with_resolved := count_incidents_with_resolved + 1;
                END IF;
            ELSE
                total_resolved_seconds := total_resolved_seconds + 0;
                count_incidents_with_resolved := count_incidents_with_resolved + 1;
            END IF;
        END LOOP;

        IF count_incidents_with_resolved > 0 THEN
            total_resolved_seconds := total_resolved_seconds / count_incidents_with_resolved;

            avg_days := total_resolved_seconds / 86400;
            total_resolved_seconds := total_resolved_seconds % 86400;

            avg_hours := total_resolved_seconds / 3600;
            avg_hours := (avg_hours::INTEGER + (avg_days * 24))::TEXT;

            IF LENGTH(avg_hours) = 1 THEN
                avg_hours := '0' || avg_hours;
            END IF;

            avg_minutes := (total_resolved_seconds % 3600 / 60)::TEXT;
            IF LENGTH(avg_minutes) = 1 THEN
                avg_minutes := '0' || avg_minutes;
            END IF;

            result := jsonb_set(result, ARRAY[incident_divisions_ids[i]::TEXT], jsonb_build_object('avg_resolved_time', avg_hours || ':' || avg_minutes || ''));
        ELSE
            result := jsonb_set(result, ARRAY[incident_divisions_ids[i]::TEXT], jsonb_build_object('avg_resolved_time', '00:00' || ''));
        END IF;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE PLPGSQL;
`;
