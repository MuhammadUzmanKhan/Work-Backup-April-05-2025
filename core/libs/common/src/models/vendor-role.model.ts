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
} from 'sequelize-typescript';
import { Company, UserVendorRole } from '.';

@Table({
  tableName: 'vendor_roles',
  underscored: true,
  timestamps: true,
})
export class VendorRole extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  role: string;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => UserVendorRole, { onDelete: 'CASCADE' })
  vendor_roles: UserVendorRole[];
}
