import { STRING, INTEGER, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
  Sequelize,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import { Alert, Event } from '.';

@Table({
  tableName: 'priority_guides',
  underscored: true,
  timestamps: true,
})
export class PriorityGuide extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: INTEGER })
  priority: number;

  @Column({ type: STRING })
  description: string;

  @Column({ type: STRING })
  name: string;

  @Column({ type: BOOLEAN })
  scale_setting: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @HasMany(() => Alert, {
    foreignKey: 'alertable_id',
    constraints: false,
    scope: { alertable_type: 'PriorityGuide' },
    as: 'priority_guide_alerts',
  })
  priority_guide_alerts: Alert[];

  public static getPriorityNameByKey: Literal = Sequelize.literal(`(
    CASE 
      WHEN "PriorityGuide"."priority" IS NOT NULL THEN 
      CASE 
          WHEN "PriorityGuide"."priority" = 0 THEN 'low'
          WHEN "PriorityGuide"."priority" = 1 THEN 'medium'
          WHEN "PriorityGuide"."priority" = 2 THEN 'high'
          WHEN "PriorityGuide"."priority" = 3 THEN 'critical'
          ELSE NULL
        END
      ELSE NULL
    END
  )`);
}
