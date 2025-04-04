export const getComparisonEventsLineGraphDays = `CREATE OR REPLACE FUNCTION get_comparison_events_line_graph_days(
  IN hour_difference integer,
  IN event_ids integer[],
  IN incident_ids integer[]
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  max_days integer := 0;
  max_hour integer := 0;
  event_record record;
  incident_record record;
  incidentsByEventAndHour jsonb := '{}';
BEGIN
  -- Step 1: Calculate max days and max hour
  SELECT INTO max_days MAX(EXTRACT(DAY FROM (public_end_date - public_start_date)))
  FROM events
  WHERE id = ANY(event_ids);

  max_hour := max_days * 24;
  max_hour := CEIL(max_hour / hour_difference) * hour_difference;

  -- Step 2: Prepare incidentsByEventAndHour JSONB object
  FOR event_record IN (SELECT id, public_start_date, public_end_date FROM events WHERE id = ANY(event_ids)) LOOP
    incidentsByEventAndHour := jsonb_set(
      incidentsByEventAndHour,
      ARRAY[event_record.id::text],
      jsonb_object_agg(seq, '[]'::jsonb)
    )
    FROM generate_series(0, max_hour + hour_difference, hour_difference) AS seq;

    FOR incident_record IN (
      SELECT id, created_at
      FROM incidents
      WHERE 
        event_id = event_record.id 
        AND id = ANY(incident_ids)
        AND created_at >= event_record.public_start_date
        AND created_at <= event_record.public_end_date
    ) LOOP
      DECLARE
        hours_diff integer := EXTRACT(EPOCH FROM (incident_record.created_at - event_record.public_start_date)) / 3600;
        corrected_interval integer := (hours_diff / hour_difference)::int * hour_difference;
      BEGIN
        incidentsByEventAndHour := jsonb_set(
          incidentsByEventAndHour,
          ARRAY[event_record.id::text, corrected_interval::text],
          COALESCE(incidentsByEventAndHour->event_record.id::text->>corrected_interval::text, '[]')::jsonb || jsonb_build_array(incident_record),
          true
        );
      END;
    END LOOP;
  END LOOP;

  RETURN incidentsByEventAndHour;
END;
$$;
`;
