import { Department, Event } from '@ontrack-tech-group/common/models';
import { Op, Sequelize } from 'sequelize';

export const taskDepartmentName: any = (include: string) => [
  Sequelize.literal(`"${include}event->departments"."name"`),
  'department_name',
];

export const taskDeparmentInclude: any = (event_id: number, model: string) => ({
  model: Event,
  where: { id: event_id },
  attributes: [],
  include: [
    {
      model: Department,
      attributes: [],
      through: { attributes: [] },
      where: {
        id: {
          [Op.eq]: Sequelize.literal(`"${model}"."department_id"`),
        },
      },
      required: false,
    },
  ],
});
