import { STRING, INTEGER } from 'sequelize';
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
import { Company, EventVendors, Event, VendorUsers, User, AuditStaff } from '.';
@Table({
  tableName: 'vendors',
  underscored: true,
  timestamps: true,
})
export class Vendor extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  contact_name: string;

  @Column({ type: STRING })
  first_name: string;

  @Column({ type: STRING })
  last_name: string;

  @Column({ type: STRING })
  cell: string;

  @Column({ type: STRING })
  contact_email: string;

  @Column({ type: STRING })
  street: string;

  @Column({ type: STRING })
  city: string;

  @Column({ type: STRING })
  state: string;

  @Column({ type: STRING })
  zip: string;

  @Column({ type: STRING })
  contact_phone: string;

  @Column({ type: STRING })
  color: string;

  @Column({ type: STRING })
  note: string;

  @Column({ type: STRING })
  type: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsToMany(() => Event, () => EventVendors)
  events: Event[];

  @HasMany(() => EventVendors)
  event_vendors: EventVendors[];

  @HasMany(() => VendorUsers)
  vendor_users: VendorUsers[];

  @BelongsToMany(() => User, () => VendorUsers)
  users: User[];

  @HasMany(() => AuditStaff)
  staff: AuditStaff[];
}
