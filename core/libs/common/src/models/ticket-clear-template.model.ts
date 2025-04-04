import { STRING, INTEGER, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Event } from '.';

@Table({
  tableName: 'ticket_clear_templates',
  underscored: true,
  timestamps: true,
})
export class TicketClearTemplate extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  logo_url: string;

  @Column({ type: STRING })
  title: string;

  @Column({ type: TEXT })
  description: string;

  @Column({ type: STRING })
  ticket_image_url: string;

  @Column({ type: STRING })
  faq_url: string;

  @Column({ type: STRING })
  slug: string;

  @Column({ type: STRING })
  footer_text: string;

  @Column({ type: STRING })
  banner_url: string;

  @BelongsTo(() => Event)
  event: Event;
}
