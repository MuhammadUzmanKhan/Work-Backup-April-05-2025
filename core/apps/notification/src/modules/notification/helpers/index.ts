import { Op } from 'sequelize';
import {
  GlobalRoles,
  NotificationModule,
} from '@ontrack-tech-group/common/constants';
import { getSubcompaniesOfACompany } from '@ontrack-tech-group/common/helpers';
import { User } from '@ontrack-tech-group/common/models';
import { NotificationType } from '@Common/enum';
import { GetNotificationDto } from '../dto';

export const getNotificationWhere = async (
  getNotificationDto: GetNotificationDto,
  user: User,
) => {
  const _where: Record<string, any> = {};
  const { module, type, company_id } = getNotificationDto;
  const companyId: number[] = [company_id];

  if (module) {
    _where['module'] = module;
  }

  if (type) {
    _where['type'] = type;
  }

  // check for child company notifications for global roles
  if (GlobalRoles.includes(user['role'])) {
    const subCompanies = await getSubcompaniesOfACompany(company_id);
    const subCompaniesId = subCompanies.map((company) => company.id);

    if (subCompaniesId?.length) companyId.push(...subCompaniesId);
  }

  _where['company_id'] = { [Op.in]: companyId };

  return _where;
};

export const notificationCountHelper = async (counts) => {
  // Processing to format and combine the results
  const result = {
    mentionedCounts: 0,
    moduleCounts: [],
  };

  // Variable to aggregate counts
  let totalMentionCount = 0;
  const moduleCountsMap = {};

  // Iterate and aggregate counts
  counts.forEach(({ dataValues: { type, module, count } }) => {
    count = parseInt(count, 10);

    if (type === NotificationType.MENTION) {
      totalMentionCount += count;
    }

    // Include counts for 'Task' and 'Event' modules and aggregate mentions
    if (
      type === NotificationType.MENTION ||
      [NotificationModule.TASK, NotificationModule.EVENT].includes(module)
    ) {
      moduleCountsMap[module] = (moduleCountsMap[module] || 0) + count;
    }
  });

  // Push total mention count to mentionedCounts if present
  if (totalMentionCount > 0) {
    result.mentionedCounts = totalMentionCount;
  }

  // Transform aggregated counts to the required format
  result.moduleCounts = Object.entries(moduleCountsMap).map(
    ([module, count]) => ({
      count,
      module,
    }),
  );

  const totalCount = result.moduleCounts.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return {
    totalCount,
    moduleCounts: result.moduleCounts,
    mentionedCounts: result.mentionedCounts,
  };
};

export const notificationCountWhere = async (
  company_id: number,
  user: User,
) => {
  const _where: Record<string | symbol, any> = {};
  const companyId: number[] = [company_id];

  _where[Op.or] = [
    { type: NotificationType.MENTION },
    {
      module: {
        [Op.in]: [NotificationModule.TASK, NotificationModule.EVENT],
      },
    },
  ];

  // check for child company notifications for global roles
  if (GlobalRoles.includes(user['role'])) {
    const subCompanies = await getSubcompaniesOfACompany(company_id);
    const subCompaniesId = subCompanies.map((company) => company.id);

    if (subCompaniesId?.length) companyId.push(...subCompaniesId);
  }

  _where['company_id'] = { [Op.in]: companyId };

  return _where;
};
