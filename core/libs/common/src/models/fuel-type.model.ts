import { INTEGER, JSONB, STRING } from 'sequelize';
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
import { Company, Inventory, Scan } from '.';

@Table({
  tableName: 'fuel_types',
  underscored: true,
  timestamps: true,
})
export class FuelType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: JSONB })
  stats: any;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Inventory)
  inventories: Inventory[];

  @HasMany(() => Scan)
  scans: Scan[];
}
