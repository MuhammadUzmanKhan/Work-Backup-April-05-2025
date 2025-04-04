import { STRING, INTEGER, DATE, JSONB, Sequelize } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  HasOne,
  BelongsTo,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import { Department, Event, Incident, Location, User } from '.';

@Table({
  tableName: 'live_videos',
  underscored: true,
  timestamps: true,
})
export class LiveVideo extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  channel_name: string;

  @Column({ type: STRING })
  uid: string;

  @Column({ type: STRING })
  channel_id: string;

  @Column({ type: INTEGER })
  role: number;

  @Column({ type: STRING })
  publisher_name: string;

  @Column({ type: STRING })
  video_type: string;

  @ForeignKey(() => Incident)
  @Column({ type: INTEGER })
  video_id: number;

  @Column({ type: INTEGER })
  video_mode: number;

  @Column({ type: DATE })
  streaming_start_at: Date;

  @Column({ type: DATE })
  streaming_end_at: Date;

  @Column({ type: INTEGER })
  streaming_request: number;

  @Column({ type: JSONB })
  agora_client: any;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @BelongsTo(() => Event)
  events: Event;

  @BelongsTo(() => Department)
  departments: Department;

  @BelongsTo(() => User)
  users: User;

  @BelongsTo(() => Incident)
  incident: Incident;

  @HasOne(() => Location, {
    foreignKey: 'locationable_id',
    scope: { locationable_type: 'LiveVideo' },
    onDelete: 'CASCADE',
    as: 'location',
  })
  location: Location;

  public static getLiveVideoMode: Literal = Sequelize.literal(`(
    CASE 
        WHEN "LiveVideo"."video_mode" IS NOT NULL THEN 
        CASE 
            WHEN "LiveVideo"."video_mode" = 0 THEN 'not_start'
            WHEN "LiveVideo"."video_mode" = 1 THEN 'live'
            WHEN "LiveVideo"."video_mode" = 2 THEN 'past'
            ELSE NULL
          END
        ELSE NULL
      END
    )
    `);

  public static getLiveVideoStreamingRequest: Literal = Sequelize.literal(`(
    CASE 
        WHEN "LiveVideo"."streaming_request" IS NOT NULL THEN 
        CASE 
            WHEN "LiveVideo"."streaming_request" = 0 THEN 'pending'
            WHEN "LiveVideo"."streaming_request" = 1 THEN 'accepted'
            WHEN "LiveVideo"."streaming_request" = 2 THEN 'rejected'
            ELSE NULL
          END
        ELSE NULL
      END
    )
    `);

  public static getLiveVideoRole: Literal = Sequelize.literal(`(
    CASE 
        WHEN "LiveVideo"."role" IS NOT NULL THEN 
        CASE 
            WHEN "LiveVideo"."role" = 1 THEN 'publisher'
            WHEN "LiveVideo"."role" = 2 THEN 'subscriber'
            ELSE NULL
          END
        ELSE NULL
      END
    )
    `);
}
