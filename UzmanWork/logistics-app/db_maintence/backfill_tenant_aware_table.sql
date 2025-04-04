-- this procedure takes three args:
-- 1. the name of the table to update
-- 2. the batch size (default 1000)
-- Then it does the following:
-- 1. update the next row in the table if the tenant is unassigned
-- 2. if the batch size is reached, commit and sleep
-- 3. repeat until all rows are updated

CREATE OR REPLACE PROCEDURE backfill_tenant_aware_table(p_table_name text, p_mac_address_row_name text DEFAULT 'camera_mac_address', p_batch_size int DEFAULT 25000, p_offset bigint DEFAULT 0) LANGUAGE plpgsql AS $$
DECLARE
        info record; -- what we get from the query
        row_id bigint; -- id of the current row
        counter_rows bigint; -- counter for the number of rows
        column_join_name text; -- name of the column to join on
BEGIN
    RAISE NOTICE 'Started updating tenant for table %', p_table_name;
    counter_rows := 0;
    column_join_name := format('%s.%s', p_table_name, p_mac_address_row_name);


    -- iterate the table
    FOR info in EXECUTE format('select id from %I order by id OFFSET %s', p_table_name, p_offset)
    loop
            -- get the identifier of the row
            row_id := info.id;
            -- update the tenant of the row by joining with the cameras table;
            EXECUTE format('UPDATE %s SET tenant = c.tenant FROM cameras c WHERE c.mac_address = %s AND %s.id = %s', p_table_name, column_join_name, p_table_name, row_id);
            -- update counter
            counter_rows := counter_rows + 1;
            -- if we hit the batch size, commit and sleep
            IF counter_rows % p_batch_size = 0  THEN
                    COMMIT;
                    RAISE NOTICE 'Updated total % rows, initial offset was %', counter_rows, p_offset;
                    PERFORM pg_sleep(1);
            END IF;
    end loop;
END
$$;
