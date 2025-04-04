import {
  STRING,
  INTEGER,
  DATE,
  BOOLEAN,
  NUMBER,
  TEXT,
  JSONB,
  FLOAT,
  DATEONLY,
} from 'sequelize';
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
  Message,
  Camper,
  CamperReservation,
  Inventory,
  Event,
  LostAndFound,
  ServiceRequest,
  InventoryDamage,
} from '.';

@Table({
  tableName: 'reservations',
  underscored: true,
  timestamps: true,
})
export class Reservation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Inventory)
  @Column({ type: NUMBER })
  inventory_id: number;

  @Column({ type: STRING })
  title: string;

  @Column({ type: TEXT })
  note: string;

  @Column({ type: DATEONLY })
  from: Date;

  @Column({ type: DATEONLY })
  to: Date;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @Column({ type: NUMBER })
  status: number;

  // TODO: ForeignKey
  @Column({ type: NUMBER })
  inventory_type_id: number;

  @Column({ type: JSONB })
  last_scan: any;

  @Column({ type: NUMBER })
  number: number;

  // TODO: ForeignKey
  @Column({ type: STRING })
  order_id: string;

  @Column({ type: STRING })
  seat_access_id: string;

  @Column({ type: STRING })
  barcode_complete: string;

  @Column({ type: STRING })
  ticket: string;

  @Column({ type: FLOAT })
  damage_total: number;

  @Column({ type: FLOAT })
  amount_paid: number;

  @Column({ type: STRING })
  reservation_name: string;

  @Column({ type: NUMBER })
  no_of_campers: number;

  @Column({ type: STRING })
  inventory_uid: string;

  @Column({ type: BOOLEAN })
  deposit_paid: boolean;

  @Column({ type: STRING })
  inventory_zone_name: string;

  // TODO: ForeignKey
  @Column({ type: NUMBER })
  inventory_zone_id: number;

  @Column({ type: BOOLEAN })
  checkout: boolean;

  @Column({ type: BOOLEAN })
  excessive_damage: boolean;

  @Column({ type: FLOAT })
  excessive_damage_amount: number;

  @Column({ type: STRING })
  billing_first: string;

  @Column({ type: STRING })
  billing_last: string;

  @Column({ type: STRING })
  billing_email: string;

  @Column({ type: STRING })
  shipping_first: string;

  @Column({ type: STRING })
  shipping_last: string;

  @Column({ type: STRING })
  shipping_address: string;

  @Column({ type: STRING })
  shipping_address2: string;

  @Column({ type: STRING })
  shipping_city: string;

  @Column({ type: STRING })
  shipping_state: string;

  @Column({ type: STRING })
  shipping_zip: string;

  @Column({ type: STRING })
  shipping_country: string;

  @Column({ type: BOOLEAN })
  checked_in: boolean;

  @Column({ type: DATE })
  checked_in_time: Date;

  // TODO: ForeignKey
  @Column({ type: NUMBER })
  reservation_type_id: number;

  @Column({ type: DATE })
  checkout_time: Date;

  @HasMany(() => CamperReservation, { onDelete: 'CASCADE' })
  camper_reservations: CamperReservation[];

  @BelongsToMany(() => Camper, () => CamperReservation)
  campers: Camper[];

  @HasMany(() => Message, {
    foreignKey: 'messageable_id',
    scope: { messageable_type: 'Reservation' },
    onDelete: 'CASCADE',
    as: 'reservation_messages',
  })
  reservation_messages: Message[];

  @BelongsTo(() => Event)
  event: Event[];

  @BelongsTo(() => Inventory)
  inventory: Inventory[];

  @HasMany(() => LostAndFound)
  lost_and_founds: LostAndFound[];

  @HasMany(() => ServiceRequest)
  service_requests: ServiceRequest[];

  @HasMany(() => InventoryDamage)
  inventory_damage: InventoryDamage[];
}
