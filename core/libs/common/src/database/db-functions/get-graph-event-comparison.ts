export const getEventGraphComparison = `CREATE OR REPLACE FUNCTION get_incidents_by_event_and_hour(
  first_event_id integer,
  second_event_id integer,
  hour_difference integer
)
  RETURNS jsonb
  LANGUAGE plpgsql
  AS $$
  DECLARE
    event_record record;
    incident_record record;
    max_hour integer := 0;
    incidentsByEventAndHour jsonb := '{}';
  BEGIN
    -- Find the maximum hour among all incidents for the given events
    SELECT INTO max_hour max(EXTRACT(EPOCH FROM (i.created_at - e.min_incident_time)) / 3600)
    FROM (
      SELECT id, (
          SELECT MIN(i.created_at)
          FROM incidents i
          INNER JOIN incident_types it ON i.incident_type_id = it.id
          WHERE it.is_test = FALSE AND i.event_id = e.id
        ) AS min_incident_time
      FROM events e
      WHERE e.id IN (first_event_id, second_event_id)
        AND (e.demo_event IS NULL OR e.demo_event = FALSE)
    ) e
    LEFT JOIN incidents i ON e.id = i.event_id;

    FOR event_record IN (
      SELECT
        e.id AS event_id,
        e.min_incident_time AS min_incident_time
      FROM (
        SELECT id, (
            SELECT MIN(i.created_at)
            FROM incidents i
            INNER JOIN incident_types it ON i.incident_type_id = it.id
            WHERE it.is_test = FALSE AND i.event_id = e.id
          ) AS min_incident_time
        FROM events e
        WHERE e.id IN (first_event_id, second_event_id)
          AND (e.demo_event IS NULL OR e.demo_event = FALSE)
      ) e
    ) LOOP
      DECLARE
        incidentsByHour jsonb := '{}';
      BEGIN
        FOR incident_record IN (
          SELECT
            i.id AS id,
            i.created_at AS created_at,
            i.description AS description,
            i.incident_type AS incident_type
          FROM incidents i
          INNER JOIN incident_types it ON i.incident_type_id = it.id
          WHERE it.is_test = FALSE AND i.event_id = event_record.event_id
          ORDER BY i.created_at ASC
        ) LOOP
          DECLARE
            incidentTime timestamp := incident_record.created_at;
            minIncidentTime timestamp := event_record.min_incident_time;
            hoursDiff integer := EXTRACT(EPOCH FROM (incidentTime - minIncidentTime)) / 3600;
            chunkStart integer := (hoursDiff / hour_difference)::integer * hour_difference;
          BEGIN
            IF NOT incidentsByHour ? chunkStart::text THEN
              incidentsByHour = incidentsByHour || jsonb_build_object(chunkStart::text, jsonb '[]');
            END IF;

            incidentsByHour = jsonb_set(incidentsByHour, array[chunkStart::text], (incidentsByHour->chunkStart::text || jsonb_build_array(incident_record))::jsonb);
          END;
        END LOOP;

        -- Fill in empty arrays for hours without incidents
        FOR i IN 0..max_hour/hour_difference LOOP
          IF NOT incidentsByHour ? (i * hour_difference)::text THEN
            incidentsByHour = incidentsByHour || jsonb_build_object((i * hour_difference)::text, jsonb '[]');
          END IF;
        END LOOP;

        incidentsByEventAndHour = jsonb_set(incidentsByEventAndHour, array[event_record.event_id::text], incidentsByHour);
      END;
    END LOOP;

    RETURN incidentsByEventAndHour;
  END;
  $$;
`;
