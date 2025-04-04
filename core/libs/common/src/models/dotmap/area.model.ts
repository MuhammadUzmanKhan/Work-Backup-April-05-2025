import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { DotMapDot } from '.';
import { Company } from '..';

@Table({
  schema: 'dotmap',
  tableName: 'areas',
  underscored: true,
  timestamps: true,
})
export class Area extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => DotMapDot)
  dots: DotMapDot[];
}
