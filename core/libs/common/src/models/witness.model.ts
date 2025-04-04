import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { IncidentForm } from '.';

@Table({
  tableName: 'witnesses',
  underscored: true,
  timestamps: true,
})
export class Witness extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  cell: string;

  @Column({ type: STRING })
  email: string;

  @Column({ type: STRING })
  first_name: string;

  @Column({ type: STRING })
  last_name: string;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @ForeignKey(() => IncidentForm)
  @Column({ type: INTEGER })
  incident_form_id: number;

  @BelongsTo(() => IncidentForm)
  incident_form: IncidentForm;
}
