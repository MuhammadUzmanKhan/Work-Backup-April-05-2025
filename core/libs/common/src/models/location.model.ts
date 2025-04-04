import { STRING, INTEGER, NUMBER, DOUBLE } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  AutoIncrement,
} from 'sequelize-typescript';
import { Incident, IncidentForm, User, Scan, LostAndFound, LiveVideo } from '.';

@Table({
  tableName: 'locations',
  underscored: true,
  timestamps: true,
})
export class Location extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: NUMBER })
  locationable_id: number;

  @Column({ type: STRING })
  locationable_type: string;

  @Column({ type: STRING })
  latitude: string;

  @Column({ type: STRING })
  longitude: string;

  @Column({ type: DOUBLE })
  distance: number;

  @Column({ type: STRING })
  eta: string;

  @Column({ type: DOUBLE })
  speed: number;

  @Column({ type: DOUBLE })
  battery_level: number;

  @Column({ type: NUMBER })
  event_id: number;

  @BelongsTo(() => Incident, {
    foreignKey: 'locationable_id',
    onDelete: 'CASCADE',
  })
  incident: Incident;

  @BelongsTo(() => User, {
    foreignKey: 'locationable_id',
    onDelete: 'CASCADE',
  })
  user: User;

  @BelongsTo(() => IncidentForm, {
    foreignKey: 'locationable_id',
    onDelete: 'CASCADE',
  })
  incident_form: IncidentForm;

  @BelongsTo(() => Scan, {
    foreignKey: 'locationable_id',
    onDelete: 'CASCADE',
  })
  scan: Scan;

  @BelongsTo(() => LostAndFound, {
    foreignKey: 'locationable_id',
    onDelete: 'CASCADE',
  })
  lost_and_found: LostAndFound;

  @BelongsTo(() => LiveVideo, {
    foreignKey: 'locationable_id',
    onDelete: 'CASCADE',
  })
  live_video: LiveVideo;
}
