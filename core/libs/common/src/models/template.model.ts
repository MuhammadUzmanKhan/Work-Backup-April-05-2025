import { STRING, INTEGER, JSONB } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'templates',
  underscored: true,
  timestamps: true,
})
export class Template extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  type: string;

  @Column({ type: JSONB })
  config: any;
}
