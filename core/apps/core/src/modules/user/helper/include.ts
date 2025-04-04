import { Op, Sequelize } from 'sequelize';
import {
  Department,
  Event,
  EventUser,
  Image,
  IncidentDivision,
  Scan,
  User,
  UserIncidentDivision,
  Location,
  UserCompanyRole,
  Role,
} from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { userRoleInclude } from '@ontrack-tech-group/common/helpers';
import { userScanType } from '@Common/constants';
import { userCompanyData, userCompanyRoleData } from '.';

export const getAllEventUserIdsInclude = (
  user: User,
  event_id: number,
  eventUsers: boolean,
  department_id: number,
  division_id: number,
  _department_ids: number[],
  _division_ids: number[],
  company_id: number,
  keyword: string,
) => {
  const include: any = [
    {
      model: EventUser,
      where: { event_id },
      required: !!eventUsers,
      attributes: [],
    },
    {
      model: Department,
      where: department_id ? { id: { [Op.in]: _department_ids } } : {},
      attributes: [],
      through: { attributes: [] },
      required: true,
      include: [
        {
          model: Event,
          where: keyword ? { company_id } : { id: event_id },
          attributes: [],
          through: { attributes: [] },
          required: true,
        },
      ],
    },
    division_id
      ? {
          model: UserIncidentDivision,
          where: {
            ...(_division_ids?.length
              ? {
                  incident_division_id: { [Op.in]: _division_ids },
                }
              : {}),
          },
          attributes: ['id'],
          required: !!_division_ids?.length,
          include: [
            {
              model: IncidentDivision,
              where: { company_id },
              attributes: ['id', 'name'],
            },
          ],
        }
      : null,
    ...userCompanyRoleData(+user['role'], company_id),
  ].filter(Boolean);
  return include;
};

export const getAllEventUsersInclude = (
  event_id: number,
  _department_ids: number[],
  _division_ids: number[],
  company_id: number,
  keyword: string,
) => {
  const include: any = [
    {
      model: Image,
      attributes: [],
    },
    {
      model: Location,
      attributes: ['id', 'longitude', 'latitude', 'updated_at'],
    },
    {
      model: Department,
      where: _department_ids?.length
        ? { id: { [Op.in]: _department_ids } }
        : {},
      attributes: [],
      through: { attributes: [] },
      include: [
        {
          model: Event,
          where: keyword ? { company_id } : { id: event_id },
          attributes: [],
          through: { attributes: [] },
        },
      ],
    },
    {
      model: UserIncidentDivision,
      where: {
        ...(_division_ids?.length
          ? {
              incident_division_id: { [Op.in]: _division_ids },
            }
          : {}),
      },
      attributes: ['id'],
      required: !!_division_ids?.length,
      include: [
        {
          model: IncidentDivision,
          where: { company_id },
          attributes: ['id', 'name'],
        },
      ],
    },
    {
      model: Scan,
      where: { event_id, scan_type: { [Op.in]: userScanType } },
      attributes: [
        [Scan.getFormattedScanTypeByKey, 'scan_type'],
        'incident_id',
      ],
      required: false,
      order: [['createdAt', SortBy.DESC]],
      limit: 1,
    },
    ...userRoleInclude(company_id),
  ];
  return include;
};

export const getAllUserIdsInclude: any = () => {
  return [
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
  ];
};

export const getAllUsersInclude: any = () => {
  return [
    userCompanyData, // return user company information
    {
      model: Department,
      attributes: [],
      where: {
        company_id: {
          [Op.eq]: Sequelize.literal('"users_companies_roles"."company_id"'),
        },
      },
      required: false,
    },
    {
      model: UserIncidentDivision,
      attributes: ['id'],
      include: [
        {
          model: IncidentDivision,
          attributes: ['id', 'name'],
        },
      ],
    },
  ];
};
