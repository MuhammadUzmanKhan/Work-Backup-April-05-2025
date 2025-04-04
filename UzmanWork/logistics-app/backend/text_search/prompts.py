SQL_PROMPT = """
You are an assistant that translates user questions to SQL queries.

Following tables are available: [CAM, ACT]

CREATE TABLE CAM ( // information about cameras
    camera_mac_address VARCHAR NOT NULL, // unique identifier of the camera
    camera_name VARCHAR NOT NULL, // name of the camera
    source VARCHAR NOT NULL, // source of the video stream
    camera_group_id INTEGER, // id of the camera group
    is_enabled BOOLEAN NOT NULL, // whether the camera is enabled
    nvr_uuid VARCHAR NOT NULL, // unique identifier of the NVR
    vendor VARCHAR NOT NULL, // vendor of the camera
)

Full content of the CAM table:

 camera_mac_address | camera_name  |                     source                     | camera_group_id | is_enabled |     nvr_uuid     | vendor
--------------------+--------------+------------------------------------------------+-----------------+------------+------------------+---------
 00:02:D1:A2:E0:84  | Outdoor 2    | coram-gecko-39dk_stream_00-02-D1-A2-E0-84_H264 |              80 | t          | coram-gecko-39dk | Vivotek
 F0:00:00:CA:6D:AD  | Indoor 2dddd | coram-gecko-39dk_stream_F0-00-00-CA-6D-AD_H264 |              80 | t          | coram-gecko-39dk | CoramAI
 00:02:D1:9F:3A:95  | Outdoor 1    | coram-gecko-39dk_stream_00-02-D1-9F-3A-95_H264 |              80 | t          | coram-gecko-39dk | Vivotek
 F0:00:00:CA:71:52  | Indoor 12345 | coram-gecko-39dk_stream_F0-00-00-CA-71-52_H264 |              80 | t          | coram-gecko-39dk | CoramAI

CREATE TABLE ACT ( // information about detected activity
    camera_mac_address VARCHAR NOT NULL, // unique identifier of the camera
    camera_name VARCHAR NOT NULL, // name of the camera
    time TIMESTAMP WITH TIME ZONE NOT NULL, // time when activity happened
    activity_gap_s DOUBLE PRECISION NOT NULL, // time since last activity = time without any activity
    num_people INTEGER NOT NULL, // number of people seen at the same time by this camera at given time
    num_cars INTEGER NOT NULL, //  number of cars seen at the same time by this camera at given time
)

Activity is detected every 5 seconds. If there is no activity, the row is not inserted into the ACT table.

The first 3 rows of the ACT table:

 camera_mac_address | camera_name |             time              | activity_gap_s  | num_people | num_cars
--------------------+-------------+-------------------------------+-----------------+------------+----------
 00:02:D1:9F:3A:95  | Outdoor 1   | 2023-05-30 16:24:28.753993+00 |                 |          1 |        0
 00:02:D1:9F:3A:95  | Outdoor 1   | 2023-05-30 16:24:29.175738+00 | 00:00:00.421745 |          1 |        0
 00:02:D1:9F:3A:95  | Outdoor 1   | 2023-05-30 16:24:29.370058+00 | 00:00:00.19432  |          1 |        0

If being asked about when the last person left search for the last occurrence of event with num_people > 0.
When reasoning about amount of activity always use the num_people or num_cars columns.
When reasoning about intervals without any activity or time since last activity use the activity_gap_s column.
When only time is specified but not the date condition query only on time but not date.
Produce queries in PostgreSQL dialect.
Use single quotes whenever possible.

When specifying time don't specify timezone.
When asking about events on a given day use WHERE time BETWEEN 'date' and 'date+1'.
Current time is {time}.
Today is {today_date}.
Yesterday was {yesterday_date}.
Dates of events in the database are:
{date_0},
{date_1},
{date_2},
{date_3},
{date_4},
{date_5},
{date_6}.

If query returns no results, the desired output is zero.
If the question does not seem related to the database just return empty response.
Always use LIMIT 10.

Generate SQL query code for the following question: {question}
"""

SQL_SUMMARY_PROMPT = """
This query returned following response:
{response}

Now briefly summarise answer to the user question based on this resonse:
"""

SQL_PREFIX = """
WITH
CAM AS (
    SELECT
        mac_address AS camera_mac_address,
        name AS camera_name,
        source,
        camera_group_id,
        is_enabled,
        nvr_uuid,
        vendor
    FROM cameras
),
ACT AS (
    SELECT
        poe.mac_address as camera_mac_address,
        cameras.name as camera_name,
        time,
        time - LAG(time) OVER
            (PARTITION BY poe.mac_address ORDER BY time) AS activity_gap_s,
        SUM(CAST(object_type = 'PERSON' AS INT)) AS num_people,
        SUM(CAST(object_type = 'CAR' AS INT)) AS num_cars
    FROM
        perception_object_events AS poe INNER JOIN cameras
        ON cameras.mac_address = poe.mac_address
    WHERE
        time > NOW() - INTERVAL '1 week'
        AND is_moving = True
        AND track_age_s > 1
    GROUP BY poe.mac_address, cameras.name, time
)
"""
