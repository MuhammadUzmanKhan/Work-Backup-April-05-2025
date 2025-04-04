import { Op, Sequelize } from 'sequelize';
import {
  Department,
  Event,
  EventDepartment,
  IncidentDivision,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import { MessageGroupableType } from '@ontrack-tech-group/common/constants';
import { GetMessageGroupsByEventDto } from '../dto';

export const getMessageGroupsByEventWhere = (
  getMessageGroupsByEventDto: GetMessageGroupsByEventDto,
) => {
  const { event_id, keyword, group_type } = getMessageGroupsByEventDto;
  const _where = {
    event_id,
    ...(group_type === MessageGroupableType.DEPARTMENT
      ? { '$department->event_departments.event_id$': event_id }
      : {}),
  };

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  if (group_type) {
    _where['message_groupable_type'] = {
      [Op.iLike]: `%${group_type.toLowerCase()}%`,
    };
  }

  return _where;
};

export const fetchMessageGroupUsersQuery = (
  messageGroupableType: MessageGroupableType,
  event: Event,
) => {
  if (messageGroupableType === MessageGroupableType.EVENT) {
    return `(
    SELECT count("User"."id")::int AS "count" FROM "users" AS "User" 
    INNER JOIN ( "message_group_users" AS "message_groups->MessageGroupUsers" 
    INNER JOIN "message_groups" AS "message_groups" 
    ON "message_groups"."id" = "message_groups->MessageGroupUsers"."message_group_id") 
    ON "User"."id" = "message_groups->MessageGroupUsers"."user_id" 
    AND "message_groups"."id" = "MessageGroup"."id" 
    AND "message_groups"."event_id" = ${event.id} 
    AND "message_groups"."company_id" = ${event.company_id}
    )`;
  } else if (messageGroupableType === MessageGroupableType.DEPARTMENT) {
    return `(SELECT COUNT
        ( "department_users"."user_id" ) :: INT AS "staff"
        FROM
        "department_users"
        INNER JOIN "message_groups" AS "message_groups" ON "message_groups"."message_groupable_id" = "department_users"."department_id"
        AND "department_users"."department_id" = "MessageGroup"."message_groupable_id"
        AND "message_groups"."event_id" = ${event.id}
        AND "message_groups"."company_id" = ${event.company_id})`;
  } else if (messageGroupableType === MessageGroupableType.INCIDENT_DIVISION) {
    return `(SELECT count("user_incident_divisions"."user_id")::int AS "staff" FROM "user_incident_divisions"  
              INNER JOIN "message_groups" AS "message_groups" 
              ON "message_groups"."message_groupable_id" = "user_incident_divisions"."incident_division_id"
              AND "user_incident_divisions"."incident_division_id" = "MessageGroup"."message_groupable_id"
              AND "message_groups"."event_id" = ${event.id} AND "message_groups"."company_id" = ${event.company_id})`;
  }
};

export const getDivisionCount: any = (
  messageGroupableType: MessageGroupableType,
  event_id: number,
) => {
  if (messageGroupableType === MessageGroupableType.DEPARTMENT) {
    return [
      [
        Sequelize.literal(
          `(SELECT COUNT( DISTINCT incident_division_id ) :: INTEGER FROM "user_incident_divisions"
              LEFT OUTER JOIN "users" ON "user_incident_divisions"."user_id" = "users"."id"
              LEFT OUTER JOIN "department_users" ON "users"."id" = "department_users"."user_id" 
              WHERE "department_users"."department_id" = "department"."id" AND 
              "user_incident_divisions"."event_id" = ${event_id})`,
        ),
        'division_count',
      ],
    ];
  }
  return [];
};

export const getIncludeModels = (
  messageGroupableType: MessageGroupableType,
) => {
  const include = [];

  if (messageGroupableType === MessageGroupableType.DEPARTMENT) {
    include.push({
      model: Department,
      attributes: [],
      include: [
        {
          model: EventDepartment,
          attributes: [],
        },
      ],
    });
  } else if (messageGroupableType === MessageGroupableType.INCIDENT_DIVISION) {
    include.push({
      model: IncidentDivision,
      attributes: [],
      include: [
        {
          model: UserIncidentDivision,
          attributes: [],
        },
      ],
    });
  }
  return include;
};
