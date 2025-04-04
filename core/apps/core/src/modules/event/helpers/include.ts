import { Sequelize } from 'sequelize';
import {
  Cad,
  CadType,
  Company,
  EventCad,
  EventSubtasks,
  EventUser,
  Image,
  Role,
  User,
  UserCompanyRole,
  UserPins,
} from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { imageInclude } from '@Common/helpers';

export const getAllEventsForStatusesInclude = (
  user: User,
  isUpperRoles: boolean,
  eventStatusSubTask?: boolean,
) => {
  const include: any = [
    {
      model: Company,
      attributes: [],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  if (eventStatusSubTask) {
    include.push(...getEventSubTaskForStatusForEvent());
  }

  return include;
};

export const getAllEventsForStatusesIncludeV1 = (
  user: User,
  isUpperRoles: boolean,
) => {
  const include: any = [
    {
      model: Company,
      attributes: [],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  return include;
};

export const EventUserModel = (user_id: number) => {
  return {
    model: EventUser,
    attributes: [],
    where: { user_id },
    required: true,
  };
};

export const includeUserCompanyEvents = (user_id: number) => {
  return [
    {
      model: Company,
      attributes: [],
      include: [
        {
          model: UserCompanyRole,
          where: { user_id },
          attributes: [],
          include: [
            {
              model: Role,
              attributes: [],
            },
          ],
        },
      ],
    },
  ];
};

export const getEventByIdInclude = (user: User, isUpperRoles: boolean) => {
  const include: any = [
    {
      model: Company,
      attributes: [], // We only need the name from the company
    },
    {
      model: EventSubtasks,
      attributes: ['id', 'name', 'completed', 'description', 'deadline'],
      separate: true,
      order: [['createdAt', SortBy.DESC]],
      include: imageInclude,
    },
    {
      model: UserPins,
      attributes: ['id'],
      where: { user_id: user.id },
      required: false,
      as: 'user_pin_events',
    },
    {
      model: EventCad,
      attributes: {
        exclude: ['updatedAt', 'created_by'],
      },
      separate: true,
      order: [['version', SortBy.DESC]], // Order by version descending
    },
    {
      model: Cad,
      attributes: {
        exclude: ['updated_by', 'cad_type_id'],
        include: [
          [Sequelize.literal('"images"."name"'), 'image_name'],
          [Sequelize.literal('"images"."url"'), 'image_url'],
        ],
      },
      where: { active: true },
      separate: true,
      order: [[Sequelize.literal('"Cad"."created_at"'), 'DESC']],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: CadType,
          attributes: [
            [Sequelize.cast(Sequelize.col('"cad_type"."id"'), 'integer'), 'id'],
            'name',
          ],
        },
      ],
    },
    {
      model: User,
      as: 'user',
      attributes: [],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  return include;
};

export const getEventCadPreviewInclude = (
  user: User,
  isUpperRoles: boolean,
) => {
  const include: any = [
    {
      model: EventCad,
      attributes: [],
    },
    {
      model: Cad,
      attributes: [],
    },
    {
      model: Company,
      attributes: [],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  return include;
};
export const getAllEventsCountInclude = (user: User, isUpperRoles: boolean) => {
  const include: any = [
    {
      model: UserPins,
      as: 'user_pin_events',
      attributes: [],
      where: { user_id: user.id },
      required: false,
    },
    {
      model: EventSubtasks,
      attributes: [],
    },
    {
      model: Company,
      attributes: [],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  return include;
};

export const getAllEventsInclude = (user: User, isUpperRoles: boolean) => {
  const include: any = [
    {
      model: UserPins,
      as: 'user_pin_events',
      where: { user_id: user.id },
      attributes: ['id'],
      required: false,
    },
    {
      model: EventSubtasks,
      attributes: ['id', 'name', 'completed', 'deadline'],
      separate: true,
      order: [['createdAt', SortBy.DESC]],
      include: imageInclude,
    },
    {
      model: Company,
      attributes: [],
    },
    {
      model: User,
      as: 'user',
      attributes: [],
    },
    {
      model: EventCad,
      attributes: {
        exclude: ['updatedAt', 'created_by'],
      },
      separate: true,
    },
    {
      model: Cad,
      attributes: {
        exclude: ['updated_by', 'cad_type_id'],
        include: [
          [Sequelize.literal('"images"."name"'), 'image_name'],
          [Sequelize.literal('"images"."url"'), 'image_url'],
        ],
      },
      order: [[Sequelize.literal('"Cad"."created_at"'), 'DESC']],
      separate: true,
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: CadType,
          attributes: [
            [Sequelize.cast(Sequelize.col('"cad_type"."id"'), 'integer'), 'id'],
            'name',
          ],
        },
      ],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  return include;
};

export const getAllEventsIncludeV1 = (user: User, isUpperRoles: boolean) => {
  const include: any = [
    {
      model: UserPins,
      as: 'user_pin_events',
      where: { user_id: user.id },
      attributes: ['id'],
      required: false,
    },
    {
      model: EventSubtasks,
      attributes: ['id', 'name', 'completed', 'deadline'],
      include: imageInclude,
      separate: true,
    },
    {
      model: Company,
      attributes: [],
    },
    {
      model: User,
      as: 'user',
      attributes: [],
    },
    {
      model: EventCad,
      attributes: {
        exclude: ['updatedAt', 'created_by'],
      },
      separate: true,
    },
    {
      model: Cad,
      attributes: {
        exclude: ['updated_by', 'cad_type_id'],
        include: [
          [Sequelize.literal('"images"."name"'), 'image_name'],
          [Sequelize.literal('"images"."url"'), 'image_url'],
        ],
      },
      separate: true,
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: CadType,
          attributes: [
            [Sequelize.cast(Sequelize.col('"cad_type"."id"'), 'integer'), 'id'],
            'name',
          ],
        },
      ],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  return include;
};

export const getAllEventIdsInclude = (user: User, isUpperRoles: boolean) => {
  const include: any = [
    {
      model: UserPins,
      as: 'user_pin_events',
      where: { user_id: user.id },
      attributes: [],
      required: false,
    },
    {
      model: Company,
      attributes: [],
    },
    {
      model: User,
      as: 'user',
      attributes: [],
    },
  ];

  if (!isUpperRoles) include.push(EventUserModel(user.id));

  return include;
};

export const getEventSubTaskForStatusForEvent = () => {
  const include: any = [
    {
      model: EventSubtasks,
      attributes: ['id', 'name', 'completed', 'deadline', 'description'],
      order: [['createdAt', SortBy.DESC]],
      include: imageInclude,
    },
  ];

  return include;
};
