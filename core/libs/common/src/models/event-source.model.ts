import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event, Source } from '.';

@Table({
  tableName: 'event_sources',
  underscored: true,
  timestamps: true,
})
export class EventSource extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Source)
  @Column({ type: INTEGER })
  source_id: number;

  @BelongsTo(() => Event)
  events: Event;

  @BelongsTo(() => Source)
  sources: Source;
}
