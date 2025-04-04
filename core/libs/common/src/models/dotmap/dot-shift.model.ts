import { INTEGER, FLOAT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { DotMapDot, DotMapShift } from '.';

@Table({
  schema: 'dotmap',
  tableName: 'dot_shifts',
  underscored: true,
  timestamps: true,
})
export class DotShift extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => DotMapDot)
  @Column({ type: INTEGER })
  dot_id: number;

  @ForeignKey(() => DotMapShift)
  @Column({ type: INTEGER })
  shift_id: number;

  @Column({ type: FLOAT })
  rate: number;

  @Column({ type: INTEGER })
  staff: number;

  @BelongsTo(() => DotMapDot)
  dot: DotMapDot;

  @BelongsTo(() => DotMapShift)
  shift: DotMapShift;
}
