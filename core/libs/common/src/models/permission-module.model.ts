import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'permission_modules',
  underscored: true,
  timestamps: true,
})
export class PermissionModule extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;
}
