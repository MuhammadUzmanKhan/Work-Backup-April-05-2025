import {
  Table,
  Model,
  Column,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { AuditStaff, User } from '.';

@Table({
  tableName: 'notes',
  schema: 'audit',
  underscored: true,
  timestamps: true,
})
export class AuditNote extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  message: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => AuditStaff)
  @Column({ type: DataType.INTEGER, allowNull: true })
  staff_id: number;

  @BelongsTo(() => AuditStaff)
  staff: AuditStaff;
}
