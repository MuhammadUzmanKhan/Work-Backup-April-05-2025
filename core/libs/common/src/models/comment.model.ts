import { STRING, INTEGER, NUMBER, TEXT, BOOLEAN } from 'sequelize';
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
  CommentMention,
  Event,
  Incident,
  Inventory,
  LostAndFound,
  ServiceRequest,
  User,
} from '.';
import { IosInterruptionLevel, PolymorphicType } from '../constants';
import { pushNotificationJsonFormater } from '../helpers';
import { CommunicationService } from '../services';

@Table({
  tableName: 'comments',
  underscored: true,
  timestamps: true,
})
export class Comment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: NUMBER })
  commentable_id: number;

  @Column({ type: STRING })
  commentable_type: string;

  @Column({ type: TEXT })
  text: string;

  @ForeignKey(() => User)
  @Column({ type: NUMBER })
  creator_id: number;

  @Column({ type: STRING })
  creator_type: string;

  @Column({ type: NUMBER })
  event_id: number;

  @Column({ type: BOOLEAN })
  unread: boolean;

  @Column({ type: BOOLEAN })
  is_edited: boolean;

  @BelongsTo(() => Event, {
    foreignKey: 'commentable_id',
    constraints: false,
  })
  events: Event;

  @BelongsTo(() => LostAndFound, {
    foreignKey: 'commentable_id',
    constraints: false,
  })
  lost_and_found: LostAndFound;

  @BelongsTo(() => ServiceRequest, {
    foreignKey: 'commentable_id',
    constraints: false,
  })
  service_request: ServiceRequest;

  @BelongsTo(() => User, {
    foreignKey: 'commentable_id',
    constraints: false,
  })
  user: User;

  @BelongsTo(() => Incident, {
    foreignKey: 'commentable_id',
    constraints: false,
  })
  incident: Incident;

  @BelongsTo(() => User, {
    foreignKey: 'creator_id',
    constraints: false,
  })
  created_by: User;

  @BelongsTo(() => Inventory, {
    foreignKey: 'commentable_id',
    constraints: false,
  })
  inventory: Inventory;

  @HasMany(() => CommentMention, { onDelete: 'CASCADE' })
  comment_mentions: CommentMention[];

  static async sendIncidentCommentPushNotification(
    comment: Comment,
    communicationService: CommunicationService,
  ) {
    const { commentable_type, id } = comment;

    if (commentable_type !== PolymorphicType.INCIDENT) return;

    let _comment = await Comment.findByPk(id, {
      attributes: ['id'],
      include: [
        {
          model: Incident,
          attributes: ['id', 'company_id'],
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['cell'],
            },
            {
              model: Event,
              attributes: ['id', 'name', 'company_id', 'incident_future_v2'],
            },
          ],
        },
      ],
    });
    _comment = _comment.get({ plain: true });

    const event = _comment.incident.event;

    const users = _comment.incident.users;

    if (!users.length) return;

    const userNumbers = users.map((user) => user.cell);

    const notificationBody = pushNotificationJsonFormater(
      userNumbers,
      comment.text,
      `NEW COMMENT ON INCIDENT TICKET #${_comment.incident.id}`,
      {
        event_id: event.id,
        incident_id: _comment.incident.id,
        company_id: event.company_id,
        type: 'incident',
        incident_v2: event['incident_future_v2'],
      },
      event,
      IosInterruptionLevel.TIME_SENSITIVE,
    );

    try {
      await communicationService.communication(
        { notificationBody },
        'send-push-notification',
      );
    } catch (error) {
      console.log('send incident comment push notification error: ', error);
    }
  }
}
