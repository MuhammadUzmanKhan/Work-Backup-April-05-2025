import { STRING, INTEGER, BOOLEAN, JSONB, TIME, DATE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Event, User } from '.';
import { MODULE_NAMES } from '../constants';

@Table({
  tableName: 'presets',
  underscored: true,
  timestamps: true,
})
export class Preset extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  module: MODULE_NAMES;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: JSONB })
  filters: any;

  @Column({ type: JSONB })
  additional_fields: any;

  @Column({ type: STRING })
  frequency: string;

  @Column({ type: STRING })
  email: string;

  @Column({ type: TIME })
  export_time: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  csv: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  pdf: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  disabled: boolean;

  @Column({ type: DATE })
  last_export_time: string;

  @Column({ type: INTEGER })
  buffer: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_pinned: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;
}
