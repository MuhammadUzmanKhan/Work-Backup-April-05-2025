import momentTimezone from 'moment-timezone';
import { Injectable } from '@nestjs/common';
import { Transaction } from 'sequelize';
import {
  DotMapDot,
  DotMapShift,
  DotShift,
  User,
} from '@ontrack-tech-group/common/models';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { ShiftsToCreateInterface } from '@Common/constants';
import { getAllShiftsHelper } from './helpers';
import { GetAllShifts } from './dto';

@Injectable()
export class ShiftService {
  // This function is for only creating shifts while creating dots using csv
  async bulkShiftsCreate(
    shifts: ShiftsToCreateInterface[],
    transaction: Transaction,
  ) {
    let newlyCreatedShifts: DotMapShift[] = [];
    const allShifts = {};

    // getting already created shift against this event, start_date and end_date
    const alreadyExistShifts = (await getAllShiftsHelper(shifts)).map(
      (_shift) => ({
        ..._shift,
        start_date: _shift.start_date.toISOString(),
        end_date: _shift.end_date.toISOString(),
      }),
    );

    // Filter out shifts that already exist
    const existingShiftsSet = new Set(
      alreadyExistShifts.map(
        (shift) => `${shift.start_date}-${shift.end_date}-${shift.name}`,
      ),
    );

    // Filter shifts wfrom already created as well as if duplicates in new shifts.
    const shiftsToBeCreate = shifts.filter((shift) => {
      const shiftKey = `${shift.start_date}-${shift.end_date}-${shift.name}`;
      if (!existingShiftsSet.has(shiftKey)) {
        existingShiftsSet.add(shiftKey);
        return true;
      }
      return false;
    });

    if (shiftsToBeCreate.length) {
      newlyCreatedShifts = await DotMapShift.bulkCreate(shiftsToBeCreate, {
        transaction,
      });
    }

    const combinedShifts = [
      ...newlyCreatedShifts.map((shift) => shift.get({ plain: true })),
      ...alreadyExistShifts,
    ];

    if (combinedShifts.length) {
      shifts.forEach((shift) => {
        const matchedShift = combinedShifts.find(
          (combinedShift) =>
            shift.start_date ===
              (typeof combinedShift.start_date === 'string'
                ? combinedShift.start_date
                : combinedShift.start_date.toISOString()) &&
            shift.end_date ===
              (typeof combinedShift.end_date === 'string'
                ? combinedShift.end_date
                : combinedShift.end_date.toISOString()),
        );

        if (!matchedShift) return;

        if (!allShifts[shift.pos_id]) {
          allShifts[shift.pos_id] = [];
        }

        allShifts[shift.pos_id].push({ ...matchedShift, ...shift });
      });
    }

    return allShifts;
  }

  async getAllShifts(getAllShifts: GetAllShifts, user: User) {
    const { event_id, vendor_id } = getAllShifts;
    const include = [];

    await withCompanyScope(user, event_id);

    if (vendor_id) {
      include.push({
        model: DotMapDot,
        where: { vendor_id },
        attributes: [],
        through: { attributes: [] },
      });
    }

    return await DotMapShift.findAll({
      where: { event_id },
      attributes: ['id', 'name', 'start_date', 'end_date'],
      include,
      order: [['start_date', SortBy.ASC]],
    });
  }
  async getAllShiftDates(event_id: number, user: User) {
    const [, , time_zone] = await withCompanyScope(user, event_id);

    const shiftDates = (
      await DotMapShift.findAll({
        where: { event_id },
        attributes: ['start_date'],
        include: [
          {
            model: DotMapDot,
            attributes: [],
            required: true,
          },
        ],
        order: [['start_date', SortBy.ASC]],
      })
    ).map((shift) =>
      momentTimezone.utc(shift.start_date).tz(time_zone).format('YYYY-MM-DD'),
    );

    return [...new Set(shiftDates)];
  }

  async getAllShiftsRates(getAllShifts: GetAllShifts, user: User) {
    const { event_id, vendor_id } = getAllShifts;
    const _where = {};

    await withCompanyScope(user, event_id);

    if (vendor_id) _where['vendor_id'] = vendor_id;

    return await DotShift.findAll({
      attributes: ['rate'],
      include: [
        {
          model: DotMapDot,
          where: { event_id, ..._where },
          attributes: [],
        },
      ],
      order: [['rate', SortBy.ASC]],
      group: [`"DotShift"."rate"`],
    });
  }
}
