import { Op, Sequelize } from 'sequelize';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import {
  Company,
  CustomDirection,
  Day,
  Department,
  Event,
  Image,
  Location,
  Permission,
  PolynomialPoint,
  Role,
  RolePermission,
  Route,
  Scan,
  Shift,
  ShiftTime,
  User,
  UserCompanyRole,
  UserToken,
  Vendor,
  Zone,
} from '@ontrack-tech-group/common/models';
import { ImpersonateDto, VerifyPinDto } from '../dto';
import { TwilioService } from '../../../twilio/twilio.service';

/**
 * To get users
 */
export const userData = async (data: VerifyPinDto | ImpersonateDto) => {
  const user = await User.findOne({
    where: userDataWhere(data),
    attributes: [
      'id',
      'email',
      'name',
      'cell',
      'employee',
      'first_name',
      'last_name',
      'demo_user',
      'country_code',
      'country_iso_code',
      'language_code',
      'mfa_token',
      'blocked_at',
      'date_format',
      'time_format',
      'temperature_format',
      [
        Sequelize.literal(`(
          SELECT "images"."url" FROM "images" 
          WHERE "images"."imageable_id" = "User"."id" 
          AND "images"."imageable_type" = 'User'
          LIMIT 1
        )`),
        'image_url',
      ],
    ],
    include: [
      {
        model: UserCompanyRole,
        attributes: ['role_id'],
        required: false,
      },
    ],
  });
  if (!user) throw new BadRequestException('Invalid Pin');

  // IF BLOCKED USER
  if (user.blocked_at)
    throw new ForbiddenException('User is Temporarily Blocked');

  return user;
};

/**
 * To get users for Mobile
 */
export const userDataMobile = async (verifyPinDto: VerifyPinDto) => {
  const user = await User.findOne({
    where: userDataWhere(verifyPinDto),
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
      include: [
        [User.getStatusByUserKey, 'status'],
        [Sequelize.literal(`"images"."url"`), 'image_url'],
        [
          Sequelize.literal(`(
           	 SELECT JSON_AGG(JSON_BUILD_OBJECT(
              'id', "incident_divisions"."id",
              'name', "name",
              'company_id', "company_id"
            ))
            FROM "incident_divisions"
            INNER JOIN "user_incident_divisions" AS "uid"
            ON "incident_divisions"."id" = "uid"."incident_division_id"
            WHERE "uid"."user_id"= "User"."id"
          )`),
          'user_incident_divisions',
        ],
      ],
    },
    include: [
      {
        model: Department,
        attributes: { exclude: ['updatedAt'] },
        through: { attributes: [] },
      },
      {
        model: Event,
        attributes: ['id', 'name', 'active', 'archive'],
        as: 'events',
        through: { attributes: [] },
        include: [
          {
            model: Day,
            attributes: { exclude: ['updatedAt'] },
            include: [
              {
                model: Route,
                attributes: { exclude: ['updatedAt'] },
                through: { attributes: [] },
                include: [
                  {
                    model: Zone,
                    attributes: { exclude: ['updatedAt'] },
                  },
                  {
                    model: PolynomialPoint,
                    attributes: { exclude: ['updatedAt'] },
                  },
                  {
                    model: CustomDirection,
                    attributes: { exclude: ['updatedAt'] },
                  },
                  {
                    model: Shift,
                    attributes: { exclude: ['updatedAt'] },
                    through: { attributes: [] },
                    include: [
                      {
                        model: ShiftTime,
                        attributes: { exclude: ['updatedAt'] },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        model: Location,
        attributes: { exclude: ['updatedAt'] },
      },
      {
        model: Vendor,
        attributes: { exclude: ['updatedAt'] },
        through: { attributes: [] },
      },
      {
        model: Scan,
        attributes: { exclude: ['updatedAt'] },
      },
      {
        model: Image,
        attributes: [],
      },
    ],
    subQuery: false,
  });
  if (!user) throw new BadRequestException('Invalid Pin');

  // IF BLOCKED USER
  const _user = await user.get({ plain: true });

  if (_user.blocked_at)
    throw new ForbiddenException('User is Temporarily Blocked');

  // getting user associated companies
  const companies = await getUserCompanyData(user.id);

  _user['role'] = companies[0]['role'];

  return {
    ..._user,
    department: !_user.department?.length ? {} : _user.department[0],
    vendors:
      _user.vendors?.length && _user['role'] === 'vendor'
        ? _user.vendors[0]
        : {},
    location: !_user.location ? {} : _user.location,
    user_incident_divisions: !_user.user_incident_divisions
      ? []
      : _user.user_incident_divisions,
    companies,
  };
};

export const getUserCompanyData = async (id: number) => {
  return await UserCompanyRole.findAll({
    where: {
      user_id: id,
      blocked_at: {
        [Op.eq]: null,
      },
    },
    attributes: [
      'id',
      'role_id',
      'company_id',
      [Sequelize.literal(`"UserCompanyRole"."category"`), 'user_category'], // Specify table name for 'category'
      [Sequelize.literal(`"company"."name"`), 'company_name'],
      [Sequelize.literal(`"company"."logo"`), 'company_logo'],
      [Sequelize.literal(`"company"."category"`), 'category'],
      [Sequelize.literal(`"role"."name"`), 'role'],
      [
        Sequelize.literal(`EXISTS ( 
          SELECT 1 FROM "companies" 
          WHERE "companies"."parent_id" = "company"."id" 
        )`),
        'hasSubcompanies',
      ],
      [
        Sequelize.literal(`(
            SELECT array_agg("regions"."region_id")
           FROM "users_companies_roles_regions" AS "regions"
           WHERE "regions"."users_companies_roles_id" = "UserCompanyRole"."id")
        `),
        'region_ids',
      ],
      [Sequelize.literal(`"company"."parent_id"`), 'parent_company_id'],
    ],
    include: [
      {
        model: Company,
        attributes: [],
      },
      {
        model: Role,
        attributes: [],
      },
    ],
    raw: true,
    subQuery: false,
  });
};

/**
 * return token for a user
 */
export const userToken = async (user: User, jwt: JwtService) => {
  // Generate token
  const token = jwt.sign(user);
  if (token) {
    // adding user token in db
    await UserToken.create({
      token,
      user_id: user.id,
    });

    return token;
  } else {
    throw new BadRequestException('Invalid Pin');
  }
};

/**
 * return permission for a user
 */
export const getRoleAndPermission = async (userRoles: number[]) => {
  const rolePermission = await RolePermission.findAll({
    where: { role_id: { [Op.in]: userRoles } },
    attributes: [[Sequelize.literal(`DISTINCT "permission"."name"`), 'name']],
    include: [
      {
        model: Permission,
        attributes: [],
      },
    ],
    raw: true,
  });

  return rolePermission
    .map((item) => item['name'])
    .filter((item) => item !== null);
};

/**
 * user where clause
 */

const userDataWhere = (data: VerifyPinDto | ImpersonateDto) => {
  const _where = {};

  if (data['cell']) _where['cell'] = data['cell'];

  if (data['country_code']) _where['country_code'] = data['country_code'];

  if (data['id']) _where['id'] = data['id'];

  return _where;
};

export const _verifyPin = async (
  cell: string,
  code: string,
  pin: string,
  twilioService: TwilioService,
  demo?: boolean,
) => {
  try {
    if (demo) {
      const user = await User.findOne({
        where: { cell, pin, country_code: code },
        attributes: ['id'],
        raw: true,
      });

      return !!user;
    } else {
      const status = await twilioService.verifyPin(pin, code, cell);
      return status;
    }
  } catch (err) {
    return false;
  }
};
