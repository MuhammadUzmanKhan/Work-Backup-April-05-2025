import { STRING, INTEGER, NUMBER, BOOLEAN, Op } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  BelongsTo,
  ForeignKey,
  AfterCreate,
} from 'sequelize-typescript';
import { User, IncidentType, EventContact, PriorityGuide, Event } from '.';

@Table({
  tableName: 'alerts',
  underscored: true,
  timestamps: true,
})
export class Alert extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @ForeignKey(() => EventContact)
  @Column({ type: NUMBER })
  event_contact_id: number;

  @ForeignKey(() => User)
  @Column({ type: NUMBER })
  user_id: number;

  @Column({ type: BOOLEAN })
  sms_alert: boolean;

  @Column({ type: BOOLEAN })
  email_alert: boolean;

  @Column({ type: NUMBER })
  alertable_id: number;

  @Column({ type: STRING })
  alertable_type: string;

  @BelongsTo(() => EventContact)
  event_contact: EventContact;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => IncidentType, {
    foreignKey: 'alertable_id',
    constraints: false,
  })
  incident_type: IncidentType;

  @BelongsTo(() => PriorityGuide, {
    foreignKey: 'alertable_id',
    constraints: false,
  })
  priority_guide: PriorityGuide;

  // hooks
  @AfterCreate
  static async checkAlertAlreadyExist(alert: Alert) {
    const {
      id,
      event_id,
      user_id,
      alertable_id,
      alertable_type,
      event_contact_id,
    } = alert;

    if (user_id) {
      await Alert.destroy({
        where: {
          event_id,
          user_id,
          alertable_id,
          alertable_type,
          id: { [Op.ne]: id },
        },
      });
    }

    if (event_contact_id) {
      await Alert.destroy({
        where: {
          event_id,
          event_contact_id,
          alertable_id,
          alertable_type,
          id: { [Op.ne]: id },
        },
      });
    }
  }
}
