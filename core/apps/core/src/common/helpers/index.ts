import { Op, Sequelize, Transaction } from 'sequelize';
import moment from 'moment';
import { ForbiddenException } from '@nestjs/common';
import {
  Company,
  Department,
  Event,
  EventUser,
  Image,
  User,
} from '@ontrack-tech-group/common/models';
import {
  checkUserNotificationSettingEmailPermission,
  createNotification,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  getUserDetail,
  throwCatchError,
} from '@ontrack-tech-group/common/helpers';
import {
  ERRORS,
  EventStatus,
  notOntrackRole,
  NotificationModule,
  TemplateNames,
  Options,
  RolesNumberEnum,
} from '@ontrack-tech-group/common/constants';
import { CompanyService } from '@Modules/company/company.service';
import { NotificationData } from '@Common/constants';

export const getKeywordOnlyWhere = (keyword: string) => {
  const _where = {};

  if (keyword)
    _where['name'] = {
      [Op.iLike]: `%${keyword.toLowerCase()}%`,
    };

  return _where;
};

export const imageInclude: any = [
  {
    model: Image,
    attributes: [
      'id',
      'name',
      'url',
      'createdAt',
      'thumbnail',
      [
        Sequelize.literal(`"eventSubtasksAttachments->created_by"."name"`),
        'createdBy',
      ],
    ],
    include: [
      {
        model: User,
        as: 'created_by',
        attributes: [],
      },
    ],
  },
];

export const addUserToInProgressEvent = async (
  department_id: number,
  user_id: number,
  company_id: number,
  transaction: Transaction,
  options?: Options,
) => {
  const inProgressEvents = await Event.findAll({
    attributes: ['id'],
    where: {
      status: EventStatus.IN_PROGRESS,
      company_id,
    },
    include: [
      {
        model: Department,
        as: 'departments',
        where: {
          id: department_id,
        },
        attributes: ['id'],
        required: true,
        through: { attributes: [] },
      },
    ],
    ...options,
  });

  const inProgressEventIds = inProgressEvents.map((event) => event.id);

  if (inProgressEventIds?.length) {
    const eventUsers = inProgressEventIds.map((event_id) => ({
      event_id,
      user_id,
    }));

    await EventUser.bulkCreate(eventUsers, {
      transaction,
      ignoreDuplicates: true,
    });
  }
};

export const checkPermissions = async (
  companyId: number,
  user: User,
  companyService: CompanyService,
) => {
  if (
    user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
    user['role'] !== RolesNumberEnum.ONTRACK_MANAGER &&
    user['role'] !== RolesNumberEnum.GLOBAL_ADMIN &&
    user['role'] !== RolesNumberEnum.GLOBAL_MANAGER &&
    user['role'] !== RolesNumberEnum.REGIONAL_MANAGER &&
    user['role'] !== RolesNumberEnum.REGIONAL_ADMIN &&
    companyId !== user['company_id']
  )
    throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

  // fetching all subcompanies by company_id in other user's case but for global admin, taking its own company id
  const company_id =
    user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
    user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_ADMIN
      ? user['company_id']
      : companyId;

  // We need to find subcompanies only for global or super admin. As other users can have only access to their own company.
  let subCompanies = [];

  if (
    (user['role'] === RolesNumberEnum.SUPER_ADMIN ||
      user['role'] === RolesNumberEnum.ONTRACK_MANAGER ||
      user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
      user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
    company_id
  )
    subCompanies = await companyService.findAllSubcompaniesByCompanyId(
      company_id,
      user,
    );

  // If companyId provided in params is one of the subcompanies Id
  const isCompanyOneOfSubcompany: boolean =
    subCompanies.map(({ id }) => id).indexOf(companyId) !== -1 || false;

  // Exception if provided company id in params not belongs to neither global admin's company nor its subcompanies
  if (
    (user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
      user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
    companyId !== user['company_id']
  ) {
    if (!isCompanyOneOfSubcompany) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }
  }

  return [isCompanyOneOfSubcompany, subCompanies] as [boolean, Company[]];
};

/**
 * This function use check permission function to check access and getting companyIds(company or subcompanies) list accordingly
 * @param user
 * @param companyId
 * @param companyService
 */
export const getCompanyIdsWithCheckPermission = async (
  user: User,
  companyId: number,
  companyService: CompanyService,
) => {
  let companyAndSubcompaniesIds = [];

  if (notOntrackRole(user['role']) || companyId) {
    const [isCompanyOneOfSubcompany, subCompanies] = await checkPermissions(
      companyId,
      user,
      companyService,
    );

    // making an array of company and subcompanies ids and passing this array to fetch all events of company and subcompanies in Event Where Function
    companyAndSubcompaniesIds = [companyId];

    if (!isCompanyOneOfSubcompany) {
      companyAndSubcompaniesIds = [
        ...subCompanies.map(({ id }) => id),
        ...companyAndSubcompaniesIds,
      ];
    }
  }

  return companyAndSubcompaniesIds;
};

export const formatDate = (dateString: string | Date): string => {
  return moment.parseZone(dateString).format('M/D/YYYY');
};

export const smsEmailForEventNotifications = async (
  notificationData: NotificationData,
  pusherService: PusherService,
) => {
  const {
    user_ids,
    event_id,
    company_id,
    event,
    communicationService,
    message,
    message_html,
    subject,
    module,
    type,
    sub_type,
    comment_id,
  } = notificationData;
  let userParentCompany;

  const parentCompany = await getCompanyParentId(company_id);

  const { userEmails, userNumbers } =
    await checkUserNotificationSettingEmailPermission(
      user_ids,
      NotificationModule.EVENT,
      type,
    );

  const startDate = formatDate(event.public_start_date);
  const endDate = formatDate(event.public_end_date);

  const eventDates = `${startDate} - ${endDate}`;

  if (user_ids?.length) {
    const notification = await createNotification(
      {
        message,
        message_html,
        module,
        type,
        company_id,
        module_id: event_id,
        comment_id,
      },
      user_ids,
    );

    for (const user_id of user_ids) {
      if (parentCompany) {
        userParentCompany = await getUserDetail(
          user_id,
          parentCompany?.parent_id,
        );
      }
      const notificationData = {
        id: notification.id,
        user_id,
        message,
        message_html,
        module,
        type,
        sub_type,
        company_id: userParentCompany ? parentCompany?.parent_id : company_id,
        module_id: event_id,
        comment_id,
        unread: true,
      };
      pusherService.sendNotificationSocket(notificationData);
    }
  }

  // send message to user who is mentioned in a comment.
  try {
    if (userNumbers?.length) {
      const messageBody = `
            Message: ${message}.
            ${eventDates}
            Event Name: ${event.name}
            Company: ${event['company_name']},
            `;

      await communicationService.communication(
        {
          messageBody,
          userNumbers,
        },
        'send-message',
      );
    }
  } catch (err) {
    throwCatchError(err);
  }

  try {
    if (userEmails?.length) {
      const eventData = {
        message,
        name: event.name,
        company: event['company_name'],
        eventDates,
      };

      const emailData = {
        email: userEmails,
        ...eventData,
      };

      await communicationService.communication(
        {
          data: emailData,
          template: TemplateNames.EVENT_COMMENT_MENTION,
          subject,
        },
        'send-email',
      );
    }
  } catch (err) {
    console.log('🚀 ~ err:', err);
    throwCatchError(err);
  }
};

export const getCompanyParentId = async (company_id: number) => {
  return await Company.findOne({
    where: {
      id: company_id,
      parent_id: {
        [Op.ne]: null, // Fetch rows where parent_id is not null
      },
    },
    attributes: ['parent_id'],
  });
};
