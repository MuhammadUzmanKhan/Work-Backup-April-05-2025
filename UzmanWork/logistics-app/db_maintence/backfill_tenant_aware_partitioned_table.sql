-- This procedure:
-- get all partitions from the table;
-- update the tenant of each partition by joining with the cameras table over the mac_address;
CREATE OR REPLACE PROCEDURE backfill_tenant_aware_partitioned_table(p_partition_base_name text, p_start_mac_address text default '') LANGUAGE plpgsql AS $$
DECLARE
        info record; -- what we get from the query
        mac_address_safe text; -- mac_address with : replaced by _ and lowercased
        part_table text; -- name of the partition table being created every time
        camera_tenant text; -- tenant of the camera
        updated_rows int; -- number of rows updated
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
        RAISE NOTICE 'Started updating tenant for partition table % to %', part_table, camera_tenant;

        -- update the tenant of the partition by joining with the cameras table;
        EXECUTE format('UPDATE %s SET tenant = ''%s'' where tenant = ''unassigned'' ', part_table, camera_tenant);
        -- get the number of rows updated
        GET DIAGNOSTICS updated_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows with tenant % for partition table %', updated_rows, camera_tenant, part_table;
        COMMIT;
        PERFORM pg_sleep(1);
END LOOP;

END
$$;

