import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { RolePermission, UserCompanyRole } from '.';

@Table({
  tableName: 'roles',
  underscored: true,
  timestamps: true,
})
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  resource_type: string;

  @Column({ type: INTEGER })
  resource_id: number;

  @Column({ type: STRING })
  description: string;

  @HasMany(() => RolePermission)
  roles_permissions: RolePermission[];

  @HasMany(() => UserCompanyRole)
  users_companies_roles: UserCompanyRole[];
}
