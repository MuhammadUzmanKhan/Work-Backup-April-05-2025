import { STRING, BOOLEAN, INTEGER, DOUBLE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  HasMany,
  BelongsToMany,
  HasOne,
  BelongsTo,
} from 'sequelize-typescript';
import {
  Day,
  DayRoute,
  Event,
  Image,
  LostAndFound,
  MessageGroup,
  RouteShift,
  Scan,
  Shift,
  RidershipStatistics,
  UserRoute,
  Zone,
  PolynomialPoint,
  CustomDirection,
} from '.';

@Table({
  tableName: 'routes',
  underscored: true,
  timestamps: true,
})
export class Route extends Model {
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

  @Column({ type: DOUBLE })
  latitude: number;

  @Column({ type: DOUBLE })
  longitude: number;

  @Column({ type: STRING })
  address: string;

  @Column({ type: STRING })
  color: string;

  @Column({ type: INTEGER })
  vehicle_type: number;

  @HasMany(() => DayRoute)
  day_routes: DayRoute[];

  @BelongsToMany(() => Day, () => DayRoute)
  days: Day[];

  @BelongsTo(() => Event)
  events: Event;

  @HasMany(() => MessageGroup, {
    foreignKey: 'message_groupable_id',
    constraints: false,
    onDelete: 'CASCADE',
    scope: { message_groupable_type: 'Route' },
    as: 'message_groups',
  })
  message_groups: MessageGroup[];

  @HasOne(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'Route' },
    as: 'route_image',
    onDelete: 'CASCADE',
  })
  route_image: Image;

  @HasMany(() => Scan)
  scans: Scan[];

  @HasMany(() => RouteShift)
  route_shifts: RouteShift[];

  @BelongsToMany(() => Shift, () => RouteShift)
  shifts: Shift[];

  @HasMany(() => UserRoute)
  user_route: UserRoute[];

  @HasMany(() => RidershipStatistics)
  ridership_statistics: RidershipStatistics[];

  @HasMany(() => LostAndFound)
  lost_and_founds: LostAndFound[];

  @HasMany(() => Zone)
  zones: Zone[];

  @HasMany(() => PolynomialPoint)
  polynomial_points: PolynomialPoint[];

  @HasMany(() => CustomDirection)
  custom_directions: CustomDirection[];
}
