import { Op, Sequelize } from 'sequelize';
import { CommentsQueryParamsDto } from '../dto';

export const commonAttributes: any = [
  'id',
  'commentable_id',
  'commentable_type',
  'text',
  'creator_id',
  'creator_type',
  'event_id',
  'created_at',
  'updated_at',
  'is_edited',
  [Sequelize.literal(`"created_by"."name"`), 'commented_by'],
];

export const commonQueries = (companyId: number) => {
  companyId;
  return companyId
    ? [
        [
          Sequelize.literal(`(
            SELECT
            CASE
              WHEN "ucr"."role_id" = 0 THEN 'super_admin'
              WHEN "ucr"."role_id" = 28 THEN 'ontrack_manager'
              ELSE "roles"."name"
            END AS "name"
            FROM "roles"
            INNER JOIN "users_companies_roles" AS "ucr" ON "roles".id = "ucr"."role_id"
            WHERE "ucr"."user_id" = "Comment"."creator_id"
            AND (
              "ucr"."role_id" IN (0, 28)
              OR "ucr"."company_id" = ${companyId}
            )
            LIMIT 1
          )`),
          'creator_role',
        ],
        [
          Sequelize.literal(`"created_by->department"."name"`),
          'department_name',
        ],
      ]
    : [];
};

export const commentListWhere = (
  query: CommentsQueryParamsDto,
  timeStamp: string,
) => {
  const _where = {};
  const { id, event_id, type, keyword, comment_id } = query;

  if (id) _where['commentable_id'] = id;
  if (type) _where['commentable_type'] = type;

  if (event_id) {
    _where['event_id'] = event_id;
  }

  if (keyword) {
    _where['text'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  // to get recent comments of passed comment id
  if (comment_id) {
    _where[Op.or] = [
      { id: comment_id },
      { created_at: { [Op.ne]: timeStamp } },
    ];
  }

  return _where;
};
