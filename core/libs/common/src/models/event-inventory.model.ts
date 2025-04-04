import { INTEGER, BOOLEAN, DATE, JSONB } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  AfterCreate,
  AfterDestroy,
} from 'sequelize-typescript';
import { Event, Inventory } from '.';

@Table({
  tableName: 'event_inventories',
  underscored: true,
  timestamps: true,
})
export class EventInventory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @Column({ type: BOOLEAN })
  damaged: boolean;

  @Column({ type: DATE })
  time_received: Date;

  @Column({ type: DATE })
  time_deployed: Date;

  @Column({ type: DATE })
  time_returned: Date;

  @Column({ type: JSONB })
  last_scan: any;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  // hooks
  @AfterCreate
  static async updateInventoriesEventsIdOnCreate(inventory: Inventory) {
    console.log('🚀 ~ AFTER CREATE', inventory);
  }

  @AfterDestroy
  static async __updateInventoriesEventsIdOnDestroy(inventory: Inventory) {
    console.log('🚀 ~ AFTER DESTROY', inventory);
  }
}
