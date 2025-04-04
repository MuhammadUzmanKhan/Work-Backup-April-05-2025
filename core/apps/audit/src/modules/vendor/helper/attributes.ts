import { ProjectionAlias, Sequelize } from 'sequelize';

export const vendorPositionStatsByShiftsAttributes: ProjectionAlias[] = [
  [Sequelize.col('"staff"."shift"."id"'), 'id'],
  [Sequelize.col('"staff"."shift"."name"'), 'name'],
  ['id', 'parent_id'],
  ['name', 'parent_name'],
  [
    Sequelize.literal('COUNT("staff"."id")::INTEGER'),
    'staff_count', // Total count of staff members
  ],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "staff"."checked_in" IS NOT NULL THEN 1 END)::INTEGER',
    ), // Counts the number of staff records where checked_in is not null
    'checked_in', // Count of checked-in staff
  ],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "staff"."checked_out" IS NOT NULL THEN 1 END)::INTEGER',
    ),
    'checked_out', // Count of checked-in staff
  ],
];

export const vendorStatsByShiftsAttributes: (string | ProjectionAlias)[] = [
  'id',
  'name',
  [Sequelize.col('"staff"."vendor"."id"'), 'parent_id'],
  [Sequelize.col('"staff"."vendor"."name"'), 'parent_name'],
  [
    Sequelize.literal('COUNT("staff"."id")::INTEGER'),
    'staff_count', // Total count of staff members
  ],
  [
    Sequelize.literal(
      'COUNT(CASE WHEN "staff"."checked_in" IS NOT NULL THEN "staff"."id" END)::INTEGER',
    ),
    'checked_in', // Count of checked-in staff
  ],
];
