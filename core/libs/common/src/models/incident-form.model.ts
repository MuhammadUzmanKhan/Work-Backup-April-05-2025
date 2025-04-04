import { STRING, BOOLEAN, INTEGER, TEXT, DATE } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  HasMany,
  HasOne,
  Sequelize,
} from 'sequelize-typescript';
import {
  Department,
  Event,
  Image,
  Incident,
  IncidentZone,
  Location,
  PersonInvolved,
  Representative,
  Witness,
} from '.';

@Table({
  tableName: 'incident_forms',
  underscored: true,
  timestamps: true,
})
export class IncidentForm extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: INTEGER })
  form_type: number;

  @Column({ type: BOOLEAN })
  is_incident: boolean;

  @Column({ type: BOOLEAN })
  witness: boolean;

  @Column({ type: BOOLEAN })
  police_report: boolean;

  @Column({ type: INTEGER })
  medical_treatment: number;

  @Column({ type: BOOLEAN })
  emergency_contact: boolean;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @ForeignKey(() => IncidentZone)
  @Column({ type: INTEGER })
  incident_zone_id: number;

  @ForeignKey(() => IncidentZone)
  @Column({ type: INTEGER })
  report_location_id: number;

  @Column({ type: TEXT })
  description: string;

  @Column({ type: STRING })
  reporter_first_name: string;

  @Column({ type: STRING })
  reporter_last_name: string;

  @Column({ type: STRING })
  mechanism_of_injury: string;

  @Column({ type: STRING })
  chief_complaint: string;

  @Column({ type: STRING })
  treatment_provided: string;

  @Column({ type: STRING })
  treatment_provided_by: string;

  @Column({ type: TEXT })
  patient_narrative: string;

  @Column({ type: INTEGER })
  source_type: number;

  @Column({ type: STRING })
  cad_incident_number: string;

  @Column({ type: INTEGER })
  report_type: number;

  @Column({ type: STRING })
  witness_name: string;

  @Column({ type: STRING })
  witness_cell: string;

  @Column({ type: STRING })
  witness_email: string;

  @Column({ type: DATE })
  time_report_taken: Date;

  @Column({ type: STRING })
  witness_country_code: string;

  @Column({ type: STRING })
  witness_country_iso_code: string;

  @Column({ type: STRING })
  note: string;

  @Column({ type: INTEGER })
  updated_by_id: number;

  @Column({ type: STRING })
  updated_by_type: string;

  @Column({ type: TEXT })
  vehicle_detail: string;

  @Column({ type: TEXT })
  hospital_detail: string;

  @Column({ type: TEXT })
  reporter_narrative: string;

  @Column({ type: STRING })
  treatment_location: string;

  @Column({ type: TEXT })
  reason: string;

  @Column({ type: INTEGER })
  affected_person: number;

  @Column({ type: STRING })
  section: string;

  @Column({ type: STRING })
  row: string;

  @Column({ type: STRING })
  seat: string;

  @Column({ type: STRING })
  reason_type: string;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsTo(() => IncidentZone, { foreignKey: 'incident_zone_id' })
  incident_zone: IncidentZone;

  @BelongsTo(() => IncidentZone, { foreignKey: 'report_location_id' })
  report_location: IncidentZone;

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'IncidentForm' },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  @HasOne(() => Location, {
    foreignKey: 'locationable_id',
    scope: { locationable_type: 'IncidentForm' },
    onDelete: 'CASCADE',
    as: 'location',
  })
  location: Location;

  @HasOne(() => Incident)
  incident: Incident;

  @HasMany(() => Witness)
  witnesses: Witness[];

  @HasMany(() => PersonInvolved)
  person_involveds: PersonInvolved[];

  @HasMany(() => Representative)
  representatives: Representative[];

  public static getMedicalTreatment: Literal = Sequelize.literal(`(
    CASE 
      WHEN "IncidentForm"."medical_treatment" IS NOT NULL THEN 
        CASE 
            WHEN "IncidentForm"."medical_treatment" = 0 THEN 'declined'
            WHEN "IncidentForm"."medical_treatment" = 1 THEN 'no'
            WHEN "IncidentForm"."medical_treatment" = 2 THEN 'yes'
          END
      ELSE NULL
    END
  )`);

  public static getFormType: Literal = Sequelize.literal(`(
    CASE 
      WHEN "IncidentForm"."form_type" IS NOT NULL THEN 
        CASE 
            WHEN "IncidentForm"."form_type" = 0 THEN 'medical'
            WHEN "IncidentForm"."form_type" = 1 THEN 'security'
            WHEN "IncidentForm"."form_type" = 2 THEN 'ejection'
          END
      ELSE NULL
    END
  )`);

  public static getSourceType: Literal = Sequelize.literal(`(
    CASE 
      WHEN "IncidentForm"."source_type" IS NOT NULL THEN 
        CASE 
            WHEN "IncidentForm"."source_type" = 0 THEN 'mobile'
            WHEN "IncidentForm"."source_type" = 1 THEN 'web'
          END
      ELSE NULL
    END
  )`);

  public static getReportType: Literal = Sequelize.literal(`(
    CASE 
      WHEN "IncidentForm"."report_type" IS NOT NULL THEN 
        CASE 
            WHEN "IncidentForm"."report_type" = 0 THEN 'medical_type'
            WHEN "IncidentForm"."report_type" = 1 THEN 'vehicle_type'
          END
      ELSE NULL
    END
  )`);
}
