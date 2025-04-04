import { STRING, INTEGER, DOUBLE, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Event } from '.';

@Table({
  tableName: 'camera_zones',
  underscored: true,
  timestamps: true,
})
export class CameraZone extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: DOUBLE })
  latitude: number;

  @Column({ type: DOUBLE })
  longitude: number;

  @Column({ type: TEXT })
  url: string;

  @Column({ type: STRING })
  device_id: string;

  @Column({ type: STRING })
  camera_type: string;

  @Column({ type: STRING })
  directions_monitored: string;

  @BelongsTo(() => Event)
  event: Event;
}
