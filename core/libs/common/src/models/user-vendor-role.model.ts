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
import { User, Event, VendorRole } from '.';

@Table({
  tableName: 'vendor_users',
  underscored: true,
  timestamps: true,
})
export class UserVendorRole extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  userId: number;

  @ForeignKey(() => VendorRole)
  @Column({ type: INTEGER })
  vendor_role_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => VendorRole)
  vendor_role: VendorRole;
}
