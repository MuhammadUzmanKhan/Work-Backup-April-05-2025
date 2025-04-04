import { INTEGER, STRING, BOOLEAN, JSONB } from 'sequelize';
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
import {
  Comment,
  Event,
  Image,
  Inventory,
  Reservation,
  StatusChange,
  User,
} from '.';

@Table({
  tableName: 'service_requests',
  underscored: true,
  timestamps: true,
})
export class ServiceRequest extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Reservation)
  @Column({ type: INTEGER })
  reservation_id: number;

  @Column({ type: STRING })
  request_type: string;

  @Column({ type: INTEGER })
  status: number;

  @Column({ type: STRING })
  note: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @Column({ type: STRING })
  closed_time: string;

  @Column({ type: STRING })
  updated_by: string;

  @Column({ type: BOOLEAN })
  unread: boolean;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: INTEGER })
  quantity: number;

  @Column({ type: STRING })
  updated_by_type: string;

  @Column({ type: INTEGER })
  created_by: number;

  @Column({ type: STRING })
  created_by_type: string;

  @Column({ type: INTEGER })
  priority: number;

  @Column({ type: STRING })
  order_number: string;

  @Column({ type: JSONB })
  extra_info: any;

  @BelongsTo(() => Reservation)
  reservation: Reservation;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => Comment, {
    foreignKey: 'commentable_id',
    scope: { commentable_type: 'ServiceRequest' },
    onDelete: 'CASCADE',
    as: 'comments',
  })
  comments: Comment[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'ServiceRequest' },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  @HasMany(() => StatusChange, {
    foreignKey: 'status_changeable_id',
    scope: { status_changeable_type: 'ServiceRequest' },
    constraints: false,
    as: 'status_changes',
  })
  status_changes: StatusChange[];
}
