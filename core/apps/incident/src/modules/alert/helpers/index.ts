import { Op, Sequelize } from 'sequelize';
import {
  AlertableType,
  InfoType,
  Options,
  PusherChannels,
  PusherEvents,
  StaffRoles,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  Alert,
  Company,
  Department,
  Event,
  EventContact,
  EventUser,
  IncidentType,
  PriorityGuide,
  User,
} from '@ontrack-tech-group/common/models';
import { isEventExist } from '@ontrack-tech-group/common/helpers';
import {
  AvailableKeyContactDto,
  AvailableStaffUserDto,
  CreateBulkAlertDto,
} from '../dto';

/**
 * @returns It generates a WHERE clause object based on the provided filters for querying incident zones.
 */
export const getAlertWhereQuery = (
  filters: AvailableKeyContactDto | AvailableStaffUserDto,
) => {
  const { alertable_ids, alertable_type, event_id } = filters;
  const _where = {};

  _where['event_id'] = event_id;

  if (alertable_type) _where['alertable_type'] = alertable_type;

  if (alertable_ids) _where['alertable_id'] = { [Op.in]: alertable_ids };

  return _where;
};

export const getKeyContactCountWhereQuery = (
  company_id: number,
  keyword: string,
  priorityGuideUser?: number[],
  incidentTypeUsersIds?: number[],
) => {
  const _where = {};

  _where['company_id'] = company_id;

  _where['info_type'] = Object.values(InfoType).indexOf(InfoType.KEY_CONTACT);

  if (priorityGuideUser?.length) {
    _where['id'] = { [Op.notIn]: priorityGuideUser };
  }

  if (keyword) {
    _where[Op.or] = [
      { contact_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { first_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { last_name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  if (incidentTypeUsersIds?.length) {
    _where['id'] = { [Op.notIn]: incidentTypeUsersIds };
  }

  return _where;
};

export const getUserCountWhereQuery = (
  keyword: string,
  priorityGuideUser?: number[],
  incidentTypeUsersIds?: number[],
) => {
  const _where = {};

  if (priorityGuideUser?.length) {
    _where['id'] = { [Op.notIn]: priorityGuideUser };
  }

  if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { cell: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  _where['reference_user'] = false;

  if (incidentTypeUsersIds?.length) {
    _where['id'] = { [Op.notIn]: incidentTypeUsersIds };
  }

  return _where;
};

export const getUserWhereQuery = (keyword: string, usersIds?: number[]) => {
  const _where = {};

  _where['blocked_at'] = { [Op.eq]: null };

  if (usersIds?.length) {
    _where['id'] = { [Op.in]: usersIds };
  } else {
    _where['id'] = null; // This will prevent fetching any data
  }

  if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { cell: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  _where['reference_user'] = false;

  return _where;
};

export const keyContactAttributes = (alertable_type: string) => {
  const attributes: any = [
    'id',
    'email_alert',
    'sms_alert',
    'alertable_id',
    'alertable_type',
  ];

  if (
    alertable_type === AlertableType.PRIORITY_GUIDE ||
    alertable_type === AlertableType.ALL
  ) {
    attributes.push(
      [
        Sequelize.literal(
          '(SELECT name FROM priority_guides WHERE priority_guides.id = "event_contact_alerts"."alertable_id")',
        ),
        'priority_name',
      ],
      [
        Sequelize.literal(`
          (SELECT 
            CASE priority_guides.priority 
              WHEN 0 THEN 'low' 
              WHEN 1 THEN 'medium' 
              WHEN 2 THEN 'high' 
              WHEN 3 THEN 'critical' 
              ELSE 'Unknown' 
            END 
          FROM priority_guides 
          WHERE priority_guides.id = "event_contact_alerts"."alertable_id") 
        `),
        'priority',
      ],
    );
  }
  if (
    alertable_type === AlertableType.INCIDENT_TYPE ||
    alertable_type === AlertableType.ALL
  ) {
    attributes.push([
      Sequelize.literal(
        '(SELECT name FROM "incident_types" WHERE "incident_types"."id" = "event_contact_alerts"."alertable_id")',
      ),
      'incident_type_name',
    ]);
  }

  return attributes;
};

export const staffAttributes = (alertable_type: string) => {
  const attributes: any = [
    'id',
    'email_alert',
    'sms_alert',
    'alertable_id',
    'alertable_type',
  ];

  if (
    alertable_type === AlertableType.PRIORITY_GUIDE ||
    alertable_type === AlertableType.ALL
  ) {
    attributes.push(
      [
        Sequelize.literal(
          '(SELECT name FROM priority_guides WHERE priority_guides.id = "user_alerts"."alertable_id")',
        ),
        'priority_name',
      ],
      [
        Sequelize.literal(`
          (SELECT 
            CASE priority_guides.priority 
              WHEN 0 THEN 'low' 
              WHEN 1 THEN 'medium' 
              WHEN 2 THEN 'high' 
              WHEN 3 THEN 'critical' 
              ELSE 'Unknown' 
            END 
          FROM priority_guides 
          WHERE priority_guides.id = "user_alerts"."alertable_id"
          AND "user_alerts"."alertable_type" = '${AlertableType.PRIORITY_GUIDE}'
          ) 
        `),
        'priority',
      ],
    );
  }

  if (
    alertable_type === AlertableType.INCIDENT_TYPE ||
    alertable_type === AlertableType.ALL
  ) {
    attributes.push([
      Sequelize.literal(
        `(SELECT name FROM "incident_types" WHERE "incident_types"."id" = "user_alerts"."alertable_id" AND "user_alerts"."alertable_type" = '${AlertableType.INCIDENT_TYPE}')`,
      ),
      'incident_type_name',
    ]);
  }

  return attributes;
};

export const alertAttributes = (alertable_type: string) => {
  const attributes: any = [
    'id',
    'email_alert',
    'sms_alert',
    'alertable_id',
    'user_id',
    'event_contact_id',
  ];
  if (alertable_type === AlertableType.PRIORITY_GUIDE) {
    attributes.push(
      [
        Sequelize.literal(
          '(SELECT name FROM priority_guides WHERE priority_guides.id = "Alert"."alertable_id")',
        ),
        'priority_name',
      ],
      [
        Sequelize.literal(`
          (SELECT 
            CASE priority_guides.priority 
              WHEN 0 THEN 'low' 
              WHEN 1 THEN 'medium' 
              WHEN 2 THEN 'high' 
              WHEN 3 THEN 'critical' 
              ELSE 'Unknown' 
            END 
          FROM priority_guides 
          WHERE priority_guides.id = "Alert"."alertable_id") 
        `),
        'priority',
      ],
    );
  } else {
    attributes.push([
      Sequelize.literal(
        '(SELECT name FROM "incident_types" WHERE "incident_types"."id" = "Alert"."alertable_id")',
      ),
      'incident_type_name',
    ]);
  }
  return attributes;
};

export const sendUpdatedAlert = async (
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) => {
  const allIncidentTypeAndPriorityGuideCount = await alertCountHelper(
    event_id,
    {
      useMaster: true,
    },
  );

  const updatedData = {
    ...data,
    allIncidentTypeAndPriorityGuideCount,
  };

  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_SETUP],
    {
      updatedData,
      status,
      type,
      newEntry,
    },
  );
};

export const multipleAlertWhere = (
  event_id: number,
  alertable_ids: number[],
  event_contact_ids: number[],
  user_ids: number[],
) => {
  const whereClause: Record<string, any> = {
    alertable_id: { [Op.in]: alertable_ids },
    event_id,
  };

  if (user_ids?.length) {
    whereClause['user_id'] = { [Op.in]: user_ids };
  }

  if (event_contact_ids?.length) {
    whereClause['event_contact_id'] = { [Op.in]: event_contact_ids };
  }

  return whereClause;
};

export const removeDuplicates = (existingAlertArray, alerts) => {
  const existingSet = new Set(
    existingAlertArray.map((item) =>
      item.event_contact_id
        ? `${item.alertable_id}-${item.event_contact_id}`
        : `${item.alertable_id}-${item.user_id}`,
    ),
  );

  // Filter the result array
  const filteredAlerts = alerts.filter(
    (item) =>
      !existingSet.has(
        item.event_contact_id
          ? `${item.alertable_id}-${item.event_contact_id}`
          : `${item.alertable_id}-${item.user_id}`,
      ),
  );

  return filteredAlerts;
};

export const getAlertById = async (
  id: number,
  alertable_type: string,
  options?: Options,
) => {
  return await Alert.findOne({
    where: {
      id,
    },
    attributes: alertAttributes(alertable_type),
    include: [
      {
        model: PriorityGuide,
        attributes: [],
      },
    ],
    ...options,
  });
};

export const getAlertInclude: any = (
  event_id: number,
  alertable_type: string,
  assigned_incident_types: boolean,
  keyContact?: boolean,
) => {
  const queryOptions = {
    where: {
      event_id,
      alertable_type:
        alertable_type === AlertableType.ALL
          ? {
              [Op.in]: [
                AlertableType.PRIORITY_GUIDE,
                AlertableType.INCIDENT_TYPE,
              ],
            }
          : alertable_type,
    },
    required: !!assigned_incident_types,
    include: [],
  };

  // Add the appropriate model(s) to the `include` array based on alertable_type
  if (alertable_type === AlertableType.PRIORITY_GUIDE) {
    queryOptions.include.push({
      model: PriorityGuide,
      attributes: [],
    });
  } else if (alertable_type === AlertableType.INCIDENT_TYPE) {
    queryOptions.include.push({
      model: IncidentType,
      attributes: [],
    });
  } else if (alertable_type === AlertableType.ALL) {
    // Include both models when alertable_type is ALL
    queryOptions.include.push(
      {
        model: PriorityGuide,
        attributes: [],
      },
      {
        model: IncidentType,
        attributes: [],
      },
    );
  }

  return [
    {
      model: Alert,
      attributes: keyContact
        ? keyContactAttributes(alertable_type)
        : staffAttributes(alertable_type),
      ...queryOptions,
    },
  ];
};

export const getAlertableIds = async (
  alertable_type: AlertableType,
  event_id: number,
  user_id?: number,
  event_contact_id?: number,
) => {
  const where = { event_id };

  if (user_id) {
    where['user_id'] = user_id;
  } else if (event_contact_id) {
    where['event_contact_id'] = event_contact_id;
  }

  // Add conditional logic for `alertable_type`
  if (alertable_type === AlertableType.ALL) {
    where['alertable_type'] = {
      [Op.in]: [AlertableType.PRIORITY_GUIDE, AlertableType.INCIDENT_TYPE],
    };
  } else {
    where['alertable_type'] = alertable_type;
  }

  const alerts = await Alert.findAll({
    where,
    attributes: ['alertable_id'],
  });

  return alerts.map((alert) => alert.alertable_id);
};

export const createBulkAlerts = async (
  createBulkAlertDto: CreateBulkAlertDto,
) => {
  const {
    event_id,
    alertable_type,
    user_id,
    event_contact_id,
    sms_alert,
    email_alert,
  } = createBulkAlertDto;

  // Get alertable ids of a user or event contact
  const alertable_ids = await getAlertableIds(
    alertable_type,
    event_id,
    user_id,
    event_contact_id,
  );

  await Promise.all(
    alertable_ids.map(async (alertable_id) => {
      const where = {
        alertable_id,
        event_id,
      };

      // Dynamically add `user_id` or `event_contact_id` to the `where` clause
      if (user_id) {
        where['user_id'] = user_id;
      } else if (event_contact_id) {
        where['event_contact_id'] = event_contact_id;
      }

      const [alert, created] = await Alert.findOrCreate({
        where,
        defaults: {
          sms_alert,
          email_alert,
        },
      });

      if (!created) {
        const updateFields = {};

        if (sms_alert !== undefined) updateFields['sms_alert'] = sms_alert;
        if (email_alert !== undefined)
          updateFields['email_alert'] = email_alert;

        if (Object.keys(updateFields).length) {
          await alert.update(updateFields);
        }
      }

      return alert;
    }),
  );
};

export const staffRolesArray: number[] = Object.keys(StaffRoles)
  .filter((key) => isNaN(Number(key)))
  .map((key) => StaffRoles[key]);

export const getAlertCountSubquery = (
  table: string,
  staff_id: string,
  event_id: number,
  alertable_type: string,
) => {
  return Sequelize.literal(`
    CASE 
      WHEN EXISTS (
        SELECT 1 
        FROM "alerts" 
        WHERE "alerts"."${staff_id}" = "${table}"."id"
          AND "alerts"."event_id" = ${event_id}
          AND "alerts"."alertable_type" = '${alertable_type}'
      ) THEN 1 
      ELSE 0 
    END
  `);
};

export const alertCountHelper = async (event_id: number, options?: Options) => {
  const { company_id } = await isEventExist(event_id);

  const priorityGuideKeyContactCount = await EventContact.count({
    where: {
      company_id,
      info_type: Object.values(InfoType).indexOf(InfoType.KEY_CONTACT),
    },
    include: [
      {
        model: Alert,
        where: {
          event_id,
          alertable_type: AlertableType.PRIORITY_GUIDE,
        },
        required: false,
        include: [
          {
            model: PriorityGuide,
            attributes: [],
          },
        ],
      },
    ],
    distinct: true,
    ...options,
  });

  const incidentTypeKeyContactCount = await EventContact.count({
    where: {
      company_id,
      info_type: Object.values(InfoType).indexOf(InfoType.KEY_CONTACT),
    },
    include: [
      {
        model: Alert,
        where: {
          event_id,
          alertable_type: AlertableType.INCIDENT_TYPE,
        },
        required: false,
        include: [{ model: IncidentType, attributes: [] }],
      },
    ],
    distinct: true,
    ...options,
  });

  const priorityGuideUsersCount = await User.count({
    where: {
      reference_user: false,
    },
    include: [
      {
        model: EventUser,
        where: { event_id },
      },
      {
        model: Department,
        required: true,
        include: [
          {
            model: Event,
            where: { id: event_id },
          },
        ],
      },
      {
        model: Alert,
        where: {
          event_id,
          alertable_type: AlertableType.PRIORITY_GUIDE,
        },
        required: false,
      },
    ],
    distinct: true,
    ...options,
  });

  const incidentTypeUserCount = await User.count({
    where: {
      reference_user: false,
    },
    attributes: [],
    include: [
      {
        model: EventUser,
        attributes: [],
        where: { event_id },
      },
      {
        model: Department,
        attributes: [],
        required: true,
        include: [
          {
            model: Event,
            attributes: [],
            where: { id: event_id },
          },
          {
            model: Company,
            attributes: ['name'],
          },
        ],
      },
      {
        model: Alert,
        where: {
          event_id,
          alertable_type: AlertableType.INCIDENT_TYPE,
        },
        required: false,
        include: [{ model: IncidentType, attributes: [] }],
      },
    ],
    distinct: true,
    ...options,
  });

  return {
    priorityGuideKeyContactCount,
    priorityGuideUsersCount,
    incidentTypeKeyContactCount,
    incidentTypeUserCount,
  };
};
