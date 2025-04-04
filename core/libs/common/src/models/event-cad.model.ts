import { STRING, INTEGER, TEXT, BOOLEAN, DOUBLE, Transaction } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
  AfterCreate,
  AfterBulkCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { ChangeLog, Event, User } from '.';
import {
  createChangeLog,
  handleAfterCommit,
  sendChangeLogUpdate,
} from '../helpers/change-logs';
import { Editor, PolymorphicType } from '../constants';
import { humanizeTitleCase } from '../helpers/format-case';

@Table({
  tableName: 'event_cads',
  underscored: true,
  timestamps: true,
})
export class EventCad extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: TEXT })
  url: string;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  comment: string;

  @Column({ type: DOUBLE })
  version: number;

  @Column({ type: STRING })
  type: string;

  @Column({ type: BOOLEAN })
  current_version: boolean;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  created_by: number;

  @Column({ type: STRING })
  created_by_name: string;

  @BelongsTo(() => Event)
  events: Event;

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: 'EventCad' },
    as: 'event_cads_logs',
  })
  event_cads_logs: ChangeLog[];

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    constraints: false,
  })
  creator: User;

  //hooks for changelogs
  @AfterCreate
  static async createEventCadChangeLog(
    eventCad: EventCad,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const fileType =
          eventCad['type'] === 'cad_file_1'
            ? 'Hi Rez Cad File 1'
            : 'Hi Rez Cad File 2';

        const changelog = {
          formatted_log_text: `Uploaded Event CAD '${eventCad.name}' File With Version '${eventCad.version}' against '${fileType}'`,
          change_logable_id: eventCad.event_id,
          change_logable_type: PolymorphicType.EVENT,
          column: 'event_cad',
          old_value: null,
          new_value: eventCad.name,
          editor_type: PolymorphicType.USER,
          editor_id: editor.editor_id,
          editor_name: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.EVENT);
      });
    }
  }

  @AfterBulkCreate
  static async bulkCreateEventCadLog(
    eventCads: EventCad[],
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const fileType =
          eventCads[0]['type'] === 'cad_file_1'
            ? 'Hi Rez Cad File 1'
            : 'Hi Rez Cad File 2';

        const changeLogs = eventCads.map((cad) => ({
          formatted_log_text: `Uploaded Event CAD '${cad.name}' File With Version '${cad.version}' against '${fileType}'`,
          change_logable_id: cad.event_id,
          change_logable_type: PolymorphicType.EVENT,
          column: 'event_cad',
          old_value: null,
          new_value: cad.name,
          editor_type: PolymorphicType.USER,
          editor_id: editor.editor_id,
          editor_name: editor.editor_name,
        }));

        if (changeLogs.length) {
          const bulkChangeLogs = await ChangeLog.bulkCreate(changeLogs);

          for (const changelog of bulkChangeLogs) {
            await sendChangeLogUpdate(changelog, editor, PolymorphicType.EVENT);
          }
        }
      });
    }
  }

  @BeforeUpdate
  static async updateEventCadChangelog(
    eventCad: EventCad,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    // Fetch the old state of EventCad before the update
    const oldEventCad = await this.getEventCadById(eventCad.id);

    // Define the fields to track for changes
    const mapping: Record<string, string> = {
      version: 'version',
      name: 'name',
      current_version: 'current_version',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Get the fields that have been modified in this update
        const changedFields = eventCad.changed() || [];

        // Map the changed fields to the properties we care about
        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        const updatedEventCad = await this.getEventCadById(eventCad.id);

        if (properties.length) {
          const changelogs = await this.formatEventCadChangeLog(
            properties,
            updatedEventCad,
            editor,
            oldEventCad,
          );

          if (changelogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

            for (const changelog of bulkChangeLogs) {
              await sendChangeLogUpdate(
                changelog,
                editor,
                PolymorphicType.EVENT,
              );
            }
          }
        }
      });
    }
  }

  static async formatEventCadChangeLog(
    properties: string[],
    eventCad: EventCad,
    editor: Editor,
    oldEventCad: EventCad,
  ) {
    const changelogs = [];
    const eventCadPlain = eventCad.get({ plain: true });
    const oldEventCadPlain = oldEventCad.get({ plain: true });

    for (const property of properties) {
      let text = '';
      const newValue = eventCadPlain[property];
      const oldValue = oldEventCadPlain[property];

      const fileType =
        eventCadPlain['type'] === 'cad_file_1'
          ? 'Hi Rez Cad File 1'
          : 'Hi Rez Cad File 2';

      switch (property) {
        case 'current_version':
          if (newValue) {
            text = `${humanizeTitleCase(property)} of '${fileType}' set to '${eventCadPlain['version']}'`;
            break;
          }
          continue;

        default:
          text = `Updated the ${humanizeTitleCase(property)} from '${oldValue}' to '${newValue}' against '${fileType}'`;
          break;
      }

      changelogs.push({
        old_value: oldValue,
        new_value: newValue,
        column: property,
        formatted_log_text: text,
        change_logable_id: eventCad.event_id,
        change_logable_type: PolymorphicType.EVENT,
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        editor_name: editor.editor_name,
      });
    }

    return changelogs;
  }

  static async getEventCadById(id: number) {
    return await EventCad.findByPk(id, {
      attributes: [
        'id',
        'version',
        'name',
        'current_version',
        'type',
        'event_id',
      ],
      useMaster: true,
    });
  }
}
