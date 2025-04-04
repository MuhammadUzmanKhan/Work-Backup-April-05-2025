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
import { Company } from '..';
import { DotMapDot } from '.';

@Table({
  schema: 'dotmap',
  tableName: 'position_names',
  underscored: true,
  timestamps: true,
})
export class PositionName extends Model {
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
