import { STRING, INTEGER, DATE, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Message, Reservation, CamperReservation, LostAndFound } from '.';

@Table({
  tableName: 'campers',
  underscored: true,
  timestamps: true,
  defaultScope: {
    attributes: {
      exclude: ['sender_cell'],
    },
  },
})
export class Camper extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: INTEGER })
  reservation_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  email: string;

  @Column({ type: STRING })
  cell: string;

  @Column({ type: STRING })
  shipping_address: string;

  @Column({ type: STRING })
  shipping_city: string;

  @Column({ type: STRING })
  shipping_zip: string;

  @Column({ type: STRING })
  shipping_country: string;

  @Column({ type: BOOLEAN })
  checked_in: boolean;

  @Column({ type: DATE })
  checked_in_time: Date;

  @Column({ type: INTEGER })
  pin: number;

  @Column({ type: BOOLEAN })
  vip: boolean;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @Column({ type: STRING })
  sender_cell: string;

  @HasMany(() => CamperReservation, { onDelete: 'CASCADE' })
  camper_reservations: CamperReservation[];

  @BelongsToMany(() => Reservation, () => CamperReservation)
  reservations: Reservation[];

  @HasMany(() => LostAndFound)
  lost_and_founds: LostAndFound[];

  @HasMany(() => Message, {
    foreignKey: 'messageable_id',
    scope: { messageable_type: 'Camper' },
    onDelete: 'CASCADE',
    as: 'camper_messages',
  })
  camper_messages: Message[];
}
