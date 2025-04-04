import { STRING, BOOLEAN, INTEGER, Op } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import {
  Event,
  MessageGroup,
  Route,
  RouteShift,
  Scan,
  ShiftTime,
  User,
  UserShift,
  RidershipStatistics,
  HourEstimation,
} from '.';
import { getScanTypeByIndex } from '../helpers';
import { ESTIMATE_FOR, ScanType, SortBy } from '../constants';

@Table({
  tableName: 'shifts',
  underscored: true,
  timestamps: true,
})
export class Shift extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: BOOLEAN })
  active: boolean;

  @Column({ type: INTEGER })
  before_start_time: number;

  @BelongsTo(() => Event)
  events: Event;

  @HasMany(() => UserShift)
  user_shifts: UserShift[];

  @HasMany(() => HourEstimation)
  hour_estimations: HourEstimation[];

  @BelongsToMany(() => User, () => UserShift)
  users: User[];

  @HasMany(() => MessageGroup, {
    foreignKey: 'message_groupable_id',
    constraints: false,
    onDelete: 'CASCADE',
    scope: { message_groupable_type: 'Shift' },
    as: 'message_groups',
  })
  message_groups: MessageGroup[];

  @HasMany(() => Scan)
  scans: Scan[];

  @HasMany(() => RouteShift)
  route_shifts: RouteShift[];

  @BelongsToMany(() => Route, () => RouteShift)
  routes: Route[];

  @HasMany(() => ShiftTime)
  shift_times: ShiftTime[];

  @HasMany(() => RidershipStatistics)
  ridership_statistics: RidershipStatistics[];

  public static async getFirstAndLastShiftTimes(
    calendarDay: string,
    shiftTimes: ShiftTime[],
  ) {
    const passedDate = new Date(calendarDay);

    const allShiftTimes = shiftTimes
      .sort((a, b) => a.sequence - b.sequence)
      .map((time) => time.day_time);

    let firstShiftTime = allShiftTimes[0];
    let lastShiftTime = allShiftTimes[allShiftTimes.length - 1];

    try {
      firstShiftTime.setFullYear(
        passedDate.getFullYear(),
        passedDate.getMonth(),
        passedDate.getDate(),
      );

      const diff = this.shiftSpanInDays(allShiftTimes);
      if (diff > 0) {
        passedDate.setDate(passedDate.getDate() + diff);
      }

      lastShiftTime.setFullYear(
        passedDate.getFullYear(),
        passedDate.getMonth(),
        passedDate.getDate(),
      );
    } catch (error) {
      firstShiftTime = null;
      lastShiftTime = null;
    }
    return [firstShiftTime, lastShiftTime];
  }

  public static shiftSpanInDays(allShiftTimes) {
    let daysSpan = 0;

    allShiftTimes.forEach((shift, index) => {
      if (index === 0) return;

      const firstShiftInMinutes =
        allShiftTimes[index - 1].getHours() * 60 +
        allShiftTimes[index - 1].getMinutes();
      const lastShiftInMinutes = shift.getHours() * 60 + shift.getMinutes();

      if (firstShiftInMinutes > lastShiftInMinutes) {
        daysSpan += 1;
      }
    });

    return daysSpan;
  }

  public static async totalShiftHours(
    calendarDay: string,
    shiftTimes: ShiftTime[],
  ) {
    const [firstShiftTime, lastShiftTime] =
      await this.getFirstAndLastShiftTimes(calendarDay, shiftTimes);

    if (!firstShiftTime && !lastShiftTime) return 0;

    return (
      Math.abs(firstShiftTime.getTime() - lastShiftTime.getTime()) / 3600000
    );
  }

  public static async calculateHoursCompleted(
    scan: Scan,
    hourEstimation: HourEstimation,
    shiftTimes: ShiftTime[],
    shift?: Shift,
  ) {
    const shiftScanTypes: any = shiftTimes
      .map((shiftTime) => getScanTypeByIndex(shiftTime.scan_type))
      .filter((scanType) => scanType !== ScanType.BREAK_IN);

    let reclaimed: number, completed: number;
    let calculatedReclaimedHours: number | number[];

    if (shiftScanTypes.includes(getScanTypeByIndex(scan.scan_type))) {
      calculatedReclaimedHours = await this.calculateReclaimedHrs(
        scan,
        hourEstimation,
        shiftTimes,
      );
    } else
      calculatedReclaimedHours = await this.calculateReclaimedHrsWithPrevScan(
        scan,
        shiftTimes,
        shift,
        hourEstimation,
      );

    if ((calculatedReclaimedHours as number[])?.length) {
      reclaimed = calculatedReclaimedHours[0];
      completed = calculatedReclaimedHours[1];
    } else reclaimed = calculatedReclaimedHours as number;

    return [reclaimed, completed];
  }

  public static async calculateReclaimedHrs(
    scan: Scan,
    hourEstimation: HourEstimation,
    shiftTimes: ShiftTime[],
  ) {
    let reclaimed: number, completed: number;

    const calenderDay = scan.createdAt.toISOString().split('T')[0];
    const [, lastShiftTime] = await this.getFirstAndLastShiftTimes(
      calenderDay,
      shiftTimes,
    );

    if (!lastShiftTime) {
      return hourEstimation.reclaimed;
    }

    const difference = Math.abs(
      lastShiftTime.getTime() - scan.createdAt.getTime(),
    ); // This will give difference in milliseconds
    if (scan.createdAt <= lastShiftTime) {
      const resultInMinutes = Math.round(difference / 60000);
      reclaimed = resultInMinutes > 15 ? resultInMinutes : 0;
    } else completed = Math.round(difference / 60000);

    return [reclaimed, completed];
  }

  public static async calculateReclaimedHrsWithPrevScan(
    scan: Scan,
    shiftTimes: ShiftTime[],
    shift: Shift,
    hourEstimation: HourEstimation,
  ) {
    const calenderDay = scan.createdAt.toISOString().split('T')[0];
    const [firstShiftTime, lastShiftTime] =
      await this.getFirstAndLastShiftTimes(calenderDay, shiftTimes);
    const diffTime =
      shift.before_start_time || +process.env.START_SHIFT_BEFORE_TIME;
    let reclaimed = 0,
      completed = 0;

    const prevScan = await Scan.findOne({
      where: {
        user_id: scan.user_id,
        created_at: {
          [Op.between]: [
            new Date(firstShiftTime.getTime() - diffTime * 60000),
            new Date(lastShiftTime.getTime() + diffTime * 60000),
          ],
        },
        id: {
          [Op.lt]: scan.id,
        },
      },
      order: [['id', SortBy.DESC]],
    });

    if (
      prevScan &&
      ESTIMATE_FOR.includes(getScanTypeByIndex(prevScan.scan_type))
    ) {
      reclaimed =
        Math.abs(prevScan.createdAt.getTime() - scan.createdAt.getTime()) /
        60000;
    }

    if (
      prevScan &&
      !ESTIMATE_FOR.includes(getScanTypeByIndex(prevScan.scan_type)) &&
      getScanTypeByIndex(prevScan.scan_type) !== ScanType.CHECKED_IN
    ) {
      completed =
        Math.abs(prevScan.createdAt.getTime() - scan.createdAt.getTime()) /
        60000;
    }

    if (
      getScanTypeByIndex(scan.scan_type) === ScanType.CHECKED_IN &&
      !prevScan
    ) {
      if (!firstShiftTime) return hourEstimation.reclaimed;

      if (scan.createdAt < firstShiftTime) {
        completed =
          Math.abs(firstShiftTime.getTime() - scan.createdAt.getTime()) / 60000;
      } else
        reclaimed =
          Math.abs(firstShiftTime.getTime() - scan.createdAt.getTime()) / 60000;
    }

    return [reclaimed, completed];
  }
}
