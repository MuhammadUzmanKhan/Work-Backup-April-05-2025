import { STRING, INTEGER, DOUBLE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  HasMany,
  BelongsToMany,
  ForeignKey,
  HasOne,
} from 'sequelize-typescript';
import {
  Event,
  Image,
  Inventory,
  InventoryInventoryZone,
  InventoryZoneReservationType,
  MessageGroup,
  ReservationType,
} from '.';

@Table({
  tableName: 'inventory_zones',
  underscored: true,
  timestamps: true,
})
export class InventoryZone extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: DOUBLE })
  latitude: number;

  @Column({ type: DOUBLE })
  longitude: number;

  @Column({ type: STRING })
  color: string;

  @Column({ type: INTEGER })
  sequence: number;

  @BelongsTo(() => Event)
  events: Event;

  @HasMany(() => InventoryInventoryZone)
  inventory_inventory_zones: InventoryInventoryZone[];

  @BelongsToMany(() => Inventory, () => InventoryInventoryZone)
  inventories: Inventory[];

  @HasOne(() => Image, {
    foreignKey: 'imageable_id',
    constraints: false,
    scope: { imageable_type: 'InventoryZone' },
    as: 'inventory_zone_image',
    onDelete: 'CASCADE',
  })
  inventory_zone_image: Image;

  @HasMany(() => MessageGroup, {
    foreignKey: 'message_groupable_id',
    onDelete: 'CASCADE',
    scope: { message_groupable_type: 'InventoryZone' },
    as: 'inventory_zone_message_groups',
  })
  inventory_zone_message_groups: MessageGroup[];

  @HasMany(() => InventoryZoneReservationType, { onDelete: 'CASCADE' })
  inventory_zone_reservation_types: InventoryZoneReservationType[];

  @BelongsToMany(() => ReservationType, () => InventoryZoneReservationType)
  reservation_types: ReservationType[];
}
