import {
  CreateOptions,
  Op,
  Sequelize,
  Transaction,
  UpdateOptions,
} from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import * as dotenv from 'dotenv';
import moment from 'moment-timezone';
import { S3 } from 'aws-sdk';
import { Request, Response } from 'express';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { randomBytes } from 'crypto';
import {
  User,
  VendorUsers,
  Vendor,
  Event,
  DepartmentUsers,
  Image,
  Location,
  Department,
  UserIncidentDivision,
  IncidentDivision,
  Company,
  UserCompanyRole,
  EventUser,
  Region,
  EventDepartment,
  Role,
} from '@ontrack-tech-group/common/models';
import {
  CsvOrPdf,
  Editor,
  ERRORS,
  Options,
  PdfTypes,
  PusherChannels,
  PusherEvents,
  RESPONSES,
  RolesEnum,
  RolesNumberEnum,
  SortBy,
  TemplateNames,
  UsersIncidentSortingColumns,
  UsersSortingColumns,
} from '@ontrack-tech-group/common/constants';
import {
  humanizeTitleCase,
  isCompanyExist,
  isEventExist,
  jsonToCSV,
  parseCSV,
  userRoleInclude,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  CommunicationService,
  PusherService,
  getReportsFromLambda,
} from '@ontrack-tech-group/common/services';
import {
  CreateUserDto,
  MoveStaffDto,
  UpdateUserDto,
  EventUsersQueryParamsDto,
  AllUsersQueryParamsDto,
  SelectedUsersCsvDto,
  UploadStaffDto,
  MultipleEventsAssociateDto,
} from '../dto';
import {
  SendResponse,
  SingleUserIncidentDivisions,
  UserSearchAttributes,
  _ERRORS,
  _MESSAGES,
  generalRoleConditions,
  generalRoleConditionsForMention,
  workforceRoleConditions,
} from '@Common/constants';
import { AppService } from 'src/app.service';
import { isRegionsExist } from '@Modules/user-companies/helpers';
import { isEventDepartmentExist } from '../query';
import { getAllEventUserIdsInclude, getAllEventUsersInclude } from './include';
import { getAllEventUsersAttributes } from './attributes';
dotenv.config();

export const getEventUsersWhereFilter = (
  filters?: EventUsersQueryParamsDto,
  alreadyAddedUsers?: number[],
) => {
  const {
    keyword,
    messageUsers,
    event_id,
    na_division,
    user_id,
    reference_user,
    dispatch_listing,
  } = filters;

  const _where: any = { [Op.and]: [] };

  // blocked users will be filtered
  _where['blocked_at'] = { [Op.eq]: null };

  if (keyword) {
    const searchConditions: Partial<UserSearchAttributes>[] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];

    if (!dispatch_listing) {
      searchConditions.push({
        cell: { [Op.iLike]: `%${keyword.toLowerCase()}%` },
      });

      if (!messageUsers) {
        searchConditions.push({
          email: { [Op.iLike]: `%${keyword.toLowerCase()}%` },
        });
      } else {
        searchConditions.push({
          country_code: { [Op.iLike]: `%${keyword.toLowerCase()}%` },
        });
      }
    }

    _where[Op.and].push({ [Op.or]: searchConditions });
  }

  if (alreadyAddedUsers) {
    _where['id'] = { [Op.notIn]: alreadyAddedUsers };
  }

  if (na_division) {
    _where['id'] = {
      [Op.notIn]: Sequelize.literal(
        `(SELECT user_id FROM user_incident_divisions WHERE event_id = ${event_id})`,
      ),
    };
  }

  if (user_id) {
    _where['id'] = user_id;
  }

  if (reference_user) {
    _where['reference_user'] = true;
  }

  return _where;
};

export const getAllUsersWhereFilterForCount = (
  filters: AllUsersQueryParamsDto,
  companyIds: number[],
  user: User,
) => {
  const { keyword, company_id, role } = filters;
  const _where: any = { [Op.and]: [] };

  if (keyword) {
    _where[Op.and].push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        { cell: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        { email: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$users_companies_roles->role.name$': {
            [Op.iLike]: `%${keyword.toLowerCase().replace(/\s+/g, '_')}%`, // it's because, in db role name are like ontrack_manager (with underscore)
          },
        },
      ],
    });
  }

  if (company_id) {
    _where[Op.and].push({
      '$users_companies_roles.company_id$': company_id,
    });
  } else if (companyIds.length) {
    _where[Op.and].push({
      '$users_companies_roles.company_id$': { [Op.in]: companyIds },
    });
  }

  if (role) {
    const specificRoleCondition =
      user['role'] in generalRoleConditions
        ? {
            [Op.and]: {
              [Op.notIn]: generalRoleConditions[user['role']],
              [Op.eq]: RolesNumberEnum[role.toUpperCase()],
            },
          }
        : { [Op.eq]: RolesNumberEnum[role.toUpperCase()] };

    _where[Op.and].push({
      '$users_companies_roles.role_id$': specificRoleCondition,
    });
  } else {
    const generalRoleCondition =
      user['role'] in generalRoleConditions
        ? {
            '$users_companies_roles.role_id$': {
              [Op.notIn]: generalRoleConditions[user['role']],
            },
          }
        : {};

    _where[Op.and].push(generalRoleCondition);
  }

  return _where;
};

export const getAllUsersWhereFilter = (
  filters: AllUsersQueryParamsDto,
  companyIds: number[],
  user: User,
) => {
  const { keyword, company_id, role, status, reference_user } = filters;
  const _where: any = { [Op.and]: [] };

  if (keyword) {
    _where[Op.and].push({
      [Op.or]: [
        { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        { cell: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        { email: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$users_companies_roles->role.name$': {
            [Op.iLike]: `%${keyword.toLowerCase().replace(/\s+/g, '_')}%`, // it's because, in db role name are like ontrack_manager
          },
        },
      ],
    });
  }

  if (status === 'blocked') {
    _where.push = Sequelize.literal(`("User"."blocked_at" IS NOT NULL)`);
  } else if (status === 'active') {
    _where.push = Sequelize.literal(`("User"."blocked_at" IS NULL)`);
  }

  if (company_id) {
    _where[Op.and].push({
      '$users_companies_roles.company_id$': company_id,
    });
  } else if (companyIds.length) {
    _where[Op.and].push({
      '$users_companies_roles.company_id$': { [Op.in]: companyIds },
    });
  }

  if (role) {
    const specificRoleCondition =
      user['role'] in generalRoleConditions
        ? {
            [Op.and]: {
              [Op.notIn]: generalRoleConditions[user['role']],
              [Op.eq]: RolesNumberEnum[role.toUpperCase()],
            },
          }
        : { [Op.eq]: RolesNumberEnum[role.toUpperCase()] };

    _where[Op.and].push({
      '$users_companies_roles.role_id$': specificRoleCondition,
    });
  } else {
    const userRoleId = +user['role'];

    const shouldApplyRoleSpecificCondition =
      !isNaN(userRoleId) &&
      userRoleId in generalRoleConditions &&
      ![0, 28].includes(userRoleId);

    const generalRoleCondition = shouldApplyRoleSpecificCondition
      ? {
          [Op.or]: [
            {
              '$users_companies_roles.role_id$': {
                [Op.notIn]: generalRoleConditions[userRoleId],
              },
            },
            {
              id: {
                [Op.eq]: user.id,
              },
            },
          ],
        }
      : userRoleId in generalRoleConditions
        ? {
            '$users_companies_roles.role_id$': {
              [Op.notIn]: generalRoleConditions[userRoleId],
            },
          }
        : {};

    _where[Op.and].push(generalRoleCondition);
  }

  if (reference_user) {
    _where['reference_user'] = true;
  }

  return _where;
};

export const checkCreateVendorDriver = async (
  params: CreateUserDto | UpdateUserDto,
  user: User,
) => {
  if (user['role'] !== RolesEnum.VENDOR) return;

  if (params.role !== RolesEnum.DRIVER)
    throw new ForbiddenException(
      ERRORS.ROLE_INCORRECT_ONLY_VENDOR_ALLWOED_TO_CREATE_DRIVER,
    );

  if (!params.event_id) throw new ForbiddenException(ERRORS.EVENT_ID_REQUIRED);

  const vendor = await Vendor.findOne({
    attributes: [],
    include: [
      {
        model: VendorUsers,
        where: { user_id: user.id },
        attributes: ['id'],
        required: true,
      },
      {
        model: Event,
        attributes: [],
        where: { id: params.event_id },
        required: true,
      },
    ],
    raw: true,
  });

  if (!vendor) {
    throw new ForbiddenException(
      ERRORS.YOU_NOT_BELONG_TO_THIS_EVENT_MAKE_SURE_YOU_BELONGS_TO_THE_EVENT_YOU_ARE_ASSIGNING,
    );
  }
};

export const moveStaffToAnotherCompanyAndDepartment = async (
  move_staff: MoveStaffDto,
  user_id: number,
  current_company_id: number,
  user: User,
  transaction: Transaction,
) => {
  const { company_id, department_id } = move_staff;

  if (!company_id || !department_id) return;

  const department = await Department.findByPk(department_id, {
    attributes: ['id'],
  });

  if (!department) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);

  if (current_company_id !== company_id) {
    await UserCompanyRole.update({ company_id }, {
      where: { user_id, company_id: current_company_id },
      transaction,
      editor: { editor_id: user.id, editor_name: user.name },
    } as UpdateOptions & { editor: Editor });

    //Remove current department data
    const allDepartments = await Department.findAll({
      where: { company_id: current_company_id },
      attributes: ['id'],
    });

    if (allDepartments.length) {
      const allDepartmentsId = allDepartments.map(({ id }) => id);

      await DepartmentUsers.destroy({
        where: { department_id: { [Op.in]: allDepartmentsId }, user_id },
        transaction,
      });
    }

    // Remove current company event data
    const allEvents = await Event.findAll({
      where: { company_id: current_company_id },
      attributes: ['id'],
    });

    if (allEvents.length) {
      const allEventsId = allEvents.map(({ id }) => id);

      await EventUser.destroy({
        where: { event_id: { [Op.in]: allEventsId }, user_id },
        transaction,
      });
    }
  } else {
    const departments = await Department.findAll({
      where: { company_id },
      attributes: ['id'],
    });
    const departmentsIds = departments.map((data) => data.id);

    await DepartmentUsers.destroy({
      where: { department_id: { [Op.in]: departmentsIds }, user_id },
    });
  }

  const departmentUser = await DepartmentUsers.findOne({
    where: { user_id, department_id },
    attributes: ['id'],
  });

  if (!departmentUser) {
    // create department user
    await DepartmentUsers.create({ user_id, department_id }, {
      transaction,
      editor: {
        editor_id: user.id,
        editor_name: user.name,
      },
    } as CreateOptions & { editor: Editor });
  }
};

export const canUpdateUser = async (
  id: number,
  user: User,
  currentUser: User,
) => {
  if (
    id != user.id &&
    ![
      RolesNumberEnum.SUPER_ADMIN,
      RolesNumberEnum.ADMIN,
      RolesNumberEnum.INCIDENT_MANAGER,
    ].includes(currentUser['role'] as number)
  ) {
    throw new ForbiddenException(
      ERRORS.YOUR_SYSTEM_ROLE_NOT_ALLOW_YOU_TO_CHANGE_CONTACT_INFORMATION_CONTACT_ADMIN_OR_INCIDENT_MANAGER,
    );
  }

  // if a Admin tries to update data of Global Admin or Global Manager, throw a error dont have access
  if (
    currentUser['role'] === RolesNumberEnum.ADMIN ||
    currentUser['role'] === RolesNumberEnum.OPERATIONS_MANAGER ||
    currentUser['role'] === RolesNumberEnum.TASK_ADMIN ||
    currentUser['role'] === RolesNumberEnum.DOTMAP_ADMIN
  ) {
    const userCompany = await UserCompanyRole.findOne({
      attributes: ['id', 'role_id'],
      where: {
        user_id: user.id,
        company_id: currentUser['company_id'],
      },
    });

    if (
      [
        RolesNumberEnum.GLOBAL_ADMIN,
        RolesNumberEnum.GLOBAL_MANAGER,
        RolesNumberEnum.REGIONAL_MANAGER,
        RolesNumberEnum.REGIONAL_ADMIN,
      ].includes(userCompany?.role_id)
    ) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }
  }
};

export const uploadStaffCsvErrors = async (csvString: string) => {
  const csvBuffer = Buffer.from(csvString, 'utf8');

  const s3 = new S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.S3_BUCKET_REGION,
  });

  const userNum: string = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  const s3params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `user_upload_errors/upload_user_${userNum}.csv`,
    Body: csvBuffer,
    ACL: 'public-read',
  };

  return await new Promise<any>((resolve, reject) => {
    s3.upload(s3params, (err: Error, data: S3.ManagedUpload.SendData) => {
      if (err) {
        return reject(err);
      }
      resolve(data.Location);
    });
  });
};

export const generateCsvOrPdfForStaffListing = async (
  params:
    | EventUsersQueryParamsDto
    | AllUsersQueryParamsDto
    | SelectedUsersCsvDto,
  staff: User[],
  req: Request,
  res: Response,
  httpService: HttpService,
  addCompanyName?: boolean,
) => {
  if (params.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedStaffListingForCsv = getFormattedStaffListingDataForCsv(
      staff,
      addCompanyName,
    );

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedStaffListingForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="Staff_users.csv"');
    return res.send(response.data);
  }
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param users
 * @returns Formatted object for CSV file for users.
 */
export const getFormattedStaffListingDataForCsv = (
  users: User[],
  addCompanyName?: boolean,
) => {
  return users.map((user: User) => {
    const {
      first_name,
      last_name,
      department_name,
      email,
      country_code,
      cell,
      user_incident_divisions,
      users_companies_roles,
      role,
    } = user.get({ plain: true });

    // Extract unique divisions using a Set to remove duplicates based on division ID
    const divisions = Array.from(
      new Map(
        user_incident_divisions
          .filter((uid) => uid.incident_division)
          .map(({ incident_division }) => [
            incident_division.id,
            incident_division,
          ]),
      ).values(),
    );

    return {
      'First Name': first_name || '--',
      'Last Name': last_name || '--',
      Department: department_name || '--',
      Division:
        divisions?.map((division) => division['name']).join(', ') || '--',
      Email: email || '--',
      'Country Code': country_code || '--',
      Phone: cell || '--',
      ...(users_companies_roles?.length
        ? {
            ...(addCompanyName
              ? {
                  'Company Name': users_companies_roles
                    .map((ucr) => ucr.company_name)
                    .join(', '),
                }
              : {}),
            Role: users_companies_roles
              .map((ucr) => humanizeTitleCase(ucr.role || '--'))
              .join(', '),
          }
        : {
            Role: humanizeTitleCase(role || '--'),
          }),
    };
  });
};

export const isUserExist = async (id: number) => {
  // fetching user data with is_super_admin check using user_companies_roles
  const user = await User.findByPk(id, {
    attributes: {
      include: [
        'id',
        'blocked_at',
        'name',
        'first_name',
        'last_name',
        'email',
        'demo_user',
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 0
            )
          `),
          'is_super_admin',
        ],
      ],
    },
    raw: true,
  });
  if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

  return user;
};

export const alreadyUserExist = async (
  cell: string,
  country_code: string,
  company_id: number,
  id?: number,
) => {
  const where = { cell, country_code };

  if (id) {
    where['id'] = { [Op.ne]: id };
  }

  const alreadyUserExist = await User.findOne({
    where,
    attributes: ['id'],
    include: company_id
      ? [
          {
            model: UserCompanyRole,
            where: { company_id },
            attributes: ['id'],
            required: false,
          },
        ]
      : [],
  });

  if (alreadyUserExist && alreadyUserExist.users_companies_roles?.length) {
    throw new ConflictException(_ERRORS.USER_ALREADY_ASSOCIATED_WITH_COMPANY);
  }

  if (alreadyUserExist && !id) return alreadyUserExist;

  if (alreadyUserExist && id)
    throw new ConflictException(ERRORS.USER_CELL_EXIST);
};

export const checkUserAgainstEvent = async (
  user_id: number,
  event_id: number,
) => {
  const _user = await User.findOne({
    where: { id: user_id },
    attributes: ['id'],
    include: [
      {
        model: Event,
        where: { id: event_id },
        attributes: ['id'],
        as: 'events',
        required: true,
        through: { attributes: [] },
      },
    ],
  });
  if (!_user)
    throw new NotFoundException(
      RESPONSES.notFound('User') + ' for the Event Id passed',
    );

  return _user;
};

export const getUserById = async (
  id: number,
  event_id: number,
  move_staff?: boolean,
  options?: Options,
  isNotRequired?: boolean,
) => {
  let company_id: number;

  if (event_id) {
    const event = await isEventExist(event_id);
    company_id = event.company_id;
  }

  const userDetail = await User.findOne({
    where: { id },
    attributes: [
      'id',
      'email',
      'name',
      'cell',
      'employee',
      'first_name',
      'last_name',
      'active',
      'app_version',
      'demo_user',
      'device_model',
      'employee',
      'blocked_at',
      'message_service',
      'pin',
      'country_code',
      'country_iso_code',
      'reference_user',
      'date_format',
      'time_format',
      'temperature_format',
      'language_code',
      [Sequelize.literal(User.getStatusByUserKey), 'status'],
      [Sequelize.literal(`"department"."name"`), 'department_name'],
      [Sequelize.literal(`"department"."id"`), 'department_id'],
      [Sequelize.literal(`"images"."url"`), 'image_url'],
      [
        Sequelize.literal(`
          EXISTS (
            SELECT 1
            FROM "users_companies_roles" AS "ucr"
            WHERE "ucr"."user_id" = "User"."id"
            AND "ucr"."role_id" = 0
          )
        `),
        'is_super_admin',
      ],
      ...isEventDepartmentExist(event_id),
      ...userByIdAttributes(company_id, event_id),
    ],
    include: [
      {
        model: Image,
        attributes: [
          'id',
          'name',
          'url',
          'createdAt',
          'thumbnail',
          [Sequelize.literal(`"images->created_by"."name"`), 'createdBy'],
        ],
        include: [
          {
            model: User,
            as: 'created_by',
            attributes: [],
          },
        ],
      },
      {
        model: Location,
        attributes: ['id', 'longitude', 'latitude'],
      },
      {
        model: Event,
        as: 'events',
        attributes: ['id', 'name', 'active'],
        through: { attributes: [] },
        where: event_id ? { id: event_id } : {},
        required: !isNotRequired && !move_staff && !!event_id, // If isNotRequired is true, required should be false.         // If move_staff is true, required should be false.          // If move_staff is false, required should be !!event_id.
      },
      {
        model: Department,
        attributes: [],
        through: { attributes: [] },
        required: false,
        include: [
          {
            model: Event,
            where: event_id ? { id: event_id } : {},
            attributes: [],
            through: { attributes: [] },
            required: false,
          },
        ],
      },
      {
        model: UserIncidentDivision,
        where: {
          ...(event_id ? { event_id } : {}),
        },
        attributes: ['id'],
        required: false,
        include: [
          {
            model: IncidentDivision,
            attributes: ['id', 'name'],
          },
        ],
      },
      userCompanyData, // return user company information
      ...(event_id ? userRoleInclude(company_id) : []),
    ],
    order: [[{ model: Image, as: 'images' }, 'primary', 'DESC']],
    subQuery: false,
    ...options,
  });

  if (!userDetail) throw new NotFoundException('User not found!');

  const updatedData = { ...userDetail.get({ plain: true }) };

  updatedData.divisions = updatedData?.user_incident_divisions?.map(
    (division) => ({
      ...division.incident_division,
    }),
  );
  delete updatedData.user_incident_divisions;

  return updatedData;
};

export const filterUsersCompanyDataForAdminAndGlobalAdmin = (
  userIds: number[],
  companyIds: number[],
  user: User,
) => {
  const _where: any = { [Op.and]: [] };

  _where[Op.and].push({
    id: { [Op.in]: userIds },
  });

  if (
    user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
    user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
    user['role'] === RolesNumberEnum.REGIONAL_ADMIN
  ) {
    if (companyIds.length) {
      _where[Op.and].push({
        '$users_companies_roles.company_id$': { [Op.in]: companyIds },
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
      '$users_companies_roles.company_id$': user['company_id'],
    });
  }

  return _where;
};

export const createUpdateUserValidation = async (
  cell: string,
  country_code: string,
  role_id: number,
  company_id: number,
  department_id: number,
  region_ids: number[],
  currentUser: User,
  move_staff?: MoveStaffDto,
  event_id?: number,
  division_ids?: number[],
  userId?: number,
) => {
  let regions: Region[];
  let userExistOtherCompany: User = null;
  let existingUser: User;
  let userCompanyRole: UserCompanyRole = null;

  if (department_id) {
    const deparment = await Department.findByPk(department_id);
    if (!deparment) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);
  }

  // if country_code and cell exist, throw an error
  if (cell && country_code)
    userExistOtherCompany = await alreadyUserExist(
      cell,
      country_code,
      company_id,
      userId,
    );

  if (company_id) await isCompanyExist(company_id);

  if (role_id) {
    // if user role is going to creating is Super Admin or OnTrack Manager, throw an error
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
    if (
      currentUser['is_global_manager'] &&
      role_id === RolesNumberEnum.GLOBAL_MANAGER
    )
      throw new ForbiddenException(_ERRORS.GLOBAL_MANAGER_ERROR);
  }

  // getting regions against passed region_ids
  if (region_ids?.length) regions = await isRegionsExist(region_ids);

  // if divisions ids passed but not event_id, throwing error, becuase associate division with user wihtin an event
  if (division_ids?.length && !event_id)
    throw new BadRequestException(
      ERRORS.EVENT_ID_IS_REQUIRED_IF_USER_ASSOCIATED_WITH_PASSED_DIVISIONS_IDS,
    );

  // checking passed user_id is exist or not
  if (userId) {
    existingUser = await isUserExist(userId);

    await canUpdateUser(userId, existingUser, currentUser);
  }

  if (
    move_staff &&
    currentUser['role'] !== RolesNumberEnum.SUPER_ADMIN &&
    currentUser['role'] !== RolesNumberEnum.ONTRACK_MANAGER
  )
    throw new ForbiddenException(
      ERRORS.ONLY_SUPER_ADMIN_IS_AUTHORIZED_TO_PERFORM_THIS_ACTION,
    );

  if (company_id && userId) {
    userCompanyRole = await UserCompanyRole.findOne({
      where: { user_id: userId, company_id },
    });
  }

  return { regions, userExistOtherCompany, existingUser, userCompanyRole };
};

export const userIdsHelper = async (
  filters: AllUsersQueryParamsDto,
  companyIds: number[],
  user: User,
) => {
  const users = await User.findAll({
    where: getAllUsersWhereFilter(filters, companyIds, user),
    attributes: ['id'],
    include: [
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
    ],
    order: [['name', SortBy.ASC]],
    subQuery: false,
    group: ['User.id'],
  });

  return users.map(({ id }) => id);
};

export const userIdsHelperForCount = async (
  filters: AllUsersQueryParamsDto,
  companyIds: number[],
  user: User,
) => {
  const users = await User.findAll({
    where: getAllUsersWhereFilterForCount(filters, companyIds, user),
    attributes: ['id'],
    include: [
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
    ],
    order: [['name', SortBy.ASC]],
    subQuery: false,
    group: ['User.id'],
  });

  return users.map(({ id }) => id);
};

export const userCompanyData: any = {
  model: UserCompanyRole,
  attributes: [
    'id',
    'user_id',
    'company_id',
    'role_id',
    'blocked_at',
    [UserCompanyRole._getUserRoleByKey, 'role'],
    [UserCompanyRole._getUserRoleByKeyWeb, '_role'],
    [
      Sequelize.literal(`"users_companies_roles->company"."name"`),
      'company_name',
    ],
    [
      Sequelize.literal(`"users_companies_roles->user->department"."name"`),
      'department_name',
    ],
    [
      Sequelize.literal(`"users_companies_roles->user->department"."id"`),
      'department_id',
    ],
  ],
  include: [
    {
      model: Company,
      as: 'company',
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
              [Op.eq]: Sequelize.literal(
                '"users_companies_roles"."company_id"',
              ),
            },
          },
          required: false,
        },
      ],
    },
  ],
};

export const userCompanyRoleData: any = (role: number, company_id: number) => [
  {
    model: UserCompanyRole,
    where: {
      role_id: {
        [Op.notIn]: workforceRoleConditions[role]
          ? workforceRoleConditions[role]
          : [0, 28, 26, 27, 2, 32, 33, 36],
      },
      company_id,
    },
  },
];

export const getActiveUserCount = async (
  event_id: number,
  user: User,
  company_id: number,
  filters,
  division_id: number,
  department_id: number,
  alreadyAddedUsers?: number[],
) => {
  return await User.count({
    where: getEventUsersWhereFilter(filters, alreadyAddedUsers),
    include: [
      {
        model: EventUser,
        where: { event_id },
        required: true,
        attributes: [],
      },
      ...userCompanyRoleData(+user['role'], company_id),
      {
        model: Department,
        where: department_id ? { id: department_id } : {},
        attributes: [],
        through: { attributes: [] },
        required: true,
        include: [
          {
            model: Event,
            where: { id: event_id },
            attributes: [],
            through: { attributes: [] },
            required: true,
          },
        ],
      },
      {
        model: UserIncidentDivision,
        where: {
          ...(division_id
            ? {
                incident_division_id: division_id,
              }
            : {}),
          event_id,
        },
        attributes: [],
        required: !!division_id,
        include: [
          {
            model: IncidentDivision,
            attributes: [],
          },
        ],
      },
    ],
    distinct: true,
  });
};

export const getActiveUserCountForMultipleIds = async (
  event_id: number,
  user: User,
  company_id: number,
  filters,
  division_ids?: number[],
  department_ids?: number[],
  alreadyAddedUsers?: number[],
) => {
  return await User.count({
    where: getEventUsersWhereFilter(filters, alreadyAddedUsers),
    include: [
      {
        model: EventUser,
        where: { event_id },
        required: true,
        attributes: [],
      },
      ...userCompanyRoleData(+user['role'], company_id),
      {
        model: Department,
        where: department_ids?.length
          ? { id: { [Op.in]: department_ids } }
          : {},
        attributes: [],
        through: { attributes: [] },
        required: true,
        include: [
          {
            model: Event,
            where: { id: event_id },
            attributes: [],
            through: { attributes: [] },
            required: true,
          },
        ],
      },
      {
        model: UserIncidentDivision,
        where: {
          ...(division_ids?.length
            ? {
                incident_division_id: { [Op.in]: division_ids },
              }
            : {}),
          event_id,
        },
        attributes: [],
        required: !!division_ids?.length,
        include: [
          {
            model: IncidentDivision,
            attributes: [],
          },
        ],
      },
    ],
    distinct: true,
  });
};

export const userByIdAttributes = (company_id: number, event_id: number) => {
  const attributes: any = [];

  if (event_id) {
    attributes.push(
      [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
      [
        Sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "event_users"
              WHERE "user_id" = "User"."id" AND "event_id" = ${event_id}
            )
          )`),
        'is_event_assigned',
      ],
    );
  }

  return attributes;
};

export const updateStaffCsvHeaderNames = (rows) => {
  const headerMapping = {
    'First Name': 'first_name',
    'Last Name': 'last_name',
    Email: 'email',
    'Country Code': 'country_code',
    Phone: 'cell',
    Role: 'role',
  };

  return rows.map((obj) =>
    Object.entries(obj).reduce((acc, [key, value]) => {
      const updatedKey = headerMapping[key.trim()] || key.trim();
      return { ...acc, [updatedKey]: value };
    }, {}),
  );
};

export const parseCsvAndSaveUsers = async (
  uploadStaffDto: UploadStaffDto,
  currentCompanyId: number,
  httpService: HttpService,
  sequelize: Sequelize,
  currentUser: User,
  appService: AppService,
) => {
  const { department_id, file } = uploadStaffDto;
  let parsedFileData = [];
  const userErrors = [];
  let createdCount = 0;

  const department = department_id
    ? await Department.findOne({
        where: { id: department_id, company_id: currentCompanyId },
        attributes: ['id', 'name'],
      })
    : null;

  try {
    parsedFileData = await parseCSV(file, httpService);

    if (!parsedFileData.length) return [];
  } catch (error) {
    console.log('🚀 ~ error:', error);
    userErrors.push({ department: department?.name, error: error });
  }

  const csvRecords = updateStaffCsvHeaderNames(parsedFileData);

  for (const row of csvRecords) {
    const data = await saveUser(
      row,
      uploadStaffDto,
      currentCompanyId,
      department,
      sequelize,
      currentUser,
      appService,
    );

    userErrors.push(...data?.userErrors);

    if (data?.createdUser) {
      createdCount = createdCount + 1;
    }
  }

  return { userErrors };
};

export const saveUser = async (
  body,
  uploadStaffDto: UploadStaffDto,
  company_id: number,
  department: Department,
  sequelize: Sequelize,
  currentUser: User,
  appService: AppService,
) => {
  const { event_id, division_id } = uploadStaffDto;
  let userErrors = [];
  let user: User;
  let createdUser = false;
  let transaction = null;

  try {
    userErrors = await validationsForCsv(
      body,
      company_id,
      department,
      currentUser,
      appService,
      event_id,
    );

    if (userErrors.length) return { userErrors };

    // Creation of user and its associations
    transaction = await sequelize.transaction();

    user = await User.findOne({
      where: { country_code: body.country_code, cell: body.cell },
      attributes: ['id', 'country_code', 'cell'],
      include: [
        {
          model: UserCompanyRole,
          attributes: ['company_id', 'role_id'],
        },
      ],
    });

    if (
      user &&
      user.users_companies_roles.filter(
        (ucr) =>
          ucr.role_id === RolesNumberEnum.SUPER_ADMIN ||
          ucr.role_id === RolesNumberEnum.ONTRACK_MANAGER,
      ).length
    ) {
      userErrors.push({
        name: `${body['first_name']} ${body['last_name']}`,
        cell: body['cell'],
        department: department?.name,
        error: _ERRORS.THIS_USER_IS_ALREADY_A_SUPER_ADMIN_OR_ONTRACK_MANAGER,
      });

      return { userErrors };
    }

    const role = RolesNumberEnum[body.role.replace(' ', '_').toUpperCase()];

    if (!user) {
      body.password = randomBytes(16).toString('hex');

      user = await User.create(
        {
          ...body,
          name: `${body.first_name} ${body.last_name}`,
          role,
          encrypted_password: '',
        },
        { raw: true, transaction },
      );

      await UserCompanyRole.create(
        {
          role_id: role,
          company_id,
          user_id: user.id,
        },
        { transaction },
      );
      createdUser = true;
    } else {
      await UserCompanyRole.findOrCreate({
        where: {
          role_id: role,
          company_id,
          user_id: user.id,
        },
        transaction,
      });
    }

    // Create User Relation with department, division and event.
    await createUserRelation(
      user,
      department,
      event_id,
      division_id,
      transaction,
      company_id,
    );

    await transaction.commit();
  } catch (error) {
    console.log('🚀 ~ error:', error);
    transaction && (await transaction.rollback());

    userErrors.push({
      name: `${body['first_name']} ${body['last_name']}`,
      cell: body['cell'],
      department: department?.name,
      error: error?.errors?.[0].message,
    });
  }

  return { userErrors, createdUser };
};

export const sendResponseForUploadedStaff = async (
  response: SendResponse[],
  communicationService: CommunicationService,
  pusherService: PusherService,
  currentUser: User,
  event_id: number,
  eventName: string,
  companyName: string,
) => {
  let message = 'Saved Successfully';

  for (let i = 0; i < response.length; i++) {
    const { userErrors } = response[i];
    if (userErrors?.length) {
      const csvString = jsonToCSV(JSON.stringify(userErrors));
      const csvUrl = await uploadStaffCsvErrors(csvString);

      const emailData = {
        csvUrl,
        eventName,
        companyName,
        name: currentUser.name,
        email: currentUser.email,
      };

      try {
        await communicationService.communication(
          {
            data: emailData,
            template: TemplateNames.USER_UPLOAD,
            subject: 'Upload User Anomalies',
          },
          'send-email',
        );
      } catch (err) {
        console.log('🚀 ~ Error on sending Email - Upload User ~ err:', err);
      }

      message =
        _ERRORS.FILE_UPLOADED_SUCCESSFULLY_BUT_SOME_RECORDS_HAVE_ANOMALIES;
    }
  }
  try {
    pusherService.uploadCsvForUser(
      _MESSAGES.CSV_UPLOADED_SUCCESSFULLY,
      event_id,
    );
  } catch (e) {}

  return { message };
};

// After creation of a user. Assign that user to department, event and division.
export const createUserRelation = async (
  user: User,
  department: Department,
  event_id: number,
  division_id: number,
  transaction: Transaction,
  company_id: number,
) => {
  const departmentIds = (
    await DepartmentUsers.findAll({
      where: { user_id: user.id },
      include: [
        {
          model: Department,
          where: { company_id },
        },
      ],
    })
  ).map((depUser) => depUser.department_id);

  if (departmentIds.length) {
    await DepartmentUsers.destroy({
      where: { user_id: user.id, department_id: { [Op.in]: departmentIds } },
    });
  }

  // If department exist against the provided departmentId then create department user if not exist
  if (department) {
    await DepartmentUsers.findOrCreate({
      where: {
        user_id: user.id,
        department_id: department.id,
      },
      transaction,
    });
  }

  // Update the Event user if not exist
  event_id &&
    (await EventUser.findOrCreate({
      where: { event_id, user_id: user.id },
      transaction,
    }));

  // Find Division and then Update UserIncidentdivision
  const division = await IncidentDivision.findByPk(division_id);

  division &&
    (await UserIncidentDivision.findOrCreate({
      where: {
        user_id: user.id,
        incident_division_id: division_id,
        event_id,
      },
      transaction,
    }));
};

export const userByIdQueryAttributes = (
  company_id: number,
  event_id: number,
) => {
  const attributes: any = [];

  if (event_id) {
    attributes.push(
      [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
      [
        Sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "event_users"
              WHERE "user_id" = "User"."id" AND "event_id" = ${event_id}
            )
          )`),
        'is_event_assigned',
      ],
    );
  }

  return attributes;
};

export const validationsForCsv = async (
  body,
  company_id: number,
  department: Department,
  currentUser: User,
  appService: AppService,
  event_id: number,
) => {
  const userErrors = [];
  const errorMessages = [];
  let role = null;

  // to validate email and cell
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const cellRegex = /^[0-9]{7,20}$/;

  // to push multiple errors
  const addError = (error: string) => {
    errorMessages.push(error);
  };

  try {
    await alreadyUserExist(
      body.cell,
      body.country_code.startsWith('+')
        ? body.country_code
        : `+${body.country_code}`,
      company_id,
    );
  } catch (err) {
    addError(err?.message);
  }

  body.company_id = company_id;

  if (!body.country_code.includes('+'))
    body.country_code = `+${body.country_code}`;

  body.country_iso_code = parsePhoneNumberFromString(
    `${body.country_code}${body.cell}`,
  )?.country?.toLowerCase();

  if (!body.role) {
    addError(_ERRORS.ROLE_IS_MISSING);
  } else {
    role = RolesNumberEnum[body.role.replace(' ', '_').toUpperCase()];

    // if user role is going to creating is Super Admin or OnTrack Manager
    if (
      role === RolesNumberEnum.SUPER_ADMIN ||
      role === RolesNumberEnum.ONTRACK_MANAGER
    )
      addError(
        _ERRORS.YOU_DONT_HAVE_ACCESS_TO_CREATE_SUPER_ADMIN_OR_ONTRACK_MANAGER,
      );

    if (
      role &&
      currentUser['role'] in generalRoleConditions &&
      generalRoleConditions[currentUser['role']].includes(role)
    )
      addError(ERRORS.DONT_HAVE_ACCESS);

    if (
      role &&
      !(await appService.viewActiveEventRoles(event_id, currentUser))?.includes(
        body.role.replace(' ', '_').toLowerCase(),
      )
    )
      addError(ERRORS.DONT_HAVE_ACCESS);
  }

  // Validate email
  if (!emailRegex.test(body.email)) addError(_ERRORS.INVALID_EMAIL);

  if (!body.country_iso_code)
    addError(_ERRORS.CELL_NUMBER_IS_INVALID_WITH_COUNTRY_CODE);

  // It means that role is passed but it is not correct
  if (body.role && !role && role !== 0) addError(_ERRORS.INVALID_ROLE);

  if (!body.first_name?.length || !body.last_name?.length)
    addError(_ERRORS.FIRST_OR_LAST_NAME_IS_MISSING);

  // Validate cell
  if (!cellRegex.test(body.cell)) {
    if (!/^[0-9]+$/.test(body.cell)) {
      addError('Cell must be numeric only');
    }
    if (body.cell.length < 7 || body.cell.length > 20) {
      addError('Cell must be between 7 and 20 characters long');
    }
  }

  // If there are any errors, add them to userErrors with combined error messages
  if (errorMessages.length > 0) {
    userErrors.push({
      Name: `${body.first_name} ${body.last_name}`,
      Email: body.email,
      Code: body.country_code,
      Phone: body.cell,
      Role: body.role,
      Department: department?.name,
      Errors: errorMessages.join(', '),
    });
  }

  return userErrors;
};

export const getQueryParamOrListParam = (id: number, ids: number[]) => {
  let _ids = [];
  if (id) _ids.push(id);

  // Check if ids array exists and push its data into _ids array
  if (Array.isArray(ids)) {
    _ids = _ids.concat(ids);
  } else if (ids) {
    _ids.push(ids);
  }

  return _ids;
};

export const eventUsersWhere = (event_id: number, user_id: number) => {
  const _where = {};

  if (event_id) {
    _where['event_id'] = event_id;
  }

  _where['user_id'] = user_id;

  return _where;
};

export const updateSelfInfo = async (body: UpdateUserDto, userId: number) => {
  const {
    cell,
    country_code,
    country_iso_code,
    email,
    first_name,
    last_name,
    name,
  } = body;

  await User.update(
    {
      cell,
      country_code,
      country_iso_code,
      email,
      first_name,
      last_name,
      name,
    },
    {
      where: { id: userId },
    },
  );

  return;
};

export const generatePdfForEventUsers = async (
  users,
  event: Event,
  file_name: string,
  req: Request,
  res: Response,
  httpService: HttpService,
  mapData?: boolean,
) => {
  const formattedDataForPdf = mapData
    ? formattedMapDataForPdf(users, event)
    : getFormattedEventUsersDataForPdf(users, event);

  // Api call to lambda for getting pdf
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedDataForPdf,
    CsvOrPdf.PDF,
    mapData ? PdfTypes.WORKFORCE_STAFF_MAP_VIEW : PdfTypes.WORKFORCE_USERS,
    file_name,
  );

  return res.send(response.data);
};

const getFormattedEventUsersDataForPdf = (usersData, event: Event) => {
  const users = usersData.map((user) => {
    return {
      first_name: user.first_name,
      last_name: user.last_name,
      department_name: user?.department_name,
      divisions: user?.divisions.map((division) => division.name).join(', '),
      email: user.email,
      cell: user.cell,
      country_code: user.country_code,
      role: humanizeTitleCase(user?.role),
    };
  });

  event.short_event_location = event.event_location;

  return { users, event };
};

const formattedMapDataForPdf = (usersData: User, event: Event) => {
  const user = { ...usersData.get({ plain: true }) };

  user.divisions = user.user_incident_divisions.map((division) => ({
    ...division.incident_division,
  }));

  // remove duplicates
  user.divisions = Array.from(
    new Map(user.divisions.map((item) => [item.id, item])).values(),
  );

  // get divisions name in a comma seperated column
  user.divisions = user.divisions.map((division) => division.name).join(', ');

  user.phone = user.country_code + ' ' + user.cell;

  delete user.user_incident_divisions;

  user['role'] = humanizeTitleCase(user?.role);

  user.incidents = user?.incidents.map((incidents) => {
    return {
      status: humanizeTitleCase(incidents?.status),
      priority: incidents.priority,
      incident_type: incidents.incident_type,
      logged_date_time: moment(incidents.logged_date_time)
        .tz(event.time_zone)
        .format('MM/DD/YYYY - hh:mm A'),
    };
  });

  user.tasks = user?.tasks.map((tasks) => {
    return {
      name: tasks.name,
      status: tasks.status,
      deadline: moment(tasks.deadline)
        .tz(event.time_zone)
        .format('MM/DD/YYYY - hh:mm A'),
    };
  });

  return { user, event };
};

export const eventDataForPdf = async (event_id: number) => {
  return await Event.findOne({
    where: { id: event_id },
    attributes: [
      'division_lock_service',
      'time_zone',
      'name',
      [
        Sequelize.literal(`TO_CHAR(public_start_date, 'MM/DD/YYYY')`),
        'public_start_date',
      ],
      [
        Sequelize.literal(`TO_CHAR(public_end_date, 'MM/DD/YYYY')`),
        'public_end_date',
      ],
      'short_event_location',
      'event_location',
      'venue_name',
    ],
    raw: true,
  });
};

export const getUserRecordWithDivisionArray = async (records: User[]) => {
  return records
    .map((row) => row.get({ plain: true }))
    .map((user) => {
      user.divisions = user?.user_incident_divisions?.map((division) => ({
        ...division.incident_division,
      }));
      user.location = user.location || {};
      user.incident_type =
        user?.scans[0]?.dispatched_incident?.incident_types?.name;
      delete user?.scans[0]?.dispatched_incident;
      delete user.user_incident_divisions;

      // remove duplicates
      user.divisions = Array.from(
        new Map(user.divisions?.map((item) => [item.id, item])).values(),
      );

      return user;
    });
};

export const sendUserIncidentDivisionUpdate = (
  data: SingleUserIncidentDivisions,
  eventId: number,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.USER_INCIDENT_DIVISIONS_CHANNEL}-${eventId}`,
    [`${PusherEvents.USER_INCIDENT_DIVISIONS}-${data.userId}`],
    data,
  );
};

export const sendMultipleUserIncidentDivisionUpdate = (
  data: SingleUserIncidentDivisions[],
  eventId: number,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.USER_INCIDENT_DIVISIONS_CHANNEL}-${eventId}`,
    [`${PusherEvents.USERS_INCIDENT_DIVISIONS}`],
    data,
  );
};

export const getAutoIncrementedEmail = async () => {
  let newSuffix = 1;
  const baseEmail = 'ref_user';
  const baseEmailPattern = `${baseEmail}%@ontrack.co`;

  // Find the highest count suffix in existing emails
  const maxSuffixEmail = await User.findOne({
    where: {
      email: {
        [Op.like]: baseEmailPattern,
      },
    },
    attributes: ['email'],
    order: [
      [
        Sequelize.literal(`
          CAST(
            SUBSTRING(
              email,
              LENGTH('${baseEmail}') + 1,
              LENGTH(email) - LENGTH('${baseEmail}') - LENGTH('@ontrack.co')
            ) AS INTEGER
          )
        `),
        'DESC',
      ],
    ],
    replacements: { baseEmail },
  });

  if (maxSuffixEmail) {
    const regex = new RegExp(`${baseEmail}(\\d+)@ontrack\\.co`);
    const match = maxSuffixEmail.email.match(regex);

    if (match) {
      newSuffix = parseInt(match[1], 10) + 1;
    }
  }

  const uniqueEmail = `${baseEmail}${newSuffix}@ontrack.co`;

  return uniqueEmail;
};

export const getAutoIncrementedCell = async () => {
  let newSuffix = 1;
  const basePattern = 'ref_user_';
  const basePatternLiteral = `${basePattern}%`;

  // Find the highest count suffix in existing cell numbers
  const maxSuffixCell = await User.findOne({
    where: {
      cell: {
        [Op.like]: basePatternLiteral,
      },
    },
    attributes: ['cell'],
    order: [
      [
        Sequelize.literal(`
          CASE
            WHEN LENGTH(cell) > LENGTH('${basePattern}') THEN
              CAST(SUBSTRING(cell, LENGTH('${basePattern}') + 1) AS INTEGER)
            ELSE 0
          END
        `),
        'DESC',
      ],
    ],
  });

  if (maxSuffixCell) {
    const regex = new RegExp(`${basePattern}(\\d+)`);
    const match = maxSuffixCell.cell.match(regex);

    if (match) {
      newSuffix = parseInt(match[1], 10) + 1;
    }
  }

  const uniqueCell = `${basePattern}${newSuffix}`;

  return uniqueCell;
};

export const associateMultipleEvents = async (
  multipleEventsAssociation: MultipleEventsAssociateDto[],
  company_id: number,
  user_id: number,
  department_id: number,
  transaction: Transaction,
) => {
  const eventIds = multipleEventsAssociation.map(({ event_id }) => event_id);

  // checking if passed events are exist and these events are linked to passed Company
  const eventsExist = await Event.findAll({
    where: {
      company_id,
      id: { [Op.in]: eventIds.map((event_id) => event_id) },
    },
    attributes: ['id'],
  });
  if (eventsExist.length !== eventIds.length)
    throw new NotFoundException(
      RESPONSES.notFound('Events') + ' against this company',
    );

  const eventUserPromises = multipleEventsAssociation.map(({ event_id }) => {
    return EventUser.findOrCreate({
      where: {
        user_id,
        event_id,
      },
      transaction,
    });
  });

  await Promise.all(eventUserPromises);

  if (department_id) {
    const eventDepartmentPromises = multipleEventsAssociation
      .filter(({ should_activate }) => should_activate)
      .map(({ event_id }) => {
        return EventDepartment.findOrCreate({
          where: {
            event_id,
            department_id,
          },
          transaction,
        });
      });

    await Promise.all(eventDepartmentPromises);
  }
};

export const usersAndEventsExist = async (
  event_ids: number[],
  user_ids: number[],
) => {
  const events = await Event.findAll({
    where: { id: { [Op.in]: event_ids } },
    attributes: ['id', 'name'],
  });
  if (event_ids?.length !== events.length)
    throw new NotFoundException(RESPONSES.notFound('Some Events'));

  const users = await User.findAll({
    where: { id: { [Op.in]: user_ids } },
    attributes: ['id', 'name'],
  });
  if (user_ids?.length !== users.length)
    throw new NotFoundException(RESPONSES.notFound('Some Users'));

  return { events, users };
};

export const sendUpdatedUserDivision = (
  data,
  userId: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.USER_CHANNEL}-${userId}`,
    [PusherEvents.ASSIGN_STAFF_TO_DEPARTMENT_AND_DIVISION],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
};

export const getAllEventUsersHelperV1 = async (
  filters: EventUsersQueryParamsDto,
  page: number,
  page_size: number,
  user: User,
) => {
  const {
    department_id,
    event_id,
    eventUsers,
    division_id,
    sort_column,
    order,
    division_ids,
    department_ids,
    csv_pdf,
    keyword,
  } = filters;

  const [company_id] = await withCompanyScope(user, event_id);

  const _division_ids = getQueryParamOrListParam(division_id, division_ids);
  const _department_ids = getQueryParamOrListParam(
    department_id,
    department_ids,
  );

  const userIds = (
    await User.findAll({
      where: getEventUsersWhereFilter(filters),
      attributes: ['id', 'name'],
      include: getAllEventUserIdsInclude(
        user,
        event_id,
        eventUsers,
        department_id,
        division_id,
        _department_ids,
        _division_ids,
        company_id,
        keyword,
      ),
      order: [['name', SortBy.ASC]],
    })
  ).map(({ id }) => id);

  const limit =
    page_size || (csv_pdf ? page_size : parseInt(process.env.PAGE_LIMIT, 10));

  const offset =
    (page && page_size) || csv_pdf
      ? page * page_size
      : parseInt(process.env.PAGE, 10);

  // Calculate the offset for pagination
  const array_offset = offset ?? 0;

  // Slice the event IDs based on pagination parameters
  const paginatedUserIds = userIds.slice(array_offset, array_offset + limit);

  const record = await User.findAll({
    where: { id: { [Op.in]: paginatedUserIds } },
    benchmark: true,
    logging: (...msg) => console.log(`Plucking User Id's`, msg[1] + 'ms'),
    attributes: getAllEventUsersAttributes(event_id),
    include: getAllEventUsersInclude(
      event_id,
      _department_ids,
      _division_ids,
      company_id,
      keyword,
    ),
    order: [
      Sequelize.literal(`${sort_column || 'name'} ${order || SortBy.ASC}`),
      [{ model: Image, as: 'images' }, 'primary', 'DESC'],
    ],
    subQuery: false,
  });

  // Count of users who are part of current event
  const activeUserCount = await getActiveUserCountForMultipleIds(
    event_id,
    user,
    company_id,
    filters,
    _division_ids,
    _department_ids,
    null,
  );

  const event = await eventDataForPdf(event_id);
  const users = await getUserRecordWithDivisionArray(record);

  return { users, event, activeUserCount, count: userIds.length };
};

export const eventUserWhere = (
  keyword: string,
  global_roles: boolean,
  user: User,
) => {
  const where: any = { [Op.and]: [] };

  where['blocked_at'] = { [Op.eq]: null };

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  if (global_roles) {
    const userRoleId = +user['role'];

    const shouldApplyRoleSpecificCondition =
      !isNaN(userRoleId) &&
      userRoleId in generalRoleConditions &&
      ![0, 28].includes(userRoleId);

    const generalRoleCondition = shouldApplyRoleSpecificCondition
      ? {
          [Op.or]: [
            {
              '$users_companies_roles.role_id$': {
                [Op.notIn]: generalRoleConditions[userRoleId],
              },
            },
            {
              id: {
                [Op.eq]: user.id,
              },
            },
          ],
        }
      : userRoleId in generalRoleConditions
        ? {
            '$users_companies_roles.role_id$': {
              [Op.notIn]: generalRoleConditions[userRoleId],
            },
          }
        : {};

    where[Op.and].push(generalRoleCondition);
  }
  return where;
};

export const eventUserMentionWhere = (keyword: string, user: User) => {
  const userRoleId = +user['role'];
  const where: any = { [Op.and]: [] };

  where['blocked_at'] = { [Op.eq]: null };

  if (keyword) {
    where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  const shouldApplyRoleSpecificCondition =
    !isNaN(userRoleId) &&
    userRoleId in generalRoleConditionsForMention &&
    ![0, 28].includes(userRoleId);

  const generalRoleCondition = shouldApplyRoleSpecificCondition
    ? {
        [Op.or]: [
          {
            '$users_companies_roles.role_id$': {
              [Op.notIn]: generalRoleConditionsForMention[userRoleId],
            },
          },
          {
            id: {
              [Op.eq]: user.id,
            },
          },
        ],
      }
    : userRoleId in generalRoleConditionsForMention
      ? {
          '$users_companies_roles.role_id$': {
            [Op.notIn]: generalRoleConditionsForMention[userRoleId],
          },
        }
      : {};

  where[Op.and].push(generalRoleCondition);

  return where;
};

export const userEventListingOrder = (
  sort_column: UsersSortingColumns,
  order: SortBy,
  available_staff: boolean,
): any => {
  const orderArray: any = [];

  if (available_staff) {
    orderArray.push(
      Sequelize.literal(`"status" ${SortBy.ASC}`),
      Sequelize.literal(`${sort_column || 'name'} ${order || SortBy.ASC}`),
    );
  } else {
    orderArray.push(
      Sequelize.literal(`${sort_column || 'name'} ${order || SortBy.ASC}`),
      [{ model: Image, as: 'images' }, 'primary', 'DESC'],
    );
  }

  return orderArray;
};

export const eventUserIdsattributes = (
  available_staff: boolean,
): (string | [Literal, string])[] => {
  return [
    'id',
    'name',
    'status',
    ...(available_staff
      ? ([
          [
            Sequelize.literal(`(
                SELECT d.name 
                FROM "departments" AS d
                INNER JOIN "department_users" AS ud ON ud."department_id" = d.id
                WHERE ud."user_id" = "User".id
                ORDER BY d.name ASC
                LIMIT 1
              )`),
            'department_name',
          ] as [Literal, string],

          [Sequelize.literal(`"last_scan"->>'scan_type'`), 'scan_type'] as [
            Literal,
            string,
          ],
        ] as [Literal, string][]) // Ensure TypeScript understands this is an array of tuples
      : []),
  ];
};

export const userCompanyRoleForDispatchStaff: any = (company_id: number) => [
  {
    model: UserCompanyRole,
    attributes: [],
    where: {
      role_id: {
        [Op.notIn]: [0, 28, 26, 27, 2, 32, 33, 35, 36, 37],
      },
      company_id,
    },
  },
];

export const getDispatchStaffWehre = (keyword: string) => {
  const _where: any = {};

  _where['blocked_at'] = { [Op.eq]: null };

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return _where;
};

// function to get all user data from nested objects
export const incidentStaffProccesedData = (users: User[]) => {
  return users
    .map((row) => {
      const user = row.get({ plain: true });

      // Extract and process divisions
      user.divisions = Array.from(
        new Map(
          (user.user_incident_divisions || [])
            .filter((division) => division.incident_division?.id) // Ensure it's not null
            .map((division) => [
              division?.incident_division.id,
              { ...division?.incident_division },
            ]),
        ).values(),
      );

      // Ensure location exists
      user.location = user.location || {};

      // Extract incident type
      user.incident_type =
        user.scans?.[0]?.dispatched_incident?.incident_types?.name || null;

      // Remove unnecessary properties
      delete user?.scans?.[0]?.dispatched_incident;
      delete user.user_incident_divisions;

      return {
        ...user,
        department_id: user.department?.[0]?.id || null,
        department_name: user.department?.[0]?.name || null,
        role: user.users_companies_roles?.[0]?.role?.name || null,
        incident_counts: user.incident_department_users?.length || 0,
        scan_type: user.last_scan?.scan_type || null,
        incident_id: user.last_scan?.incident_id || null,
      };
    })
    .map(
      ({
        department,
        incident_department_users,
        users_companies_roles,
        ...rest
      }) => rest,
    );
};

export const userCompanyRoleDataForIncidentStaff: any = (
  role: number,
  company_id: number,
) => [
  {
    model: UserCompanyRole,
    attributes: ['id'],
    where: {
      role_id: {
        [Op.notIn]: workforceRoleConditions[role]
          ? workforceRoleConditions[role]
          : [0, 28, 26, 27, 2, 32, 33, 36],
      },
      company_id,
    },
    include: [
      {
        model: Role,
        attributes: ['name'],
      },
    ],
  },
];

export const userIncidentListingOrder = (
  sortColumn: UsersIncidentSortingColumns,
  order: SortBy = SortBy.ASC,
) => {
  const orderArray = [];

  switch (sortColumn) {
    case 'status':
      orderArray.push([Sequelize.literal('"status"'), order]);
      break;

    case 'department_name':
      orderArray.push([
        { model: Department, as: 'department' },
        'name',
        order || SortBy.ASC,
      ]);
      break;

    case 'scan_type':
      orderArray.push(Sequelize.literal(`"last_scan"->>'scan_type' ${order}`));
      break;

    case 'incident_id':
    case 'incident_type':
      orderArray.push(
        Sequelize.literal(`"last_scan"->>'incident_id' ${order}`),
      );
      break;

    case 'created_at':
      orderArray.push(Sequelize.literal(`"created_at" ${order}`));
      break;

    case 'cell':
      orderArray.push(Sequelize.literal(`"cell" ${order}`));
      break;

    case 'email':
      orderArray.push(Sequelize.literal(`"email" ${order}`));
      break;

    case 'name':
      orderArray.push(Sequelize.literal(`"name" ${order}`));
      break;

    default:
      orderArray.push(Sequelize.literal(`"status" ${SortBy.ASC}`), [
        'name',
        SortBy.ASC,
      ]);
      break;
  }

  return orderArray;
};
