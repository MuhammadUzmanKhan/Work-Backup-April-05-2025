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
import { AuditStaff, Company } from '.';

@Table({
  tableName: 'vendor_positions',
  underscored: true,
  timestamps: true,
})
export class VendorPosition extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  name: string;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => AuditStaff)
  staff: AuditStaff[];
}
