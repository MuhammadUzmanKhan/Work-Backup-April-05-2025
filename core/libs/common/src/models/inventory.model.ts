import { STRING, BOOLEAN, INTEGER, DATE, TEXT, JSONB } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import {
  Assignment,
  Comment,
  Company,
  Department,
  Event,
  EventInventory,
  FuelType,
  Image,
  Incident,
  InventoryDamage,
  InventoryInventoryZone,
  InventoryType,
  InventoryZone,
  Location,
  Reservation,
  Scan,
  ServiceRequest,
  User,
  UserInventory,
  UserPins,
} from '.';
import { PinableType } from '../constants';

@Table({
  tableName: 'inventories',
  underscored: true,
  timestamps: true,
})
export class Inventory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  unique_code: string;

  @Column({ type: DATE })
  time_received: Date;

  @Column({ type: DATE })
  time_deployed: Date;

  @Column({ type: DATE })
  time_returned: Date;

  @ForeignKey(() => InventoryType)
  @Column({ type: INTEGER })
  inventory_type_id: number;

  @ForeignKey(() => FuelType)
  @Column({ type: INTEGER })
  fuel_type_id: number;

  // @ForeignKey(() => Company)
  @Column({ type: STRING })
  uid: string;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @Column({ type: BOOLEAN })
  rented: boolean;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: TEXT })
  events_id: string;

  @Column({ type: JSONB })
  last_scan: any;

  @Column({ type: INTEGER })
  parent_id: number;

  @Column({ type: TEXT })
  description: string;

  @Column({ type: TEXT })
  location_description: string;

  @Column({ type: INTEGER })
  fuel_total: number;

  @Column({ type: TEXT })
  designation: string;

  @Column({ type: BOOLEAN })
  enabled: boolean;

  @ForeignKey(() => InventoryZone)
  @Column({ type: INTEGER })
  inventory_zone_id: number;

  @Column({ type: BOOLEAN })
  damaged: boolean;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => UserInventory, { onDelete: 'CASCADE' })
  user_inventories: UserInventory[];

  @BelongsToMany(() => User, () => UserInventory)
  users: User[];

  @HasMany(() => EventInventory)
  event_inventories: EventInventory[];

  @BelongsToMany(() => Event, () => EventInventory)
  events: Event[];

  @HasMany(() => Inventory, { foreignKey: 'parent_id' })
  accessories: Inventory[];

  @BelongsTo(() => Inventory, { foreignKey: 'parent_id' })
  parent: Inventory;

  @HasMany(() => Scan, { onDelete: 'CASCADE' })
  scans: Scan[];

  @HasMany(() => Incident)
  incidents: Incident[];

  @BelongsTo(() => InventoryType)
  inventory_type: InventoryType;

  @HasMany(() => InventoryInventoryZone)
  inventory_inventory_zones: InventoryInventoryZone[];

  @BelongsToMany(() => InventoryZone, () => InventoryInventoryZone)
  inventory_zones: InventoryZone[];

  @BelongsTo(() => FuelType)
  fuel_type: FuelType;

  @HasMany(() => Reservation)
  reservations: Reservation[];

  @HasMany(() => Assignment)
  assignments: Assignment[];

  @HasMany(() => UserPins, {
    foreignKey: 'pinable_id',
    constraints: false,
    scope: { pinable_type: PinableType.INVENTORY },
    as: 'user_pin_inventory',
  })
  user_pin_inventory: UserPins[];

  @HasMany(() => ServiceRequest)
  service_requests: ServiceRequest[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'Inventory' },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  @HasMany(() => Location, {
    foreignKey: 'locationable_id',
    constraints: false,
    scope: { locationable_type: 'Inventory' },
    as: 'inventory_location',
  })
  location: Location;

  @HasMany(() => Comment, {
    foreignKey: 'commentable_id',
    constraints: false,
    scope: { commentable_type: 'Inventory' },
    as: 'comments',
  })
  comments: Comment[];

  @HasMany(() => InventoryDamage)
  inventory_damage: InventoryDamage[];
}
