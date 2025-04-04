import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { User, Event } from '.';
import { Vendor } from './vendor.model';

@Table({
  tableName: 'vendor_users',
  underscored: true,
  timestamps: true,
})
export class VendorUsers extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Vendor)
  @Column({ type: INTEGER })
  vendor_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Vendor)
  vendor: Vendor;
}
