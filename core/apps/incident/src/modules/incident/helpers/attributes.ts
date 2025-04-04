import { FindAttributeOptions, Sequelize } from 'sequelize';
import { Incident } from '@ontrack-tech-group/common/models';
import { LiteralStringArray } from '@ontrack-tech-group/common/constants';

export const incidentCommonAttributes: LiteralStringArray = [
  'id',
  'description',
  [Incident.getStatusNameByKey, 'status'],
  [Incident.getPriorityNameByKeyNewMapping, 'priority'],
  'resolved_time',
  [Sequelize.literal('CAST("Incident"."updated_by" AS INTEGER)'), 'updated_by'],
  'unread',
  'updated_by_type',
  'created_by',
  'created_by_type',
  'has_image',
  'has_comment',
  'locator_code',
  'user_id',
  'event_id',
  'reporter_id',
  'parent_id',
  'created_at',
  'incident_type_id',
  'incident_zone_id',
  'logged_date_time',
  'source_id',
  'company_id',
  'row',
  'seat',
  'section',
  'is_legal',
  'is_archived',
  'is_concluded',
  'legal_changed_at',
];

export const linkedIncidentAttributes: LiteralStringArray = [
  'id',
  'description',
  [Incident.getStatusNameByKey, 'status'],
  [Incident.getPriorityNameByKeyNewMapping, 'priority'],
  'has_image',
  'has_comment',
  'parent_id',
  'created_at',
  'incident_type_id',
  'logged_date_time',
];

export const incidentAttributesForCsv: LiteralStringArray = [
  'id',
  'description',
  [Incident.getStatusNameByKey, 'status'],
  [Incident.getPriorityNameByKeyNewMapping, 'priority'],
  [Sequelize.literal(`"reporter"."name"`), 'department_name'],
  [Sequelize.literal('COUNT(DISTINCT "images"."id")'), 'attachments'],
  [Sequelize.literal('COUNT(DISTINCT "comments"."id")'), 'comments_count'],
  [
    Sequelize.literal('COUNT(DISTINCT "incident_department_users"."id")'),
    'dispatched_units',
  ],
  'created_at',
  'incident_type_id',
  'logged_date_time',
];

export const countsForLegalAttributes: FindAttributeOptions = [
  [
    Sequelize.literal(
      `COUNT(DISTINCT CASE WHEN "Incident"."is_legal" = true AND "Incident"."is_concluded" = true AND "Incident"."is_archived" = false THEN "Incident"."id" END)::INTEGER`,
    ),
    'concluded',
  ],
  [
    Sequelize.literal(
      `COUNT(DISTINCT CASE WHEN "Incident"."is_legal" = true AND "Incident"."is_concluded" = false AND "Incident"."is_archived" = true THEN "Incident"."id" END)::INTEGER`,
    ),
    'archived',
  ],
  [
    Sequelize.literal(
      `COUNT(DISTINCT CASE WHEN "Incident"."is_legal" = true AND "Incident"."is_concluded" = false AND "Incident"."is_archived" = false THEN "Incident"."id" END)::INTEGER`,
    ),
    'open',
  ],
];

export const hasUnreadComments = (
  id: string,
  user_id: number,
): LiteralStringArray => [
  [
    Sequelize.literal(`
      (
       SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM (
            SELECT *
            FROM comments AS COMMENT
            WHERE 
              COMMENT.commentable_id = ${id}
              AND COMMENT.commentable_type = 'Incident'
            ORDER BY COMMENT.created_at DESC
            LIMIT 1
          ) AS latest_comment
          WHERE NOT EXISTS (
            SELECT 1 
            FROM incident_comment_statuses AS comment_status
            WHERE comment_status.incident_id = latest_comment.commentable_id
              AND comment_status.user_id = ${user_id}
              AND latest_comment.created_at < comment_status.updated_at
          )
        )
        THEN TRUE 
        ELSE FALSE 
      END
      )
    `),
    'has_unread_comments',
  ],
];
