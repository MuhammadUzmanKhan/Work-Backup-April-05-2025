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
  tableName: 'vendors',
  underscored: true,
  timestamps: true,
})
export class DotMapVendor extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  cell: string;

  @Column({ type: STRING })
  email: string;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @Column({ type: STRING })
  color: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => DotMapDot)
  dots: DotMapDot[];
}
