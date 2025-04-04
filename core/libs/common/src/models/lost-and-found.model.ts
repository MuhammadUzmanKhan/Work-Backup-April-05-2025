import { INTEGER, STRING, BOOLEAN, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import {
  Camper,
  Comment,
  Event,
  Image,
  Location,
  Reservation,
  Route,
  StatusChange,
  User,
} from '.';

@Table({
  tableName: 'lost_and_founds',
  underscored: true,
  timestamps: true,
})
export class LostAndFound extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Route)
  @Column({ type: INTEGER })
  route_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @Column({ type: TEXT })
  body: string;

  @Column({ type: TEXT })
  rider_name: string;

  @Column({ type: TEXT })
  rider_phone: string;

  @Column({ type: BOOLEAN })
  item_found: boolean;

  @Column({ type: INTEGER })
  status: number;

  @Column({ type: STRING })
  closed_time: string;

  @Column({ type: BOOLEAN })
  unread: boolean;

  @Column({ type: INTEGER })
  updated_by: number;

  @Column({ type: STRING })
  lost_and_found_type: string;

  @Column({ type: STRING })
  updated_by_type: string;

  @Column({ type: INTEGER })
  created_by: number;

  @Column({ type: STRING })
  created_by_type: string;

  @ForeignKey(() => Camper)
  @Column({ type: INTEGER })
  camper_id: number;

  @ForeignKey(() => Reservation)
  @Column({ type: INTEGER })
  reservation_id: number;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Route)
  route: Route;

  @BelongsTo(() => Reservation)
  reservation: Reservation;

  @BelongsTo(() => Camper)
  camper: Camper;

  @HasMany(() => Comment, {
    foreignKey: 'commentable_id',
    scope: { commentable_type: 'LostAndFound' },
    onDelete: 'CASCADE',
    as: 'comments',
  })
  comments: Comment[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'LostAndFound' },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  @HasMany(() => StatusChange, {
    foreignKey: 'status_changeable_id',
    scope: { status_changeable_type: 'LostAndFound' },
    constraints: false,
    as: 'status_changes',
  })
  status_changes: StatusChange[];

  @HasOne(() => Location, {
    foreignKey: 'locationable_id',
    scope: { locationable_type: 'LostAndFound' },
    onDelete: 'CASCADE',
    as: 'location',
  })
  location: Location;
}
