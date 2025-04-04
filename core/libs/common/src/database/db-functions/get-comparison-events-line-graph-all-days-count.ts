export const getComparisonEventsLineGraphAllDaysCount = `CREATE OR REPLACE FUNCTION get_comparison_events_line_graph_all_days_count(
  v_day integer,
  event_ids integer[],
  incident_ids integer[]
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  response jsonb;
  eventsDetail jsonb := '{}';
  incidentsByHour jsonb := '{}';
  event_record record;
  hour_val integer;
  maxDays integer;
  incident_count integer;
  hour_data jsonb;
  final_hour_data jsonb := '[]';
  hour_values integer[] := ARRAY[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4,5];
  currentDay date;

BEGIN
  FOR event_record IN (SELECT id, name, public_start_date, public_end_date FROM events WHERE id = ANY(event_ids)) LOOP
    hour_data := '[]'::jsonb; -- Initialize an empty JSON array for each event_id

    -- Replace time component of public_end_date with '23:59:59'
    event_record.public_end_date := event_record.public_end_date::date + '23:59:59'::time;

    -- Check if v_day is within the valid range
    IF v_day IS NOT NULL AND v_day > 0 AND v_day <= EXTRACT(DAY FROM (event_record.public_end_date - event_record.public_start_date)) + 1 THEN
      currentDay := event_record.public_start_date + ((v_day::integer - 1) * INTERVAL '1 day');
    ELSE
      -- If v_day is not within the valid range, return null
      currentDay := null;
    END IF;

    -- Add event details to the response
    eventsDetail := eventsDetail || jsonb_build_object(event_record.id::text, jsonb_build_object(
      'public_start_date', event_record.public_start_date,
      'public_end_date', event_record.public_end_date,
      'name', event_record.name,
      'filtered_day', currentDay
    ));


    IF v_day IS NULL THEN
      FOREACH hour_val IN ARRAY hour_values LOOP
        incident_count := 0;

        SELECT COALESCE(COUNT(*), 0)
        INTO incident_count
        FROM incidents
        WHERE event_id = event_record.id
          AND id = ANY(incident_ids)
          AND EXTRACT(HOUR FROM created_at) = hour_val
          AND created_at >= event_record.public_start_date
          AND created_at <= event_record.public_end_date;

        hour_data := hour_data || jsonb_build_array(jsonb_build_array(
          CASE WHEN hour_val = 0 THEN '12:00 AM' 
               WHEN hour_val < 12 THEN LPAD(hour_val::text, 2, '0') || ':00 AM' 
               WHEN hour_val = 12 THEN '12:00 PM' 
               ELSE LPAD((hour_val % 12)::text, 2, '0') || ':00 PM' END, incident_count));
      END LOOP;
    ELSE
      FOREACH hour_val IN ARRAY hour_values LOOP
        incident_count := 0;

        SELECT COALESCE(COUNT(*), 0)
        INTO incident_count
        FROM incidents
        WHERE event_id = event_record.id
          AND id = ANY(incident_ids)
          AND EXTRACT(HOUR FROM created_at) = hour_val
          AND DATE_TRUNC('day', created_at) = event_record.public_start_date + ((v_day::integer - 1) * INTERVAL '1 day')
          AND created_at >= event_record.public_start_date
          AND created_at <= event_record.public_end_date;

        hour_data := hour_data || jsonb_build_array(jsonb_build_array(
          CASE WHEN hour_val = 0 THEN '12:00 AM' 
               WHEN hour_val < 12 THEN LPAD(hour_val::text, 2, '0') || ':00 AM' 
               WHEN hour_val = 12 THEN '12:00 PM' 
               ELSE LPAD((hour_val % 12)::text, 2, '0') || ':00 PM' END, incident_count));
      END LOOP;
    END IF;
    
    incidentsByHour := jsonb_set(
      incidentsByHour,
      ARRAY[event_record.id::text],
      hour_data
    );
  END LOOP;

  SELECT INTO maxDays MAX(EXTRACT(DAY FROM (public_end_date - public_start_date))) + 1
  FROM events
  WHERE id = ANY(event_ids);

    
  response := jsonb_build_object('incidentsByHour', incidentsByHour, 'maxDays', maxDays, 'eventsDetail', eventsDetail );
  
  RETURN response;

END;
$$;
`;
