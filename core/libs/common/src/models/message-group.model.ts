import { STRING, INTEGER, NUMBER, BOOLEAN, Sequelize } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  AfterCreate,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import {
  Company,
  Department,
  Event,
  InventoryZone,
  Route,
  Shift,
  Message,
  User,
  MessageGroupUsers,
  UserPins,
  IncidentDivision,
} from '.';
import { MessageType, PinableType } from '../constants';

@Table({
  tableName: 'message_groups',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class MessageGroup extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: NUMBER })
  message_groupable_id: number;

  @Column({ type: STRING })
  message_groupable_type: string;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: BOOLEAN })
  message_service: boolean;

  @Column({ type: INTEGER })
  message_type: number;

  @Column({ type: STRING })
  scan_type: string;

  @Column({ type: STRING })
  color_code: string;

  @BelongsTo(() => Event, {
    foreignKey: 'message_groupable_id',
    constraints: false,
  })
  event: Event;

  @BelongsTo(() => Department, {
    foreignKey: 'message_groupable_id',
    constraints: false,
  })
  department: Department;

  @BelongsTo(() => IncidentDivision, {
    foreignKey: 'message_groupable_id',
    constraints: false,
  })
  division: IncidentDivision;

  @BelongsTo(() => User, {
    foreignKey: 'message_groupable_id',
    constraints: false,
  })
  user: User;

  @BelongsTo(() => InventoryZone, {
    foreignKey: 'message_groupable_id',
    constraints: false,
  })
  inventory_zone: InventoryZone;

  @BelongsTo(() => Shift, {
    foreignKey: 'message_groupable_id',
    constraints: false,
  })
  shift: Shift;

  @BelongsTo(() => Route, {
    foreignKey: 'message_groupable_id',
    constraints: false,
  })
  route: Route;

  @HasMany(() => Message, {
    foreignKey: 'messageable_id',
    constraints: false,
    scope: { messageable_type: 'MessageGroup' },
    as: 'message_group_messages',
  })
  message_group_messages: Message[];

  @HasMany(() => MessageGroupUsers, { onDelete: 'CASCADE' })
  message_group_users: MessageGroupUsers[];

  @BelongsToMany(() => User, () => MessageGroupUsers)
  users: User[];

  @BelongsToMany(() => MessageGroup, () => MessageGroupUsers)
  associated_groups: MessageGroup[];

  @HasMany(() => UserPins, {
    foreignKey: 'pinable_id',
    constraints: false,
    scope: { pinable_type: PinableType.MESSAGE_GROUP },
    as: 'user_pin_message_groups',
  })
  user_pin_message_groups: MessageGroup[];

  @AfterCreate
  static async destroyNullMessageGroup() {
    await MessageGroup.destroy({ where: { message_groupable_id: null } });
  }

  public static getMessageTypeByKey = Sequelize.literal(`(CASE 
    WHEN "MessageGroup"."message_type" IS NOT NULL THEN 
      CASE 
           ${Object.entries(MessageType)
             .map(
               ([, value], index) =>
                 `WHEN "MessageGroup"."message_type" = ${index} THEN '${value
                   .toString()
                   .toLowerCase()}'`,
             )
             .join('\n')}
      END 
    ELSE NULL
  END)`);
}
