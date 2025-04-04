import {
  BulkCreateOptions,
  DestroyOptions,
  Op,
  Sequelize,
  Transaction,
} from 'sequelize';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  Editor,
  ERRORS,
  Options,
  RESPONSES,
  RolesNumberEnum,
} from '@ontrack-tech-group/common/constants';
import { getScopeAndCompanyIds } from '@ontrack-tech-group/common/helpers';
import {
  Company,
  Department,
  DepartmentUsers,
  Event,
  EventDepartment,
  EventUser,
  Region,
  User,
  UserCompanyRole,
  UserCompanyRoleRegion,
} from '@ontrack-tech-group/common/models';
import { _ERRORS } from '@Common/constants';

export const isCompanyDepartmentExist = async (
  company_id: number,
  department_id: number,
) => {
  const department = await Department.findOne({
    where: { id: department_id, company_id },
    attributes: ['id'],
  });
  if (!department)
    throw new NotFoundException(
      RESPONSES.notFound('Department of this company'),
    );
};

export const isUserCompanyAlreadyExist = async (
  user_id: number,
  company_id: number,
) => {
  const userCompany = await UserCompanyRole.findOne({
    where: {
      user_id,
      company_id,
    },
  });

  if (userCompany)
    throw new ConflictException(RESPONSES.alreadyExist('User Company'));
};

export const disassociateUserFromCompanyDepartments = async (
  company_id: number,
  user_id: number,
  user: User,
  department_id?: number,
  transaction?: Transaction,
) => {
  const allDepartments = await Department.findAll({
    where: { company_id },
    attributes: ['id'],
  });

  if (allDepartments.length) {
    const allDepartmentsId = department_id
      ? allDepartments.map(({ id }) => id).filter((id) => id !== department_id)
      : allDepartments.map(({ id }) => id);

    await DepartmentUsers.destroy({
      where: { department_id: { [Op.in]: allDepartmentsId }, user_id },
      transaction,
      individualHooks: true,
      editor: { editor_id: user.id, editor_name: user.name },
    } as DestroyOptions & { editor: Editor });
  }
};

export const disassociateUserFromPreviousCompanyEvents = async (
  company_id: number,
  user_id: number,
  transaction: Transaction,
) => {
  const allEvents = await Event.findAll({
    where: { company_id },
    attributes: ['id'],
  });

  if (allEvents.length) {
    const allEventsId = allEvents.map(({ id }) => id);

    await EventUser.destroy({
      where: { event_id: { [Op.in]: allEventsId }, user_id },
      transaction,
    });
  }
};

export const getUserCompaniesByUserId = async (
  id: number,
  options?: Options,
) => {
  return await UserCompanyRole.findOne({
    where: { id },
    attributes: [
      'id',
      'user_id',
      'blocked_at',
      [Sequelize.literal(`"UserCompanyRole"."category"`), 'user_category'], // Specify table name for 'category'
      [UserCompanyRole.getUserRoleByKey, 'role'],
      [Sequelize.literal(`"user"."name"`), 'user_name'],
      [Sequelize.literal(`"company"."name"`), 'company_name'],
      [Sequelize.literal(`"company"."id"`), 'company_id'],
      [Sequelize.literal(`"user->department"."name"`), 'department_name'],
      [Sequelize.literal(`"user->department"."id"`), 'department_id'],
    ],
    include: [
      {
        model: Company,
        attributes: [],
      },
      {
        model: User,
        attributes: [],
        include: [
          {
            model: Department,
            attributes: [],
            where: {
              company_id: {
                [Op.eq]: Sequelize.literal('"UserCompanyRole"."company_id"'),
              },
            },
            through: { attributes: [] },
            required: false,
          },
        ],
      },
    ],
    subQuery: false,
    raw: true,
    ...options,
  });
};

export const filterUsersCompanyDataForAdminAndGlobalAdmin = async (
  user_id: number,
  user: User,
) => {
  const _where: any = { [Op.and]: [] };

  _where[Op.and].push({
    user_id: user_id,
  });

  if (
    user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
    user['role'] !== RolesNumberEnum.ONTRACK_MANAGER
  ) {
    _where[Op.and].push({
      role_id: { [Op.notIn]: [0, 28] },
    });
  }

  if (
    user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
    user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_ADMIN
  ) {
    const { companyIds } = await getScopeAndCompanyIds(user);

    if (companyIds.length) {
      _where[Op.and].push({
        company_id: { [Op.in]: companyIds },
      });
    }
  }

  if (
    user['role'] === RolesNumberEnum.ADMIN ||
    user['role'] === RolesNumberEnum.OPERATIONS_MANAGER ||
    user['role'] === RolesNumberEnum.TASK_ADMIN ||
    user['role'] === RolesNumberEnum.DOTMAP_ADMIN
  ) {
    _where[Op.and].push({
      company_id: user['company_id'],
    });
  }

  return _where;
};

export const canUpdateUserCompany = async (
  user_id: number,
  company_id: number,
  user: User,
  role_id: number,
  region_ids: number[],
) => {
  if (
    user['role'] === RolesNumberEnum.ADMIN ||
    user['role'] === RolesNumberEnum.OPERATIONS_MANAGER ||
    user['role'] === RolesNumberEnum.TASK_ADMIN ||
    user['role'] === RolesNumberEnum.DOTMAP_ADMIN
  ) {
    const userCompany = await UserCompanyRole.findOne({
      attributes: ['id', 'role_id'],
      where: {
        user_id,
        company_id,
      },
    });

    if (
      [
        RolesNumberEnum.GLOBAL_ADMIN,
        RolesNumberEnum.GLOBAL_MANAGER,
        RolesNumberEnum.REGIONAL_MANAGER,
        RolesNumberEnum.REGIONAL_ADMIN,
      ].includes(userCompany.role_id)
    ) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }
  }

  // if user role is going to update a Super Admin or OnTrack Manager, throw an error
  if (
    role_id === RolesNumberEnum.SUPER_ADMIN ||
    role_id === RolesNumberEnum.ONTRACK_MANAGER
  )
    throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

  // only global manager and regional manager have regions
  if (
    role_id !== RolesNumberEnum.REGIONAL_MANAGER &&
    role_id !== RolesNumberEnum.GLOBAL_MANAGER &&
    role_id !== RolesNumberEnum.REGIONAL_ADMIN &&
    region_ids?.length
  )
    throw new BadRequestException(_ERRORS.USER_COMPANY_REGION_ERROR);

  // global manager can create other global manager
  if (user['is_global_manager'] && role_id === RolesNumberEnum.GLOBAL_MANAGER)
    throw new BadRequestException(_ERRORS.GLOBAL_MANAGER_ERROR);
};

export const creatUserCompanyValidation = async (
  user_id: number,
  company_id: number,
  department_id: number,
  region_ids: number[],
  role_id: number,
  user: User,
  transaction?: Transaction,
) => {
  let regions: Region[];
  // checking user is already exist in provide company or not
  await isUserCompanyAlreadyExist(user_id, company_id);

  if (department_id) {
    // check if department exist against provided company_id
    await isCompanyDepartmentExist(company_id, department_id);

    // disassociate this user from all departments of this company
    await disassociateUserFromCompanyDepartments(
      company_id,
      user_id,
      user,
      null,
      transaction,
    );
  }

  // if user role is going to create a Super Admin or OnTrack Manager, throw an error
  if (
    role_id === RolesNumberEnum.SUPER_ADMIN ||
    role_id === RolesNumberEnum.ONTRACK_MANAGER
  )
    throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

  // only global manager and regional manager have regions
  if (
    role_id !== RolesNumberEnum.REGIONAL_MANAGER &&
    role_id !== RolesNumberEnum.GLOBAL_MANAGER &&
    role_id !== RolesNumberEnum.REGIONAL_ADMIN &&
    region_ids?.length
  )
    throw new BadRequestException(_ERRORS.USER_COMPANY_REGION_ERROR);

  // global manager can create other global manager
  if (user['is_global_manager'] && role_id === RolesNumberEnum.GLOBAL_MANAGER)
    throw new ForbiddenException(_ERRORS.GLOBAL_MANAGER_ERROR);

  // getting regions against passed region_ids
  if (region_ids?.length) regions = await isRegionsExist(region_ids);

  return regions;
};

export const isRegionsExist = async (regions_ids: number[]) => {
  const regions = await Region.findAll({
    where: { id: { [Op.in]: regions_ids } },
    attributes: ['id', 'name', 'parent_id'],
    raw: true,
  });
  if (regions_ids.length !== regions.length)
    throw new NotFoundException(_ERRORS.COMPANY_REGION_NOT_FOUND_ERROR);

  return regions;
};

export const associateRegions = async (
  users_companies_roles_id: number,
  regions: Region[],
  updateRegion: boolean,
  user: User,
  transaction: Transaction,
) => {
  // only assignin the parent region, if sub regions are added in array, not adding in DB
  // Extract the region IDs from the regions array
  const newRegionIds = regions
    .filter(
      ({ parent_id }) =>
        !parent_id || !regions.some((region) => region.id === parent_id),
    )
    .map(({ id }) => id);

  // Fetch existing region associations
  const existingAssociations = await UserCompanyRoleRegion.findAll({
    where: { users_companies_roles_id },
    attributes: ['region_id'],
    transaction,
  });

  const existingRegionIds = existingAssociations.map(
    (assoc) => assoc.region_id,
  );

  // Find regions to add (those in newRegionIds but not in existingRegionIds)
  const regionsToAdd = newRegionIds.filter(
    (id) => !existingRegionIds.includes(id),
  );

  // Find regions to remove (those in existingRegionIds but not in newRegionIds)
  const regionsToRemove = existingRegionIds.filter(
    (id) => !newRegionIds.includes(id),
  );

  // Remove regions that are no longer needed
  if (updateRegion && regionsToRemove.length > 0) {
    await UserCompanyRoleRegion.destroy({
      where: {
        users_companies_roles_id,
        region_id: { [Op.in]: regionsToRemove },
      },
      transaction,
      individualHooks: true,
      editor: {
        editor_id: user.id,
        editor_name: user.name,
      },
    } as DestroyOptions & { editor: Editor });
  }

  // Add new regions that are not already associated
  if (regionsToAdd.length > 0) {
    const bulkUserCompanyRoleRegions = regionsToAdd.map((region_id) => ({
      users_companies_roles_id,
      region_id,
    }));

    await UserCompanyRoleRegion.bulkCreate(bulkUserCompanyRoleRegions, {
      transaction,
      editor: {
        editor_id: user.id,
        editor_name: user.name,
      },
    } as BulkCreateOptions & { editor: Editor });
  }
};

export const disassociateEventUserForOldDepartment = async (
  user_id: number,
  oldDepartmentUsersIds: number[],
) => {
  const eventDepartment = await EventDepartment.findAll({
    where: { department_id: { [Op.in]: oldDepartmentUsersIds } },
    attributes: ['event_id'],
  });

  const eventDepartmentIds = eventDepartment.map(
    (eventDepartment) => eventDepartment.event_id,
  );

  if (eventDepartmentIds.length) {
    await EventUser.destroy({
      where: { event_id: { [Op.in]: eventDepartmentIds }, user_id },
    });
  }
};
