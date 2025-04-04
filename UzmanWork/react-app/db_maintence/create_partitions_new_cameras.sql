CREATE OR REPLACE PROCEDURE create_partitions_new_cameras() LANGUAGE plpgsql AS $$
DECLARE
        info record; -- what we get from the query
        mac_address_safe text; -- mac_address with : replaced by _ and lowercased
        mac_address_value text; -- mac_address as it is
        part_table text; -- name of the partition table being created every time
        start_time timestamp; -- earliest time for detection for this mac_address
BEGIN

RAISE NOTICE 'Creating partitions for new cameras if any...';
-- create a new partition for each mac_address in perception_object_events_new_default
-- each partition is sub-partitioned by time and set up with partman
FOR info IN (select mac_address, min(time) as min_time from perception_object_events_new_default group by (mac_address))
LOOP
        -- lock so that no new data is inserted in default partition while this transaction is running
        Lock table perception_object_events_new_default IN EXCLUSIVE MODE;

        mac_address_safe := lower(replace(replace(info.mac_address, ':', '_'), '-', '_'));
        mac_address_value := info.mac_address;
        part_table := format('perception_object_events_new_%s', mac_address_safe);
        start_time := info.min_time;
        RAISE NOTICE 'Started creating partition table %', part_table;

        -- create a temp table with data for this mac_address, copy from default and delete from there
        EXECUTE 'CREATE TABLE perception_object_events_maintain (like perception_object_events_new_default including all)';
        EXECUTE format('INSERT INTO perception_object_events_maintain SELECT * FROM perception_object_events_new_default WHERE mac_address = ''%s''', mac_address_value);
        EXECUTE format('DELETE FROM perception_object_events_new_default WHERE mac_address = ''%s''', mac_address_value);
        -- create the partition table
        -- NOTE: we attach the partition, as it requires a weaker lock than creating it on the parent table
        EXECUTE format('CREATE TABLE %s (LIKE perception_object_events INCLUDING ALL) PARTITION BY RANGE(time);', part_table);
        -- this constraint is needed for the partition to not acquire a stronger lock
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT mac_c CHECK (mac_address = ''%s'') ', part_table, mac_address_value);
        EXECUTE format('ALTER TABLE perception_object_events ATTACH PARTITION %s FOR VALUES IN (''%s'');', part_table, mac_address_value);
        EXECUTE format('SELECT partman.create_parent(''public.%s'',''time'',''native'',''daily'',p_start_partition := ''%s'',p_premake := 14, p_template_table := ''public.perception_object_events_new_template'')', part_table, start_time);
        -- set retention to 90 days and to drop partitions
        EXECUTE format('UPDATE partman.part_config SET retention = ''90 days'', retention_keep_table = ''f'' WHERE parent_table = ''public.%s''', part_table);
        -- copy data, clean up
        EXECUTE 'INSERT INTO perception_object_events SELECT * FROM perception_object_events_maintain';
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT mac_c', part_table);
        EXECUTE 'DROP TABLE perception_object_events_maintain';
        RAISE NOTICE 'Created partition table %', part_table;
        -- commit here so that we don't lock the default partition for too long
        COMMIT;
        PERFORM pg_sleep(1);
END LOOP;

RAISE NOTICE 'Done creating partitions for new cameras.';
END
$$;
