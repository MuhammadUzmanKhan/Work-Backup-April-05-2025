-- this procedure will backfill the archived_thumbnails table
-- using the existing thumbnails table for clips which:
-- 1. have a tenant
-- 2. have an s3_path (so they are archived)
-- 3. are not already in the archived_thumbnails table
CREATE OR REPLACE PROCEDURE backfill_archived_thumbnails() LANGUAGE plpgsql AS $$
DECLARE
        info record; -- what we get from the query
        mac_address text; -- mac_address of the current row
        start_time timestamp; -- start_time of the current row
        end_time timestamp; -- end_time of the current row
        tenant text; -- tenant of the current row
        clip_id int; -- clip_id of the current row
        updated_rows int; -- how many rows we updated

BEGIN
    FOR info IN EXECUTE format('select id, mac_address, start_time, end_time, tenant from clips_data
                                where tenant != ''unassigned'' and s3_path is not null and
                                id not in (select distinct clip_id from archived_thumbnails) and
                                id in (select distinct clip_id from clips_to_archives)
                                order by id')
    LOOP
            clip_id := info.id;
            mac_address := info.mac_address;
            start_time := info.start_time;
            end_time := info.end_time;
            tenant := info.tenant;
            updated_rows := 0;
            RAISE NOTICE 'Archiving thumbnails for clip %', clip_id;
            -- get all the thumbnails for this clip
            EXECUTE format('INSERT INTO archived_thumbnails (clip_id, timestamp, s3_path, tenant)
                            SELECT %s, timestamp, s3_path, ''%s''
                            FROM thumbnails
                            WHERE camera_mac_address = ''%s''
                            AND timestamp >= ''%s'' AND timestamp <= ''%s''
                            AND thumbnail_type = ''THUMBNAIL''
                            ',
                            clip_id, tenant, mac_address, start_time, end_time);

            GET DIAGNOSTICS updated_rows = ROW_COUNT;
            RAISE NOTICE 'Archived % thumbnails for clip %', updated_rows, clip_id;
    END LOOP;
END
$$;
