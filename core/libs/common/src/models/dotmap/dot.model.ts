import { STRING, INTEGER, BOOLEAN, FLOAT, JSONB } from 'sequelize';
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
import {
  Area,
  DotMapVendor,
  Position,
  PositionName,
  DotShift,
  DotMapShift,
} from '.';
import { Event } from '..';

@Table({
  schema: 'dotmap',
  tableName: 'dots',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class DotMapDot extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => DotMapVendor)
  @Column({ type: INTEGER })
  vendor_id: number;

  @ForeignKey(() => Position)
  @Column({ type: INTEGER })
  position_id: number;

  @ForeignKey(() => PositionName)
  @Column({ type: INTEGER })
  position_name_id: number;

  @ForeignKey(() => Area)
  @Column({ type: INTEGER })
  area_id: number;

  @Column({ type: FLOAT })
  total_shift_hours: number;

  @Column({ type: STRING })
  pos_id: string;

  @Column({ type: BOOLEAN })
  base: boolean;

  @Column({ type: BOOLEAN })
  priority: boolean;

  @Column({ type: BOOLEAN })
  placed: boolean;

  @Column({ type: BOOLEAN })
  addition: boolean;

  @Column({ type: JSONB })
  location: any;

  @Column({ type: FLOAT })
  avg_rate: number;

  @Column({ type: FLOAT })
  total_rate: number;

  @Column({ type: BOOLEAN })
  missing: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => DotMapVendor)
  vendor: DotMapVendor;

  @BelongsTo(() => Position)
  position: Position;

  @BelongsTo(() => PositionName)
  position_name: PositionName;

  @BelongsTo(() => Area)
  area: Area;

  @HasMany(() => DotShift)
  dot_shifts: DotShift[];

  @BelongsToMany(() => DotMapShift, () => DotShift)
  shifts: DotMapShift[];
}
