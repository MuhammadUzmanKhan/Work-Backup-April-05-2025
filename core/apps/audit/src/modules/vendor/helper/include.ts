import { IncludeOptions } from 'sequelize';
import {
  AuditShift,
  AuditStaff,
  Vendor,
  VendorPosition,
} from '@ontrack-tech-group/common/models';
import { shiftWhere } from '@Modules/staff/helper';
import { staffWhere } from '@Common/helpers';

export const vendorPositionStatsByShiftsInclude = (
  timezone: string,
  event_id: number,
  dates?: string[],
  priority?: boolean,
): IncludeOptions[] => {
  return [
    {
      model: AuditStaff,
      as: 'staff',
      required: true,
      where: staffWhere(priority),
      attributes: [], // Exclude staff details if not needed
      include: [
        {
          model: AuditShift,
          as: 'shift',
          where: shiftWhere({ event_id, dates, timezone }),
          attributes: [],
        },
        {
          model: Vendor,
          as: 'vendor',
          required: true,
          attributes: [], // Select specific vendor fields
        },
      ],
    },
  ];
};

export const vendorStatsByShiftsInclude = (
  priority?: boolean,
): IncludeOptions[] => [
  {
    model: AuditStaff,
    as: 'staff',
    where: staffWhere(priority),
    attributes: [], // Exclude staff details if not needed
    include: [
      {
        model: Vendor,
        as: 'vendor',
        attributes: [], // Select specific vendor fields
      },
    ],
  },
];

export const vendorStatsByShiftsWithPositionInclude = (
  position_id: number,
  vendor_id: number,
): IncludeOptions[] => [
  {
    model: AuditStaff,
    as: 'staff',
    required: true,
    attributes: [], // Exclude staff details if not needed
    include: [
      {
        model: VendorPosition,
        attributes: [],
        ...(position_id ? { where: { id: position_id } } : {}), // Conditionally add where clause
        required: !!position_id, // Only required if position_id is provided
      },
      {
        model: Vendor,
        as: 'vendor',
        attributes: [], // Select specific vendor fields
        where: {
          id: vendor_id,
        },
      },
    ],
  },
];
