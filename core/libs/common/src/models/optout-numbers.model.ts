import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  Unique,
  AllowNull,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'optout_numbers',
  underscored: true,
  timestamps: true,
})
export class OptoutNumbers extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Unique
  @AllowNull(false)
  @Column({ type: STRING })
  cell: string;
}
