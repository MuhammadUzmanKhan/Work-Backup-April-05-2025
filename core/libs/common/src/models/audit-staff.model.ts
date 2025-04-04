import { STRING, INTEGER, BOOLEAN, FLOAT, DATE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { AuditShift, Vendor, VendorPosition, AuditNote } from '.';

@Table({
  schema: 'audit',
  tableName: 'staff',
  underscored: true,
  timestamps: true,
  paranoid: true, // Enables soft deletes
  deletedAt: 'deleted_at', // Maps the `deletedAt` field to `deleted_at`
})
export class AuditStaff extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  qr_code: string;

  @Column({ type: DATE })
  aligned_checked_in: Date;

  @Column({ type: DATE })
  aligned_checked_out: Date;

  @Column({ type: BOOLEAN })
  is_flagged: boolean;

  @Column({ type: FLOAT })
  rate: number;

  @Column({ type: DATE })
  checked_in: Date;

  @Column({ type: DATE })
  checked_out: Date;

  @Column({ type: STRING })
  pos: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  addition!: boolean;

  @Column({ type: DATE, allowNull: true })
  deleted_at!: Date;

  @Column({ type: BOOLEAN, defaultValue: false })
  priority: boolean;

  @ForeignKey(() => Vendor)
  @Column({ type: INTEGER })
  vendor_id: number;

  @ForeignKey(() => VendorPosition)
  @Column({ type: INTEGER })
  vendor_position_id: number;

  @ForeignKey(() => AuditShift)
  @Column({ type: INTEGER })
  shift_id: number;

  @BelongsTo(() => Vendor)
  vendor: Vendor;

  @BelongsTo(() => AuditShift)
  shift: AuditShift;

  @BelongsTo(() => VendorPosition)
  vendor_position: VendorPosition;

  @HasMany(() => AuditNote, { foreignKey: 'staff_id' })
  notes: AuditNote[];
}
