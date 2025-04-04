import { INTEGER, JSONB, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { User } from '.';

@Table({
  tableName: 'filters',
  underscored: true,
  timestamps: true,
})
export class Filter extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  filter_type: string;

  @Column({ type: JSONB })
  filter_params: any;

  @Column({ type: STRING })
  filter_name: string;

  @BelongsTo(() => User)
  user: User;
}
