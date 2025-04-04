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
  BelongsToMany,
} from 'sequelize-typescript';
import { DotMapDot, DotShift } from '.';
import { Event } from '..';

@Table({
  schema: 'dotmap',
  tableName: 'shifts',
  underscored: true,
  timestamps: true,
})
export class DotMapShift extends Model {
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

  @HasMany(() => DotShift)
  dot_shifts: DotShift[];

  @BelongsToMany(() => DotMapDot, () => DotShift)
  dots: DotMapDot[];
}
