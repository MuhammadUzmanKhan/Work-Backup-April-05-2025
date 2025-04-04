import { Includeable, Op, Sequelize } from 'sequelize';
import { getPageAndPageSize } from '@ontrack-tech-group/common/helpers';
import { MessageGroupableType } from '@ontrack-tech-group/common/constants';
import {
  Department,
  Event,
  Image,
  IncidentDivision,
  MessageGroup,
  User,
} from '@ontrack-tech-group/common/models';
import { GetMessageGroupUser } from '@Modules/message-group/dto';

// TODO: This function will be complete in future.
export const fetchMessageGroupUsers = async (
  company_id: number,
  messageGroup: MessageGroup,
  filters?: GetMessageGroupUser,
) => {
  const { message_groupable_type, event_id, message_groupable_id, id } =
    messageGroup;

  const include: Includeable[] = [];
  const where = {};

  const [page, page_size] = getPageAndPageSize(
    filters?.page,
    filters?.page_size,
  );

  if (filters?.keyword) {
    where['name'] = { [Op.iLike]: `%${filters.keyword.toLowerCase()}%` };
  }

  if (message_groupable_type === MessageGroupableType.EVENT) {
    include.push({
      model: MessageGroup,
      where: {
        id,
        event_id,
        company_id,
      },
      attributes: [],
    });
  } else if (message_groupable_type === MessageGroupableType.DEPARTMENT) {
    include.push({
      model: Event,
      as: 'events',
      where: { id: event_id, company_id },
      attributes: ['id', 'company_id'],
      through: { attributes: [] },
      include: [
        {
          model: Department,
          attributes: ['id'],
          where: { id: message_groupable_id },
          through: { attributes: [] },
        },
      ],
    });
  } else if (
    message_groupable_type === MessageGroupableType.INCIDENT_DIVISION
  ) {
    include.push({
      model: Event,
      as: 'events',
      where: { id: event_id, company_id },
      attributes: ['id', 'company_id'],
      through: { attributes: [] },
      include: [
        {
          model: IncidentDivision,
          attributes: ['id'],
          where: { id: message_groupable_id },
          through: { attributes: [] },
        },
      ],
    });
  }

  include.push({
    model: Image,
    attributes: [],
  });

  const groupUsers = await User.findAll({
    where: { ...where, blocked_at: { [Op.eq]: null } },
    attributes: [
      'id',
      'name',
      'email',
      'cell',
      'message_service',
      'country_code',
      'blocked_at',
      'sender_cell',
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
          WHERE "ucr"."user_id" = "User"."id"
          AND (
            "ucr"."role_id" IN (0, 28)
            OR "ucr"."company_id" = ${company_id}
          )
          LIMIT 1
        )`),
        'role',
      ],
      [Sequelize.literal(User.getStatusByUserKey), 'status'],
      [Sequelize.literal(`"images"."url"`), 'image_url'],
    ],
    include,
    subQuery: false,
    limit: page_size || undefined,
    offset: page_size * page || undefined,
  });

  return groupUsers;
};
