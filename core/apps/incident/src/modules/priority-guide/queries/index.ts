import { Sequelize } from 'sequelize';

export const priorityIncidentTypes: any = (
  company_id: number,
  event_id: number,
) => [
  Sequelize.literal(
    `(SELECT JSON_AGG("incident_types"."name")
      FROM "incident_types"
      INNER JOIN ( "event_incident_types" AS "events->EventIncidentType" INNER JOIN "events" AS "events" ON "events"."id" = "events->EventIncidentType"."event_id" ) ON "incident_types"."id" = "events->EventIncidentType"."incident_type_id"
      WHERE "incident_types"."company_id" = ${company_id}
      AND "events"."id" = ${event_id}
        AND (
          ("PriorityGuide"."name" = 'Critical' AND LOWER("incident_types"."default_priority") = 'critical')
          OR ("PriorityGuide"."name" = 'High' AND LOWER("incident_types"."default_priority") IN ('high', 'important'))
          OR ("PriorityGuide"."name" = 'Low' AND LOWER("incident_types"."default_priority") = 'low')
          OR ("PriorityGuide"."name" = 'Medium' AND LOWER("incident_types"."default_priority") IN ('medium', 'normal'))
        )
      )`,
  ),
  'priority_incident_types',
];
