import { INTEGER, STRING, FLOAT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event } from '.';

@Table({
  tableName: 'service_request_types',
  underscored: true,
  timestamps: true,
})
export class ServiceRequestType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  color: string;

  @Column({ type: INTEGER })
  service_type: number;

  @Column({ type: FLOAT })
  value: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => Event)
  event: Event;
}
