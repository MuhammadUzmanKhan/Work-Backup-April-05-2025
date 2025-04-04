import { INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Incident, User } from '.';

@Table({
  tableName: 'user_incidents',
  underscored: true,
  timestamps: true,
})
export class UserIncidents extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Incident)
  @Column({ type: INTEGER })
  incident_id: number;

  @BelongsTo(() => User) // In its associated model user in rails, user_incidents are commented
  user: User;

  @BelongsTo(() => Incident) // In its associated model incident in rails, user_incidents are commented
  incident: Incident;
}
