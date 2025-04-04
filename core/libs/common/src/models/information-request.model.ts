import { STRING, BOOLEAN, INTEGER, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
} from 'sequelize-typescript';

@Table({
  tableName: 'information_requests',
  underscored: true,
  timestamps: true,
})
export class InformationRequest extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER({ length: 64 }) })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  email: string;

  @Column({ type: TEXT })
  message: string;

  @Column({ type: STRING })
  company: string;

  @Column({ type: BOOLEAN })
  get_updates: boolean;
}
