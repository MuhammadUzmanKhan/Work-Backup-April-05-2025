import { STRING, INTEGER, DATE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { AuditStaff, Event } from '.';

@Table({
  schema: 'audit',
  tableName: 'shifts',
  underscored: true,
  timestamps: true,
})
export class AuditShift extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: DATE })
  start_date: Date;

  @Column({ type: DATE })
  end_date: Date;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => Event)
  events: Event;

  @HasMany(() => AuditStaff)
  staff: AuditStaff[];
}
