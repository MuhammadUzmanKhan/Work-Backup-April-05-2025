import { BOOLEAN, INTEGER, Sequelize, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Event, Incident } from '.';

@Table({
  tableName: 'resolved_incident_notes',
  underscored: true,
  timestamps: true,
})
export class ResolvedIncidentNote extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: INTEGER })
  status: number;

  @ForeignKey(() => Incident)
  @Column({ type: INTEGER })
  incident_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: TEXT })
  note: string;

  @Column({ type: INTEGER })
  affected_person: number;

  @Column({ type: BOOLEAN })
  is_edited: boolean;

  @BelongsTo(() => Incident)
  incident: Incident;

  @BelongsTo(() => Event)
  event: Event;

  public static getStatusNameByKey: any = Sequelize.literal(`(
    CASE 
        WHEN "ResolvedIncidentNote"."status" IS NOT NULL THEN 
        CASE 
            WHEN "ResolvedIncidentNote"."status" = 0 THEN 'arrest'
            WHEN "ResolvedIncidentNote"."status" = 1 THEN 'eviction_ejection'
            WHEN "ResolvedIncidentNote"."status" = 2 THEN 'hospital_transport'
            WHEN "ResolvedIncidentNote"."status" = 3 THEN 'treated_and_released'
            WHEN "ResolvedIncidentNote"."status" = 4 THEN 'resolved_note'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static getStatusNameByKeyInclude: any = Sequelize.literal(`(
    CASE 
        WHEN "resolved_incident_note"."status" IS NOT NULL THEN 
        CASE 
            WHEN "resolved_incident_note"."status" = 0 THEN 'arrest'
            WHEN "resolved_incident_note"."status" = 1 THEN 'eviction_ejection'
            WHEN "resolved_incident_note"."status" = 2 THEN 'hospital_transport'
            WHEN "resolved_incident_note"."status" = 3 THEN 'treated_and_released'
            WHEN "resolved_incident_note"."status" = 4 THEN 'resolved_note'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);
}
