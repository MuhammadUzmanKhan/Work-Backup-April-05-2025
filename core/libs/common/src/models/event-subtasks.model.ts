import {
  STRING,
  BOOLEAN,
  INTEGER,
  TEXT,
  DATE,
  Transaction,
  Sequelize,
} from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  AfterCreate,
  AfterDestroy,
  BeforeUpdate,
} from 'sequelize-typescript';
import { ChangeLog, Event, Image } from '.';
import { Editor, PolymorphicType } from '../constants';
import {
  createChangeLog,
  formatDateTimeWithTimezone,
  handleAfterCommit,
  humanizeTitleCase,
  sendChangeLogUpdate,
} from '../helpers';
import { AppInjector } from '../controllers';
import { TranslateService } from '../services';

@Table({ tableName: 'event_subtasks', underscored: true, timestamps: true })
export class EventSubtasks extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: TEXT })
  description: string;

  @Column({ type: DATE })
  deadline: Date;

  @Column({ type: BOOLEAN })
  completed: boolean;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => Event)
  events: Event[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    constraints: false,
    scope: { imageable_type: 'EventSubtasks' },
    as: 'eventSubtasksAttachments',
  })
  eventSubtasksAttachments: Image[];

  // hooks for changelogs
  @AfterCreate
  static async createEventSubTaskChangeLog(
    subtask: EventSubtasks,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          formatted_log_text: `Created an Event Task '${subtask.name}'`,
          change_logable_id: subtask.event_id,
          change_logable_type: PolymorphicType.EVENT,
          column: 'subtask',
          editor_type: PolymorphicType.USER,
          old_value: null,
          new_value: subtask.name,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.EVENT);
      });
    }
  }

  @BeforeUpdate
  static async updateEventSubTaskChangelog(
    subTask: EventSubtasks,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    // Fetch the old state of the event before the update
    const oldEventSubTask = await this.getEventSubTaskById(subTask.id);

    // Define which fields we want to track for changes
    const mapping: Record<string, string> = {
      name: 'name',
      description: 'description',
      deadline: 'deadline',
      completed: 'completed',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Get the fields that have been modified in this update
        const changedFields = subTask.changed() || [];

        // Map the changed fields to the properties we care about
        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        const updatedEventSubTask = await this.getEventSubTaskById(subTask.id);

        if (properties.length) {
          // Generate the change logs for the modified properties
          const changelogs = await this.formatEventSubTaskChangeLog(
            properties,
            updatedEventSubTask,
            editor,
            oldEventSubTask,
          );

          if (changelogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

            const translateService =
              await AppInjector.resolve(TranslateService);

            for (const changelog of bulkChangeLogs) {
              const logs =
                await translateService.translateSingleChangLogToAllLanguages(
                  changelog,
                  PolymorphicType.EVENT,
                );

              await sendChangeLogUpdate(logs, editor, PolymorphicType.EVENT);
            }
          }
        }
      });
    }
  }

  @AfterDestroy
  static async deleteEventSubTaskChangeLog(
    subtask: EventSubtasks,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          formatted_log_text: `Deleted an Event Task '${subtask.name}'`,
          change_logable_id: subtask.event_id,
          change_logable_type: PolymorphicType.EVENT,
          column: 'subtask',
          editor_type: PolymorphicType.USER,
          old_value: subtask.name,
          new_value: null,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.EVENT);
      });
    }
  }

  static async formatEventSubTaskChangeLog(
    properties: string[],
    subtask: EventSubtasks,
    editor: Editor,
    oldSubTask: EventSubtasks,
  ) {
    const changelogs = [];
    const eventSubTaskPlain = subtask.get({ plain: true });
    const oldSubTaskEventPlain = oldSubTask.get({ plain: true });

    for (const property of properties) {
      let text = '';
      const newValue = eventSubTaskPlain[property];
      const oldValue = oldSubTaskEventPlain[property];

      switch (property) {
        case 'completed':
          text = `Updated the Status of Event Task '${subtask.name}' as ${newValue ? 'Completed' : 'Incomplete'}`;
          break;
        case 'deadline':
          text = `Updated the Deadline of Event Task '${subtask.name}' from '${oldValue ? formatDateTimeWithTimezone(oldValue, eventSubTaskPlain['time_zone']) : 'N/A'}' to '${newValue ? formatDateTimeWithTimezone(newValue, eventSubTaskPlain['time_zone']) : 'N/A'}'`;
          break;

        default:
          text = `${humanizeTitleCase(property)} of Event Task '${subtask.name}' has been updated from '${oldValue || 'N/A'}' to '${newValue || 'N/A'}'`;
          break;
      }

      changelogs.push({
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: subtask.event_id,
        change_logable_type: PolymorphicType.EVENT,
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        editor_name: editor.editor_name,
      });
    }

    return changelogs;
  }

  static async getEventSubTaskById(id: number) {
    return await EventSubtasks.findByPk(id, {
      attributes: [
        'id',
        'name',
        'description',
        'deadline',
        'completed',
        'event_id',
        [Sequelize.literal(`"events"."time_zone"`), 'time_zone'],
      ],
      include: [
        {
          model: Event,
          attributes: [],
        },
      ],
      useMaster: true,
    });
  }
}
