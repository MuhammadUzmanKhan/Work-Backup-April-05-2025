import { UUIDV4 } from 'sequelize';
import { UUID, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AllowNull,
  Index,
  HasMany,
} from 'sequelize-typescript';
import { UserRoles } from './index';

@Table({
  tableName: 'roles',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Role extends Model {
  @Index
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @HasMany(() => UserRoles, { onDelete: 'CASCADE' })
  user_roles: UserRoles[];
}
