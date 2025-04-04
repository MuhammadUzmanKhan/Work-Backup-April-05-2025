export const getIncidentResolvedTime = `
CREATE OR REPLACE FUNCTION get_incident_avg_resolved_time(
    eventId INT,
    incident_ids INT[]
) RETURNS JSONB AS $$
DECLARE
    incident_id INT;
    open_time TIMESTAMP;
    resolved_time TIMESTAMP;
    total_resolved_seconds INT := 0;
    count_incidents_with_resolved INT := 0;
    avg_days INT;
    avg_hours TEXT;
    avg_minutes TEXT;
    last_status TEXT;
    avg_seconds INT;
    result JSONB;
BEGIN
    result := '{}';

    FOR i IN 1..array_length(incident_ids, 1)
    LOOP
        SELECT created_at INTO open_time
        FROM status_changes
        WHERE status_changeable_type = 'Incident'
          AND status_changeable_id = incident_ids[i]
        ORDER BY created_at ASC
        LIMIT 1;
    
        SELECT status, created_at INTO last_status, resolved_time
        FROM status_changes
        WHERE status_changeable_type = 'Incident'
          AND status_changeable_id = incident_ids[i]
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
        avg_seconds := total_resolved_seconds / count_incidents_with_resolved;

        avg_days := avg_seconds / 86400;
        avg_seconds := avg_seconds % 86400;

        avg_hours := avg_seconds / 3600;
        avg_hours := (avg_hours::INTEGER + (avg_days * 24))::TEXT;

        IF LENGTH(avg_hours) = 1 THEN
            avg_hours := '0' || avg_hours;
        END IF;

        avg_minutes := (avg_seconds % 3600 / 60)::TEXT;
        IF LENGTH(avg_minutes) = 1 THEN
            avg_minutes := '0' || avg_minutes;
        END IF;

        result := jsonb_build_object('avg_resolved_time', avg_hours || ':' || avg_minutes || '');
    ELSE
        result := jsonb_build_object('avg_resolved_time', '00:00');
    END IF;

    RETURN result;
END;
$$ LANGUAGE PLPGSQL;

`;
