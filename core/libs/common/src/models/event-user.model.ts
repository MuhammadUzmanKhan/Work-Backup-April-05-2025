import { randomBytes } from 'crypto';
import { STRING, INTEGER, Transaction, Sequelize, Op } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  BeforeCreate,
  HasMany,
  AfterCreate,
  AfterBulkCreate,
  BeforeBulkCreate,
  BeforeDestroy,
} from 'sequelize-typescript';
import { User, Event, ChangeLog } from '.';
import { Editor, PolymorphicType } from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  sendChangeLogUpdate,
} from '../helpers';

@Table({
  tableName: 'event_users',
  underscored: true,
  timestamps: true,
})
export class EventUser extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @Column({ type: STRING })
  uid: string;

  @BelongsTo(() => Event)
  events: Event;

  @BelongsTo(() => User)
  users: User;

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: PolymorphicType.EVENT_USER },
    as: 'event_user_logs',
  })
  event_user_logs: ChangeLog[];

  // hooks
  @BeforeBulkCreate
  static async assingUserEventUidBulk(eventUsers: EventUser[]) {
    eventUsers.forEach((eventUser) => {
      const uid = `${eventUser.event_id}${eventUser.user_id}${randomBytes(
        10,
      ).toString('hex')}`;

      eventUser.uid = uid;
    });
  }

  @BeforeCreate
  static async assingUserEventUid(eventUser: EventUser) {
    const uid = `${eventUser.event_id}${eventUser.user_id}${randomBytes(
      10,
    ).toString('hex')}`;

    eventUser.uid = uid;
  }

  // Changelogs when user will associate with the event
  @AfterCreate
  static async createEventUserChangelogs(
    eventUser: EventUser,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const formattedEventUser = await this.getEventUserById([eventUser.id]);

        const changelog = {
          old_value: null,
          column: 'event',
          new_value: formattedEventUser[0]['event_name'],
          formatted_log_text: `Event '${formattedEventUser[0]['event_name']}' has been assigned`,
          change_logable_id: formattedEventUser[0]['user_id'],
          change_logable_type: PolymorphicType.USER,
          parent_changed_at: Date.now(),
          editor_type: PolymorphicType.USER,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.USER);
      });
    }
  }

  // Changelogs when user will associate with the event (BULK)
  @AfterBulkCreate
  static async associationEventUserBulk(
    eventUser: EventUser[],
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        try {
          const eventUserIds = eventUser.map(({ id }) => id);

          const createdEventUser = await this.getEventUserById(eventUserIds);

          const changeLogs = createdEventUser.map((eventUser) => ({
            old_value: null,
            column: 'event',
            new_value: eventUser['event_name'],
            formatted_log_text: `Event '${eventUser['event_name']}' has been assigned`,
            change_logable_id: eventUser['user_id'],
            change_logable_type: PolymorphicType.USER,
            parent_changed_at: Date.now(),
            editor_type: PolymorphicType.USER,
            editor_id: editor.editor_id,
            commented_by: editor.editor_name,
          }));

          if (changeLogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changeLogs);

            for (const changelog of bulkChangeLogs) {
              await sendChangeLogUpdate(
                changelog,
                editor,
                PolymorphicType.USER,
              );
            }
          }
        } catch (e) {
          console.log(e);
        }
      });
    }
  }

  // Changelogs for unassinging user to event
  @BeforeDestroy
  static async deleteUserCompanyChangelogs(
    eventUser: EventUser,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const formattedEventUser = await this.getEventUserById([eventUser.id]);

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          old_value: formattedEventUser[0]['event_name'],
          column: 'event',
          new_value: null,
          formatted_log_text: `Event '${formattedEventUser[0]['event_name']}' has been unassigned`,
          change_logable_id: formattedEventUser[0]['user_id'],
          change_logable_type: PolymorphicType.USER,
          parent_changed_at: Date.now(),
          editor_type: PolymorphicType.USER,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.USER);
      });
    }
  }

  static async getEventUserById(ids: number[]) {
    return await EventUser.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: [
        'id',
        'user_id',
        [Sequelize.literal(`"events"."name"`), 'event_name'],
      ],
      include: [
        {
          model: Event,
          attributes: [],
        },
      ],
      subQuery: false,
      raw: true,
      useMaster: true,
    });
  }
}
