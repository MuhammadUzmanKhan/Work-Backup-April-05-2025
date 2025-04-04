-- This procedure is used to update the retention of existing parent_table if it is null.
-- This will only update perception_object_events_new_* tables.
-- If the table has a retention set, it will not be updated.
-- If the table has data older than the new retention, it will be dropped.
-- NOTE(@lberg): This was used to update retention for existing cameras.
-- It should not be used anymore, but it's left here for reference.

CREATE OR REPLACE PROCEDURE set_partitions_retention_if_null(
    p_retention text DEFAULT '90 days',
    p_batch_size int DEFAULT 20
) LANGUAGE plpgsql AS $$
DECLARE
        info record; -- what we get from the query
        part_retention text; -- retention of the partition table
        part_table text; -- name of the partition table
        iterator int := 0; -- used to update partitions in batches
BEGIN

RAISE NOTICE 'Enforcing retention update for existing partitions if any...';
-- create a new partition for each mac_address in perception_object_events_new_default
-- each partition is sub-partitioned by time and set up with partman
FOR info IN (select parent_table, retention as part_retention from partman.part_config where retention is null and parent_table like 'public.perception_object_events_new_%')
LOOP
        iterator := iterator + 1;
        part_retention := info.part_retention;
        part_table := info.parent_table;
        RAISE NOTICE 'Found % which has retention of %, will update to %', part_table, part_retention, p_retention;
        EXECUTE format('UPDATE partman.part_config SET retention = ''%s'', retention_keep_table = ''f'' WHERE parent_table = ''%s''', p_retention, part_table);
        -- if we have updated p_batch_size partitions, apply and commit the changes
        IF iterator % p_batch_size = 0 THEN
                CALL partman.run_maintenance_proc();
                COMMIT;
                RAISE NOTICE 'Updated retention for % partitions', p_batch_size;
                PERFORM pg_sleep(1);
                iterator := 0;
        END IF;
END LOOP;

-- commit any remaining changes
CALL partman.run_maintenance_proc();
RAISE NOTICE 'Done updating retention for existing cameras.';
END
$$;
