/**
 * This file contains all the helper functions related to companies, roles, and permissions.
 */

import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { DashboardScope, ERRORS, Options, RolesNumberEnum } from '../constants';
import {
  Company,
  Event,
  Permission,
  Role,
  RolePermission,
  User,
  UserCompanyRole,
  UserCompanyRoleRegion,
} from '../models';

/**
 * It checks if the user's role is not SUPER_ADMIN and if the company_id of the event does not match either the user's company_id. If this condition is true, it throws a ForbiddenException with the message ERRORS.DONT_HAVE_ACCESS.
 * This function is used to check if a user has access to a specific event based on their role and the event's company ID. It ensures that only users with the appropriate permissions can access the event.
 * @param user
 * @param event_id
 * @returns
 */
export const withCompanyScope = async (
  user: User,
  event_id: number,
  options?: Options,
) => {
  if (!event_id || isNaN(event_id)) return [];

  const event = await Event.findOne({
    where: { id: event_id },
    attributes: ['company_id', 'division_lock_service', 'time_zone', 'name'],
    ...options,
  });
  if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

  if (
    user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
    user['role'] !== RolesNumberEnum.ONTRACK_MANAGER &&
    user['role'] !== RolesNumberEnum.GLOBAL_ADMIN &&
    user['role'] !== RolesNumberEnum.GLOBAL_MANAGER &&
    user['role'] !== RolesNumberEnum.REGIONAL_MANAGER &&
    user['role'] !== RolesNumberEnum.REGIONAL_ADMIN &&
    user['role'] !== RolesNumberEnum.LEGAL_ADMIN &&
    event.company_id !== user['company_id']
  )
    throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

  // We need to find subcompanies only for global. As other users can have only access to their own company.
  if (
    (user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
      user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN ||
      user['role'] === RolesNumberEnum.LEGAL_ADMIN) &&
    event.company_id !== user['company_id']
  ) {
    const subCompanies = await Company.findAll({
      where: { parent_id: user['company_id'] },
      attributes: ['id'],
    });

    // If companyId in event is one of the subcompanies Id
    const isCompanyOneOfSubcompany: boolean =
      subCompanies.map(({ id }) => id).indexOf(event.company_id) !== -1 ||
      false;
    if (!isCompanyOneOfSubcompany)
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
  }

  return [event.company_id, event.division_lock_service, event.time_zone] as [
    number,
    boolean,
    string,
  ];
};

export const getSubcompaniesOfACompany = async (companyId: number) => {
  return await Company.findAll({
    where: { parent_id: companyId },
    attributes: ['id', 'name', 'parent_id'],
  });
};

/**
 * This function will return the companies and subCompanies ids from current companyId if user is SUPER_ADMIN OR GLOBAL_ADMIN
 * Otherwise it will return the current comapny.
 * @param user
 * @returns
 */
export const currentCompanies = async (user: User) => {
  let companies = [];

  if (
    user['role'] === RolesNumberEnum.SUPER_ADMIN ||
    user['role'] === RolesNumberEnum.ONTRACK_MANAGER ||
    user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
    user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_ADMIN
  ) {
    companies = (
      await Company.findAll({
        where: {
          [Op.or]: [
            { id: user['company_id'] },
            { parent_id: user['company_id'] },
          ],
        },
        attributes: ['id'],
        raw: true,
      })
    ).map((company) => company.id);
  } else {
    companies = [user['company_id']];
  }

  return companies;
};

export const isUpperRoles = (role: number) => {
  return [0, 1, 26, 27, 28, 30, 32, 33, 35, 37].includes(role);
};

/**
 * Get sub companies of a global admin user.
 *
 * @param user - The user object containing company and role information.
 * @returns An array of company IDs including both global admin companies and it's sub-companies.
 */
export const getSubCompaniesOfGlobalAdmin = async (user: User) => {
  const companyId = user['company_id'];

  const subCompanies = await Company.findAll({
    attributes: ['id'],
    where: {
      parent_id: companyId,
    },
    raw: true,
  });

  const subCompanyIds = subCompanies.map((company) => company.id);

  return [...subCompanyIds, companyId];
};

/**
 * Get companies of user as admin.
 *
 * @param user - The user object containing company and role information.
 * @returns An array of company IDs including all companies as admin.
 */
export const getCompaniesOfAdmin = async (user: User) => {
  const adminCompanyIds = user.users_companies_roles
    .filter((company) => company.role_id === RolesNumberEnum.ADMIN)
    .map((company) => company.company_id);

  return adminCompanyIds;
};

export const getScopeAndCompanyIds = async (user: User) => {
  const companyId = user['company_id'];
  let companyIds = [];
  let scope = null;
  const { role } = await getUserRoleFromCompanyId(user);

  if (
    RolesNumberEnum.GLOBAL_ADMIN === role ||
    RolesNumberEnum.GLOBAL_MANAGER === role ||
    RolesNumberEnum.REGIONAL_MANAGER === role ||
    RolesNumberEnum.REGIONAL_ADMIN === role
  ) {
    companyIds = await getSubCompaniesOfGlobalAdmin(user);
    scope = DashboardScope.GLOBAL;
  } else if (
    RolesNumberEnum.ADMIN === role ||
    RolesNumberEnum.OPERATIONS_MANAGER === role ||
    RolesNumberEnum.TASK_ADMIN === role ||
    RolesNumberEnum.DOTMAP_ADMIN === role
  ) {
    companyIds = [companyId];
    scope = DashboardScope.ADMIN;
  } else if (
    RolesNumberEnum.SUPER_ADMIN === role ||
    RolesNumberEnum.ONTRACK_MANAGER === role
  ) {
    scope = DashboardScope.UNIVERSAL;
  }

  if (
    !companyIds.length &&
    !user['is_super_admin'] &&
    !user['is_ontrack_manager']
  ) {
    throw new UnauthorizedException();
  }

  return { companyIds, scope };
};

export const getUserRoleFromCompanyId = async (user: User) => {
  const companyId = user['company_id'];

  if (companyId) {
    const userCompanyRole = await UserCompanyRole.findOne({
      where: { user_id: user.id, company_id: companyId },
      attributes: ['role_id', 'category'],
      include: [
        {
          model: UserCompanyRoleRegion,
          attributes: ['region_id'],
        },
      ],
    });
    if (userCompanyRole)
      return {
        role: userCompanyRole.role_id,
        category: userCompanyRole?.category || null,
        region_ids:
          userCompanyRole?.regions?.map(({ region_id }) => region_id) || [],
      };
  } else if (user['is_super_admin']) {
    return { role: RolesNumberEnum.SUPER_ADMIN };
  } else if (user['is_ontrack_manager'])
    return { role: RolesNumberEnum.ONTRACK_MANAGER };

  throw new UnauthorizedException();
};

export const getCompanyScope = async (
  user: User,
  company_id: number | undefined,
) => {
  const companyId = user['company_id'];
  let companyIds = [];
  const { role } = await getUserRoleFromCompanyId(user);

  if (
    RolesNumberEnum.SUPER_ADMIN === role ||
    RolesNumberEnum.ONTRACK_MANAGER === role
  ) {
    return [true, companyIds] as [boolean, number[]];
  } else {
    if (
      RolesNumberEnum.GLOBAL_ADMIN === role ||
      RolesNumberEnum.GLOBAL_MANAGER === role ||
      RolesNumberEnum.REGIONAL_MANAGER === role ||
      RolesNumberEnum.REGIONAL_ADMIN === role ||
      RolesNumberEnum.LEGAL_ADMIN === role
    ) {
      companyIds = await getSubCompaniesOfGlobalAdmin(user);
    } else {
      companyIds = [companyId];
    }
  }

  if (!companyIds.includes(company_id)) {
    throw new UnauthorizedException();
  }

  return [true, companyIds] as [boolean, number[]];
};

/**
 *
 * @param currentUser
 * @param _permission
 * @returns It returns true or false based on if provided permission is assigned to current user or not
 */
export const hasUserPermission = async (
  currentUser: User,
  _permissions: string[],
) => {
  if (currentUser['role'] === RolesNumberEnum.SUPER_ADMIN) return true;

  const permission = await Permission.findOne({
    where: { name: { [Op.in]: _permissions } },
    attributes: ['id'],
    include: [
      {
        model: RolePermission,
        where: { role_id: currentUser['role'] },
        attributes: [],
      },
    ],
  });

  return !!permission;
};

export const userRoleInclude: any = (company_id: number) => [
  {
    model: UserCompanyRole,
    where: { company_id },
    attributes: [],
    required: false,
    include: [
      {
        model: Role,
        attributes: [],
      },
      {
        model: Company,
        attributes: [],
      },
    ],
  },
];
