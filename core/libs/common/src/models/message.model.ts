import { STRING, INTEGER, BOOLEAN, NUMBER, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  BeforeSave,
  HasOne,
} from 'sequelize-typescript';
import {
  Camper,
  Conversation,
  Event,
  Incident,
  IncidentMessageCenter,
  MessageGroup,
  Reservation,
  User,
} from '.';
import { MessageReceiverTypes, MessageTypes } from '../constants';

@Table({
  tableName: 'messages',
  underscored: true,
  timestamps: true,
})
export class Message extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: NUMBER })
  messageable_id: number;

  @Column({ type: STRING })
  messageable_type: string;

  @Column({ type: TEXT })
  text: string;

  @Column({ type: NUMBER })
  company_id: number;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @ForeignKey(() => User)
  @Column({ type: NUMBER })
  sender_id: number;

  @Column({ type: STRING })
  message_type: string;

  @Column({ type: BOOLEAN })
  unread: boolean;

  @Column({ type: STRING })
  receiver_name: string;

  @Column({ type: STRING })
  sender_name: string;

  @Column({ type: STRING })
  phone_number: string;

  @Column({ type: STRING })
  scan_type: string;

  @Column({ type: STRING })
  to_number: string;

  @Column({ type: STRING })
  from_number: string;

  @Column({ type: STRING })
  guest_country_code: string;

  @Column({ type: STRING })
  guest_country_iso_code: string;

  @BelongsTo(() => Camper, { foreignKey: 'messageable_id', constraints: false })
  camper: Camper;

  @BelongsTo(() => User, { foreignKey: 'messageable_id', constraints: false })
  user: User;

  @BelongsTo(() => User, {
    foreignKey: 'sender_id',
    constraints: false,
    as: 'sender',
  })
  sender: User;

  @BelongsTo(() => IncidentMessageCenter, {
    foreignKey: 'messageable_id',
    constraints: false,
  })
  incident_message_center: IncidentMessageCenter;

  @BelongsTo(() => Incident, {
    foreignKey: 'messageable_id',
    constraints: false,
  })
  incident: Incident;

  @BelongsTo(() => MessageGroup, {
    foreignKey: 'messageable_id',
    constraints: false,
  })
  message_group: MessageGroup;

  @BelongsTo(() => Reservation, {
    foreignKey: 'messageable_id',
    constraints: false,
  })
  reservation: Reservation;

  @BelongsTo(() => Event)
  event: Event;

  @HasOne(() => Conversation)
  conversations: Conversation[];

  @BeforeSave
  static async updateMessageType(message: Message) {
    if (message.message_type) return true;
    message.message_type =
      message.messageable_type === MessageReceiverTypes.EVENT
        ? MessageTypes.RECEIVED
        : MessageTypes.SENT;

    return message;
  }

  @BeforeSave
  static async updateReceiverName(message: Message) {
    if (
      message.messageable_type === MessageReceiverTypes.INCIDENT_MESSAGE_CENTER
    )
      return;
    let fullName: string;

    switch (message.message_type) {
      case MessageReceiverTypes.MESSAGE_GROUP:
        fullName = '';
        break;
      case MessageReceiverTypes.CAMPER:
        fullName = (await Camper.findByPk(message.messageable_id))?.name;
        break;
      case MessageReceiverTypes.EVENT:
        fullName = (await Event.findByPk(message.messageable_id))?.name;
        break;
      default:
        fullName = (await User.findByPk(message.messageable_id))?.name;
        break;
    }

    message.receiver_name = fullName;

    return message;
  }

  @BeforeSave
  static async setSenderName(message: Message) {
    if (
      message.messageable_type === MessageReceiverTypes.INCIDENT_MESSAGE_CENTER
    )
      return;

    const sender =
      message.message_type === MessageReceiverTypes.CAMPER
        ? await Camper.findByPk(message.messageable_id)
        : await User.findByPk(message.sender_id);
    message.sender_name = sender?.name;
    return message;
  }
}
