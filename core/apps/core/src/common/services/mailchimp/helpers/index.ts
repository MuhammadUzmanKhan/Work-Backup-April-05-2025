import { Sequelize } from 'sequelize';
import { Company, UserCompanyRole } from '@ontrack-tech-group/common/models';

export const getTags = async (user_id: number, company_id: number) => {
  const mailChimpTags = await UserCompanyRole.findOne({
    where: { user_id, company_id },
    attributes: [
      [UserCompanyRole.getUserRoleByKey, 'role'],
      [Sequelize.literal(`"company"."name"`), 'company_name'],
      [Sequelize.literal(`"company->parent"."name"`), 'parent_name'],
    ],
    include: [
      {
        model: Company,
        attributes: [],
        include: [
          { model: Company, as: 'parent', attributes: [], required: false },
        ],
        required: false,
      },
    ],
    raw: true,
  });

  // Return early if mailChimpTags is null or company_name contains "ontrack"
  if (
    !mailChimpTags ||
    mailChimpTags['company_name']?.toLowerCase().includes('ontrack')
  ) {
    return [];
  }

  // Return filtered values that are not null
  return Object.values(mailChimpTags).filter(Boolean);
};
