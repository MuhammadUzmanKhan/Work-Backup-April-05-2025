
-- similar to the version without sub partitions, but this one updates the tenant of the sub partitions one by one
-- this is less CPU intensive and less likely to cause a lock
CREATE OR REPLACE PROCEDURE backfill_tenant_aware_table_by_sub_partitions(p_partition_base_name text, p_start_mac_address text default '') LANGUAGE plpgsql AS $$
DECLARE
        info record; -- what we get from the query
        mac_address_safe text; -- mac_address with : replaced by _ and lowercased
        part_table text; -- name of the partition table being created every time
        sub_part_table text; -- name of the sub partition table being created every time
        camera_tenant text; -- tenant of the camera
        updated_rows int; -- number of rows updated in the last update
        sub_part_updated_rows int; -- number of rows updated in the last update
BEGIN

FOR info IN (select mac_address, tenant from cameras where mac_address >= p_start_mac_address group by (mac_address, tenant) order by mac_address)
LOOP
        camera_tenant := info.tenant;
        -- if tenant is unassigned, skip it
        IF camera_tenant = 'unassigned' THEN
                RAISE NOTICE 'Skipping camera with mac_address % because tenant is unassigned', info.mac_address;
                CONTINUE;
        END IF;
        mac_address_safe := lower(replace(replace(info.mac_address, ':', '_'), '-', '_'));
        part_table := format('%s_%s', p_partition_base_name, mac_address_safe);
        -- if the partition table doesn't exist, skip it
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = part_table) THEN
                RAISE NOTICE 'Partition table % does not exist, skipping', part_table;
                CONTINUE;
        END IF;
        updated_rows := 0;
        -- select all sub partitions which starts with part_table and update them one by one
        FOR sub_part_table IN SELECT tablename FROM pg_tables WHERE tablename LIKE format('%s_%%', part_table) ORDER BY tablename
        LOOP
                RAISE NOTICE 'Started updating tenant for sub-partition table % to %', sub_part_table, camera_tenant;
                -- update the tenant of the partition by joining with the cameras table;
                EXECUTE format('UPDATE %s SET tenant = ''%s'' where tenant = ''unassigned'' ', sub_part_table, camera_tenant);
                -- increment the updated_rows variable with the number of rows updated in the last update
                GET DIAGNOSTICS sub_part_updated_rows = ROW_COUNT;
                updated_rows := updated_rows + sub_part_updated_rows;
                RAISE NOTICE 'Updated % rows with tenant % for sub-partition table %', sub_part_updated_rows, camera_tenant, sub_part_table;
                COMMIT;
        END LOOP;
        COMMIT;
        PERFORM pg_sleep(1);
        RAISE NOTICE 'Finished updating tenant for partition table % to %, updated %v rows', part_table, camera_tenant, updated_rows;
END LOOP;
END
$$;

