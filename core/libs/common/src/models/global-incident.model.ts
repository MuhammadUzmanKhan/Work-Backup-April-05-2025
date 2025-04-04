import { INTEGER, TEXT, STRING, JSONB } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  HasMany,
  HasOne,
  BelongsTo,
} from 'sequelize-typescript';
import {
  Company,
  Event,
  Image,
  Incident,
  IncidentType,
  UserMessageConfig,
} from '.';

@Table({
  tableName: 'global_incidents',
  underscored: true,
  timestamps: true,
})
export class GlobalIncident extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @ForeignKey(() => IncidentType)
  @Column({ type: INTEGER })
  incident_type_id: number;

  @Column({ type: TEXT })
  description: string;

  @Column({ type: JSONB })
  extra_info: any;

  @Column({ type: STRING })
  color: string;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => IncidentType)
  incident_type: IncidentType;

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'GlobalIncident' },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  @HasOne(() => UserMessageConfig, {
    foreignKey: 'config_id',
    scope: { config_type: 'GlobalIncident' },
    constraints: false,
    as: 'user_message_config',
  })
  user_message_config: UserMessageConfig;

  @HasMany(() => Incident)
  incidents: Incident[];
}
