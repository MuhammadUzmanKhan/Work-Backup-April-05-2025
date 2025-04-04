import { STRING, INTEGER, DOUBLE, BOOLEAN } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasOne,
} from 'sequelize-typescript';
import { Event, Image, User } from '.';

@Table({
  tableName: 'reference_maps',
  underscored: true,
  timestamps: true,
})
export class ReferenceMap extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: STRING })
  name: string;

  @BelongsTo(() => Event)
  event: Event;

  @Column({ type: DOUBLE })
  version: number;

  @Column({ type: BOOLEAN })
  current_version: boolean;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  creator_id: number;

  @BelongsTo(() => User)
  user: User;

  @HasOne(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'ReferenceMap' },
    constraints: false,
    as: 'reference_map_image',
  })
  reference_map_image: Image;
}
