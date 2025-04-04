import { STRING, INTEGER, JSON, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasOne,
} from 'sequelize-typescript';
import { CadType, Event, Image } from '.';

@Table({
  tableName: 'cads',
  underscored: true,
  timestamps: true,
})
export class Cad extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: JSON })
  location: object;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => CadType)
  @Column({ type: INTEGER })
  cad_type_id: number;

  @Column({ type: INTEGER })
  updated_by: number;

  @Column({ type: STRING })
  updated_by_name: string;

  @Column({ type: BOOLEAN, defaultValue: true })
  active: boolean;

  @HasOne(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'Cad' },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => CadType)
  cad_type: CadType;
}
