import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
} from 'sequelize-typescript';
import { Permission, Role } from '.';

@Table({
  tableName: 'roles_permissions',
  underscored: true,
  timestamps: true,
})
export class RolePermission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Role)
  @Column({ type: INTEGER })
  role_id: number;

  @ForeignKey(() => Permission)
  @Column({ type: INTEGER })
  permission_id: number;

  @BelongsTo(() => Role)
  role: Role;

  @BelongsTo(() => Permission)
  permission: Permission;
}
