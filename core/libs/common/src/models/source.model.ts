import { STRING, INTEGER, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  HasMany,
  BelongsTo,
  BelongsToMany,
} from 'sequelize-typescript';
import { Company, Event, EventSource, Incident } from '.';

@Table({
  tableName: 'sources',
  underscored: true,
  timestamps: true,
})
export class Source extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: BOOLEAN })
  is_test: boolean;

  @HasMany(() => EventSource)
  event_sources: EventSource[];

  @BelongsToMany(() => Event, () => EventSource)
  events: Event;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Incident)
  incidents: Incident;
}
