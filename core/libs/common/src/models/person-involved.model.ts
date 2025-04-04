import { STRING, INTEGER, TEXT, DATE, Sequelize } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  HasMany,
} from 'sequelize-typescript';
import { Image, IncidentForm } from '.';
import { PolymorphicType } from '../constants';
import { Literal } from 'sequelize/types/utils';

@Table({
  tableName: 'person_involveds',
  underscored: true,
  timestamps: true,
})
export class PersonInvolved extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  first_name: string;

  @Column({ type: STRING })
  last_name: string;

  @Column({ type: INTEGER })
  gender: number;

  @Column({ type: STRING })
  cell: string;

  @Column({ type: TEXT })
  address: string;

  @Column({ type: STRING })
  email: string;

  @Column({ type: STRING })
  credential_type: string;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @Column({ type: STRING })
  id_proof_no: string;

  @ForeignKey(() => IncidentForm)
  @Column({ type: INTEGER })
  incident_form_id: number;

  @Column({ type: STRING })
  description: string;

  @Column({ type: STRING })
  mailing_address: string;

  @Column({ type: TEXT })
  location_detail: string;

  @Column({ type: TEXT })
  staff_detail: string;

  @Column({ type: DATE })
  birth_date: Date;

  @BelongsTo(() => IncidentForm)
  incident_form: IncidentForm;

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: PolymorphicType.PERSON_INVOLVED },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  public static getGender: Literal = Sequelize.literal(`(
    CASE 
      WHEN "person_involveds"."gender" IS NOT NULL THEN 
        CASE 
            WHEN "person_involveds"."gender" = 0 THEN 'female'
            WHEN "person_involveds"."gender" = 1 THEN 'male'
            WHEN "person_involveds"."gender" = 2 THEN 'other'
            WHEN "person_involveds"."gender" = 3 THEN 'prefer_not_to_say'
            END
      ELSE NULL
    END
  )`);
}
