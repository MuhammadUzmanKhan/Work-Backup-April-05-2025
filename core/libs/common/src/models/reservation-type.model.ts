import { STRING, INTEGER, NUMBER, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import {
  Event,
  InventoryZone,
  InventoryZoneReservationType,
  MessageGroup,
  ReservationStatistic,
} from '.';

@Table({
  tableName: 'reservation_types',
  underscored: true,
  timestamps: true,
})
export class ReservationType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: NUMBER })
  max_number_of_campers: number;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @Column({ type: NUMBER })
  deposit_amount: number;

  @Column({ type: BOOLEAN })
  take_deposit: boolean;

  @Column({ type: BOOLEAN })
  needs_parking: boolean;

  @Column({ type: STRING })
  color: string;

  @BelongsTo(() => Event)
  event: Event;

  @HasMany(() => InventoryZoneReservationType, { onDelete: 'CASCADE' })
  inventory_zone_reservation_types: InventoryZoneReservationType[];

  @BelongsToMany(() => InventoryZone, () => InventoryZoneReservationType)
  inventory_zones: InventoryZone[];

  @HasMany(() => MessageGroup, {
    foreignKey: 'message_groupable_id',
    constraints: false,
    scope: { message_groupable_type: 'ReservationType' },
    as: 'reservation_type_message_group',
  })
  reservation_type_message_group: MessageGroup[];

  @HasMany(() => ReservationStatistic)
  reservation_statistic: ReservationStatistic[];
}
