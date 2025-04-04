import { Sequelize } from 'sequelize-typescript';
import { User } from '@ontrack-tech-group/common/models';
import { isEventDepartmentExist } from '../query';

export const userCommonAttributes: any = [
  'id',
  'email',
  'name',
  'cell',
  'employee',
  'first_name',
  'last_name',
  'active',
  'last_scan',
  'country_code',
  'country_iso_code',
  'created_at',
  [Sequelize.literal(User.getStatusByUserKey), 'status'],
  [Sequelize.literal(`"department"."name"`), 'department_name'],
  [Sequelize.literal(`"department"."id"`), 'department_id'],
  [
    Sequelize.literal(`"user_incident_divisions->incident_division"."name"`),
    'division_name',
  ],
  [
    Sequelize.literal(`"users_companies_roles->company"."name"`),
    'company_name',
  ],
];

export const getAllEventUsersAttributes = (event_id: number) => {
  return [
    ...userCommonAttributes,
    [Sequelize.literal(`"images"."url"`), 'image_url'],
    [
      Sequelize.literal(`
        CASE 
          WHEN EXISTS (SELECT 1 FROM "event_users" 
          WHERE "user_id" = "User"."id" AND "event_id" = ${event_id}) 
          THEN TRUE 
          ELSE FALSE 
        END
      `),
      'is_event_assigned',
    ],
    [Sequelize.literal(`"last_scan"->>'incident_id'`), 'incident_id'],
    [Sequelize.literal(`"last_scan"->>'scan_type'`), 'scan_type'],
    [Sequelize.literal(`"last_scan"->>'incident_type'`), 'incident_type'],
    ...isEventDepartmentExist(event_id),
    [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
  ];
};

export const getAllUsersAttributes: any = [
  ...userCommonAttributes,
  [
    Sequelize.literal(
      '(CASE WHEN "User"."mfa_token" IS NOT NULL THEN TRUE ELSE FALSE END)',
    ),
    'mfa',
  ],
  'blocked_at',
  'demo_user',
  'reference_user',
  [
    Sequelize.literal(`"users_companies_roles->company"."name"`),
    'company_name',
  ],
  [Sequelize.literal(`"users_companies_roles"."role_id"`), 'role_id'],
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
];
