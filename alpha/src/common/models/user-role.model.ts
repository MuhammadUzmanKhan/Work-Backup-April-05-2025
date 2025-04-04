import { UUIDV4 } from 'sequelize';
import { UUID } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Users, Role } from './index';

@Table({
  tableName: 'user_roles',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class UserRoles extends Model {
  @Index
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID, defaultValue: UUIDV4 })
  user_id: string;

  @BelongsTo(() => Users)
  user: Users;

  @ForeignKey(() => Role)
  @Column({ type: UUID, defaultValue: UUIDV4 })
  technology_id: string;

  @BelongsTo(() => Role)
  technology: Role;
}
