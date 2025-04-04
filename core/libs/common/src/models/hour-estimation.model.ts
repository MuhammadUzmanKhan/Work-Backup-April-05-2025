import { FLOAT, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Day, Scan, Shift, ShiftTime, User } from '.';
import { getIndexOfScanType } from '../helpers';
import { ScanType } from '../constants';

@Table({
  tableName: 'hours_estimations',
  underscored: true,
  timestamps: true,
})
export class HourEstimation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Shift)
  @Column({ type: INTEGER })
  shift_id: number;

  @ForeignKey(() => Day)
  @Column({ type: INTEGER })
  day_id: number;

  @Column({ type: FLOAT })
  total: number;

  @Column({ type: FLOAT })
  completed: number;

  @Column({ type: FLOAT })
  reclaimed: number;

  @Column({ type: FLOAT })
  negative: number;

  @Column({ type: FLOAT })
  remaining: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Shift)
  shift: Shift;

  @BelongsTo(() => Day)
  day: Day;

  public static async updateEstimationForShiftDriver(scan: Scan) {
    const { hours_calculated, shift_id, user_id, day_id } = scan;

    if (hours_calculated) return;

    let hourEstimation: HourEstimation = null;

    const day = await Day.findByPk(day_id);

    if (day) {
      hourEstimation = await HourEstimation.findOne({
        where: {
          shift_id,
          user_id,
          day_id,
        },
      });
    }

    const shift = await Shift.findByPk(shift_id, {
      attributes: ['id'],
      include: [
        {
          model: ShiftTime,
        },
      ],
    });

    if (!hourEstimation && scan && day) {
      const shiftDay = scan.createdAt.toISOString().split('T')[0];

      const totalShiftHours = await Shift.totalShiftHours(
        shiftDay,
        shift?.shift_times,
      );

      hourEstimation = await HourEstimation.create({
        shift_id,
        user_id,
        day_id,
        total: totalShiftHours,
      });
    }

    const [reclaimed, completed] = await Shift.calculateHoursCompleted(
      scan,
      hourEstimation,
      shift?.shift_times,
      shift,
    );

    if (hourEstimation) {
      hourEstimation.reclaimed =
        +(hourEstimation.reclaimed + reclaimed / 60).toFixed(2) || 0;

      if (scan.scan_type === getIndexOfScanType(ScanType.END_SHIFT)) {
        hourEstimation.completed =
          +(hourEstimation.total - hourEstimation.reclaimed).toFixed(2) || 0;
      } else {
        hourEstimation.completed =
          +(hourEstimation.completed + completed / 60).toFixed(2) || 0;
      }

      hourEstimation.remaining =
        +(
          hourEstimation.total -
          hourEstimation.completed -
          hourEstimation.reclaimed
        ).toFixed(2) || 0;

      await hourEstimation.save();
      await scan.update({ hours_calculated: true });
    }
  }
}
