import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { Cad, Company } from '.';

@Table({
  tableName: 'cad_types',
  underscored: true,
  timestamps: true,
})
export class CadType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  name: string;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Cad, {
    foreignKey: 'cad_type_id', // Explicitly set the foreign key here
    as: 'cads',
  })
  cads: Cad[];
}
