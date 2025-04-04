import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Event, EventContact } from '.';

@Table({
  tableName: 'contact_directories',
  underscored: true,
  timestamps: true,
})
export class ContactDirectory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => EventContact)
  @Column({ type: INTEGER })
  event_contact_id: number;
}
