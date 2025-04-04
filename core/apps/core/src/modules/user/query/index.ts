import { Sequelize } from 'sequelize';

export const isEventDepartmentExist: any = (event_id: number) => {
  const attributes: any = [];

  if (event_id)
    attributes.push([
      Sequelize.literal(`
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM "event_departments" 
          WHERE "event_id" = ${event_id} 
            AND "department_id" = "department"."id"
        ) 
        THEN TRUE 
        ELSE FALSE 
      END
    `),
      'is_department_assigned',
    ]);

  return attributes;
};
