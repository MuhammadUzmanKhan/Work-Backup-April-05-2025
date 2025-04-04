import { STRING, INTEGER, TEXT, BOOLEAN } from 'sequelize';
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
  tableName: 'preset_messages',
  underscored: true,
  timestamps: true,
})
export class PresetMessage extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: TEXT })
  text: string;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  title: string;

  @Column({ type: TEXT })
  hot_key: string;

  @Column({ type: BOOLEAN, defaultValue: true })
  is_enabled: boolean;

  @BelongsTo(() => Event)
  event: Event;
}
