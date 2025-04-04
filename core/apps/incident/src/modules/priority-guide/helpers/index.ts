import { Op, Sequelize } from 'sequelize';
import {
  Alert,
  Company,
  Department,
  EventContact,
  PriorityGuide,
  Role,
  User,
  UserCompanyRole,
} from '@ontrack-tech-group/common/models';
import {
  Options,
  PusherChannels,
  PusherEvents,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { GetAllPrioritySortingColumns } from '@Common/constants/constants';
import { GetAllPriorityGuideDto } from '../dto';

export const priorityGuideByIdInclude = (
  id: number,
  isKeyContact?: boolean,
) => {
  const include: any = [];

  if (!isKeyContact) {
    include.push(
      {
        model: Department,
        attributes: [],
        include: [
          {
            model: Company,
            attributes: [],
          },
        ],
      },
      {
        model: UserCompanyRole,
        attributes: [],
        include: [
          {
            model: Role,
            attributes: [],
          },
        ],
      },
    );
  }

  include.push({
    model: Alert,
    attributes: ['id', 'email_alert', 'sms_alert'],
    include: [
      {
        model: PriorityGuide,
        where: { id },
        attributes: ['id', 'description', 'name', 'scale_setting', 'priority'],
      },
    ],
    required: true,
  });
  return include;
};

export const getAllPriorityGuideWhere = (
  getAllPriorityGuideDto: GetAllPriorityGuideDto,
) => {
  const _where = {};
  const { event_id, keyword } = getAllPriorityGuideDto;

  _where['event_id'] = event_id;

  if (keyword) {
    _where[Op.or] = [
      {
        '$priority_guide_alerts->user.name$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$priority_guide_alerts->user.email$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$priority_guide_alerts->user.cell$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$priority_guide_alerts->event_contact.name$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$priority_guide_alerts->event_contact.title$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$priority_guide_alerts->event_contact.contact_email$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        '$priority_guide_alerts->event_contact.contact_phone$': {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        name: {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
      {
        description: {
          [Op.iLike]: `%${keyword.toLowerCase()}%`,
        },
      },
    ];
  }

  return _where;
};

export const getAllPriorityGuideHelper = async (
  event_id: number,
  options?: Options,
) => {
  return await PriorityGuide.findAll({
    where: { event_id },
    attributes: [
      'id',
      'description',
      'name',
      'scale_setting',
      [PriorityGuide.getPriorityNameByKey, 'priority'],
      [
        Sequelize.literal(`(
              SELECT COUNT ("alerts"."id")::INTEGER FROM alerts 
              WHERE "alerts"."alertable_id" = "PriorityGuide"."id" AND "alerts"."alertable_type" = 'PriorityGuide'
            )`),
        'priority_guide_alert_count',
      ],
      [
        Sequelize.literal(`(
            SELECT COUNT ("alerts"."id")::INTEGER FROM alerts 
            WHERE "alerts"."alertable_id" = "PriorityGuide"."id" AND "alerts"."alertable_type" = 'PriorityGuide' AND
            "alerts"."event_contact_id" IS NOT NULL
          )`),
        'priority_guide_alert_event_contact',
      ],
      [
        Sequelize.literal(`(
            SELECT COUNT ("alerts"."id")::INTEGER FROM alerts 
            WHERE "alerts"."alertable_id" = "PriorityGuide"."id" AND "alerts"."alertable_type" = 'PriorityGuide' AND
            "alerts"."user_id" IS NOT NULL
          )`),
        'priority_guide_alert_user',
      ],
    ],
    include: [
      {
        model: Alert,
        attributes: ['id', 'email_alert', 'sms_alert'],
        include: [
          {
            model: User,
            attributes: [
              'id',
              'first_name',
              'last_name',
              'cell',
              'email',
              'country_code',
              'country_iso_code',
            ],
          },
          {
            model: EventContact,
            attributes: [
              'id',
              'title',
              'contact_phone',
              'name',
              'contact_email',
              'first_name',
              'last_name',
              'contact_name',
              'country_code',
              'country_iso_code',
              'company_id',
              [
                Sequelize.literal(`(
                    SELECT ("companies"."name") FROM "companies"
                    WHERE "companies"."id" = "priority_guide_alerts->event_contact"."company_id"
                  )`),
                'company_name',
              ],
            ],
            include: [
              {
                model: Company,
                attributes: [],
              },
            ],
          },
        ],
      },
    ],
    order: [Sequelize.literal(`"PriorityGuide"."priority" ${SortBy.ASC}`)],
    ...options,
  });
};

export const priorityGuideOrder = (sort_column: string, order: string) => {
  const _order: any =
    sort_column === GetAllPrioritySortingColumns.NAME
      ? [
          [
            { model: Alert, as: 'priority_guide_alerts' },
            { model: User, as: 'user' },
            'name',
            order || SortBy.DESC,
          ],
          [
            { model: Alert, as: 'priority_guide_alerts' },
            { model: EventContact, as: 'event_contact' },
            'title',
            order || SortBy.DESC,
          ],
        ]
      : sort_column === GetAllPrioritySortingColumns.EMAIL
        ? [
            [
              { model: Alert, as: 'priority_guide_alerts' },
              { model: User, as: 'user' },
              'email',
              order || SortBy.DESC,
            ],
            [
              { model: Alert, as: 'priority_guide_alerts' },
              { model: EventContact, as: 'event_contact' },
              'contact_email',
              order || SortBy.DESC,
            ],
          ]
        : sort_column === GetAllPrioritySortingColumns.CELL
          ? [
              [
                { model: Alert, as: 'priority_guide_alerts' },
                { model: User, as: 'user' },
                'cell',
                order || SortBy.DESC,
              ],
              [
                { model: Alert, as: 'priority_guide_alerts' },
                { model: EventContact, as: 'event_contact' },
                'contact_phone',
                order || SortBy.DESC,
              ],
            ]
          : [[Sequelize.literal(`"PriorityGuide"."priority" ${SortBy.ASC}`)]];

  return _order;
};

export const priorityGuideByIdWhere = (
  keyword: string,
  event_contact?: boolean,
) => {
  const _where = {};

  if (!event_contact) {
    _where['$"users_companies_roles"."role_id"$'] = { [Op.notIn]: [0, 28] };
  }

  if (keyword && !event_contact) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { first_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { last_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { email: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { cell: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  if (keyword && event_contact) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { first_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { last_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { contact_email: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { contact_phone: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { title: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  return _where;
};

export function sendUpdatedPriorityGuide(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_SETUP],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}
