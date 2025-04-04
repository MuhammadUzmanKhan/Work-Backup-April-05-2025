import { STRING, INTEGER, BOOLEAN, DOUBLE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Event, PointOfInterestType } from '.';

@Table({
  tableName: 'point_of_interests',
  underscored: true,
  timestamps: true,
})
export class PointOfInterest extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => PointOfInterestType)
  @Column({ type: INTEGER })
  poi_type_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: DOUBLE })
  latitude: number;

  @Column({ type: DOUBLE })
  longitude: number;

  @Column({ type: BOOLEAN })
  active: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => PointOfInterestType)
  point_of_interest_type: PointOfInterestType;
}
