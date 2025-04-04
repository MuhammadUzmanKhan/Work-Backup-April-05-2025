import { DATE, INTEGER, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Shift } from '.';

@Table({
  tableName: 'shift_times',
  underscored: true,
  timestamps: true,
})
export class ShiftTime extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Shift)
  @Column({ type: INTEGER })
  shift_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  comment: string;

  @Column({ type: INTEGER })
  scan_type: number;

  @Column({ type: DATE })
  day_time: Date;

  @Column({ type: INTEGER })
  sequence: number;

  @BelongsTo(() => Shift)
  shift: Shift;
}
