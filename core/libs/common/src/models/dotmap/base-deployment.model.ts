import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { User, Event } from '..';

@Table({
  schema: 'dotmap',
  tableName: 'base_deployments',
  underscored: true,
  timestamps: true,
})
export class BaseDeployment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  url: string;

  @Column({ type: STRING })
  name: string;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Event)
  event: Event;
}
