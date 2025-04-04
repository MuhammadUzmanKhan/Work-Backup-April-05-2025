import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { RolePermission } from './role-permission.model';

@Table({
  tableName: 'permissions',
  underscored: true,
  timestamps: true,
})
export class Permission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  type: string;

  @Column({ type: STRING })
  description: string;

  @HasMany(() => RolePermission)
  roles_permissions: RolePermission[];
}
