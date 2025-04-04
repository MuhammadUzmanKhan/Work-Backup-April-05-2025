import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { BadRequestException } from '@nestjs/common';
import {
  DotMapDot,
  DotMapShift,
  DotShift,
} from '@ontrack-tech-group/common/models';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { ShiftsToCreateInterface } from '@Common/constants';

export const getAllShiftsHelper = async (shifts: ShiftsToCreateInterface[]) => {
  // We need combination of start date and end date to check.
  const whereConditions = shifts.map((shift) =>
    Sequelize.literal(
      `(start_date = '${shift.start_date}' AND end_date = '${shift.end_date}')`,
    ),
  );

  return await DotMapShift.findAll({
    where: {
      event_id: shifts[0].event_id,
      [Op.or]: whereConditions,
    },
    attributes: ['id', 'name', 'start_date', 'end_date'],
    raw: true,
  });
};

export const getAllShiftsHelperForCopy = async (
  shifts: ShiftsToCreateInterface[],
) => {
  // We need combination of start date and end date to check.
  const whereConditions = shifts.map((shift) =>
    Sequelize.literal(
      `(start_date = '${shift.start_date}' AND end_date = '${shift.end_date}')`,
    ),
  );

  return await DotMapShift.findAll({
    where: {
      event_id: shifts[0].event_id,
      [Op.or]: whereConditions,
    },
    attributes: [
      'id',
      'name',
      'start_date',
      'end_date',
      [Sequelize.literal('"dot_shifts"."dot_id"'), 'dot_id'],
      [Sequelize.literal('"dot_shifts"."rate"'), 'rate'],
    ],
    include: [
      {
        model: DotShift,
        attributes: [],
        include: [
          {
            model: DotMapDot,
            attributes: [],
            where: { placed: true },
          },
        ],
      },
    ],
    raw: true,
  });
};

export const isShiftsExist = async (ids: number[]) => {
  const shiftCount = await DotShift.count({ where: { id: { [Op.in]: ids } } });

  if (shiftCount !== ids.length)
    throw new BadRequestException(RESPONSES.notFound('Some of shifts'));
};
