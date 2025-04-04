import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  HasMany,
} from 'sequelize-typescript';
import { PointOfInterest } from '.';

@Table({
  tableName: 'point_of_interest_types',
  underscored: true,
  timestamps: true,
})
export class PointOfInterestType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  color: string;

  @HasMany(() => PointOfInterest)
  point_of_interests: PointOfInterest[];
}
