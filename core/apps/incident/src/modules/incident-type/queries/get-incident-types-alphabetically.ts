export const getIncidentTypesAlphabetically = async (
  event_id: number,
  company_id: number,
  incident_ids,
  record_language: string,
  sequelize,
) => {
  return await sequelize.query(`
WITH GroupedData AS (
    SELECT
        CASE
            WHEN INITCAP(LEFT("IncidentTypeTranslation"."translation", 1)) ~ '^[A-Z]' THEN INITCAP(LEFT("IncidentTypeTranslation"."translation", 1))
            ELSE 'others'
        END AS group_key,
        "IncidentTypeTranslation"."incident_type_id" AS incident_type_id,
        "IncidentTypeTranslation"."translation",
        it.default_priority,
        it.color,
        it.pinned,
        (
            SELECT COUNT(DISTINCT "incidents"."id")::INTEGER
            FROM incidents
            WHERE
                "IncidentTypeTranslation"."incident_type_id" = "incidents"."incident_type_id"
                AND "incidents"."event_id" = ${event_id}
                AND "incidents"."company_id" = ${company_id}
        ) AS incidents_count,
        (
            SELECT COUNT(DISTINCT "events"."id")::INTEGER
            FROM "events"
            INNER JOIN "event_incident_types" ON "events"."id" = "event_incident_types"."event_id"
            WHERE
                "events"."deleted_at" IS NULL
                AND "event_incident_types"."incident_type_id" = "IncidentTypeTranslation"."incident_type_id"
                AND "events"."id" != ${event_id}
        ) AS events_count,
        (
            SELECT COUNT(DISTINCT "alerts"."id")::INTEGER
            FROM alerts
            WHERE
                "IncidentTypeTranslation"."incident_type_id" = "alerts"."alertable_id"
                AND "alerts"."event_id" = ${event_id}
                AND "alerts"."alertable_type" = 'IncidentTypeTranslation'
        ) AS incident_type_alert_count,
        EXISTS(
            SELECT 1
            FROM "event_incident_types"
            WHERE
                "event_incident_types"."incident_type_id" = "IncidentTypeTranslation"."incident_type_id"
                AND "event_incident_types"."event_id" = ${event_id}
        ) AS is_assigned
    FROM
        "incident_type_translations" AS "IncidentTypeTranslation"
    JOIN
        incident_types AS it ON "IncidentTypeTranslation"."incident_type_id" = it.id
    WHERE
        "IncidentTypeTranslation"."incident_type_id" = ANY(ARRAY[${incident_ids}])
    AND
        "IncidentTypeTranslation"."language" = '${record_language}'
    GROUP BY
        "IncidentTypeTranslation"."incident_type_id",
        "IncidentTypeTranslation"."translation",
        it.default_priority,
        it.color,
        it.pinned,
        CASE
            WHEN INITCAP(LEFT("IncidentTypeTranslation"."translation", 1)) ~ '^[A-Z]' THEN INITCAP(LEFT("IncidentTypeTranslation"."translation", 1))
            ELSE 'others'
        END
)
SELECT
    group_key,
    jsonb_agg(
        jsonb_build_object(
            'id', incident_type_id,
            'name', translation,
            'company_id', ${company_id},
            'color', color,
            'default_priority', default_priority,
            'incidents_count', incidents_count,
            'events_count', events_count,
            'incident_type_alert_count', incident_type_alert_count,
            'is_assigned', is_assigned,
            'pinned', pinned
        ) ORDER BY pinned DESC, is_assigned DESC
    ) AS grouped_data
FROM
    GroupedData
GROUP BY
    group_key
ORDER BY
    CASE
        WHEN group_key = 'others' THEN 2
        ELSE 1
    END,
    group_key ASC;
`);
};
