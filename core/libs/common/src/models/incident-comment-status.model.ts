import { DATE, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Incident, User } from '.';

@Table({
  tableName: 'incident_comment_statuses',
  underscored: true,
  timestamps: true,
  updatedAt: 'updated_at', // Map Sequelize's `updatedAt` to the database column `updated_at`
})
export class IncidentCommentStatus extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Incident)
  @Column({ type: INTEGER })
  incident_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => Incident)
  incidents: Incident;

  @BelongsTo(() => User)
  users: User;
}
