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
  tableName: 'representatives',
  underscored: true,
  timestamps: true,
})
export class Representative extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  first_name: string;

  @Column({ type: STRING })
  last_name: string;

  @Column({ type: STRING })
  department_name: string;

  @ForeignKey(() => IncidentForm)
  @Column({ type: INTEGER })
  incident_form_id: number;

  @BelongsTo(() => IncidentForm)
  incident_form: IncidentForm;
}
