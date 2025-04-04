import { INTEGER, DATEONLY, BOOLEAN, TIME, Sequelize } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import {
  DayRoute,
  Event,
  Route,
  Scan,
  UserShift,
  HourEstimation,
  RidershipStatistics,
} from '.';

@Table({
  tableName: 'days',
  underscored: true,
  timestamps: true,
})
export class Day extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: DATEONLY })
  calendar_day: Date;

  @Column({ type: DATEONLY })
  ends_at: Date;

  @Column({ type: BOOLEAN })
  day_scan: boolean;

  @Column({ type: TIME })
  start_time: any;

  @Column({ type: TIME })
  end_time: any;

  @Column({ type: INTEGER })
  date_type: number;

  @BelongsTo(() => Event)
  events: Event;

  @HasMany(() => Scan)
  scans: Scan[];

  @HasMany(() => UserShift)
  user_shifts: UserShift[];

  @HasMany(() => DayRoute)
  day_routes: DayRoute[];

  @HasMany(() => HourEstimation)
  hour_estimations: HourEstimation[];

  @BelongsToMany(() => Route, () => DayRoute)
  routes: Route[];

  @HasMany(() => RidershipStatistics)
  ridership_statistics: RidershipStatistics[];

  public static getTypeNameByKey: Literal = Sequelize.literal(`(
    CASE 
        WHEN "Day"."date_type" IS NOT NULL THEN 
        CASE 
            WHEN "Day"."date_type" = 0 THEN 'pre_show_date'
            WHEN "Day"."date_type" = 1 THEN 'post_show_date'
            WHEN "Day"."date_type" = 2 THEN 'show_date'
            ELSE NULL
          END
        ELSE NULL
      END
    )
`);
}
