-- NOTE(@lberg): This was used to create partitions for existing cameras by copying from an existing table.
-- It should not be used anymore, but it's left here for reference.

-- First transaction: create new table and partitions
BEGIN;
-- create temp table and drop primary key
create table perception_object_events_temp (like perception_object_events including all);
alter table perception_object_events_temp
drop constraint if exists perception_object_events_temp_pkey;

-- create target table partitioned by mac_address
create table perception_object_events_new (like perception_object_events_temp including all)
partition by list (mac_address);

-- create default partition for new mac_addresses
create table perception_object_events_new_default partition of perception_object_events_new default;

-- create the template table
CREATE TABLE perception_object_events_new_template (LIKE perception_object_events_new);

-- create all partitions from existing mac addresses
-- each partition is sub-partitioned by time and set up with partman
DO $$
DECLARE
        info record;
        mac_address_safe text;
        mac_address_value text;
        start_time timestamp;
BEGIN
        FOR info IN (select mac_address, min(time) as min_time from perception_object_events group by (mac_address))
        LOOP
        mac_address_safe := lower(replace(info.mac_address, ':', '_'));
        mac_address_value := info.mac_address;
        start_time := info.min_time;
        EXECUTE format('CREATE TABLE perception_object_events_new_%s partition of perception_object_events_new for values in (''%s'') PARTITION BY RANGE(time)', mac_address_safe,mac_address_value);
        EXECUTE format('SELECT partman.create_parent(''public.perception_object_events_new_%s'',''time'',''native'',''daily'',p_start_partition := ''%s'', p_premake := 14, p_template_table := ''public.perception_object_events_new_template'')', mac_address_safe, start_time);
        END LOOP;
END;
$$;

-- lock so that no new data is inserted while we swap names
Lock table perception_object_events IN EXCLUSIVE MODE;
-- rename old table
ALTER TABLE perception_object_events
RENAME TO perception_object_events_old;
-- rename new table so new data is inserted into it
ALTER TABLE perception_object_events_new
RENAME TO perception_object_events;
COMMIT;

-- Second transaction: copy data from old table to new table
BEGIN;
-- copy data from old table to new table
INSERT INTO perception_object_events (time, mac_address, object_type, x_min, y_min, x_max, y_max, confidence, is_moving, track_id)
SELECT time, mac_address, object_type, x_min, y_min, x_max, y_max, confidence, is_moving, track_id  FROM perception_object_events_old;
COMMIT;
