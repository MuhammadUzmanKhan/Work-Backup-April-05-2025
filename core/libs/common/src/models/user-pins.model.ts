import { INTEGER, NUMBER, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { User, Event, Company, Inventory, MessageGroup, TaskList } from '.';

@Table({
  tableName: 'user_pins',
  underscored: true,
  timestamps: true,
})
export class UserPins extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @Column({ type: NUMBER })
  pinable_id: number;

  @Column({ type: STRING })
  pinable_type: string;

  @Column({ type: INTEGER })
  order: number;

  @BelongsTo(() => Event, { foreignKey: 'pinable_id', constraints: false })
  events: Event;

  @BelongsTo(() => Company, { foreignKey: 'pinable_id', constraints: false })
  companies: Company;

  @BelongsTo(() => Inventory, { foreignKey: 'pinable_id', constraints: false })
  inventories: Inventory;

  @BelongsTo(() => MessageGroup, {
    foreignKey: 'pinable_id',
    constraints: false,
  })
  message_groups: MessageGroup;

  @BelongsTo(() => User)
  users: User;

  @BelongsTo(() => TaskList, { foreignKey: 'pinable_id', constraints: false })
  task_lists: TaskList;
}
