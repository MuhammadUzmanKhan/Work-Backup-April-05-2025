import moment from 'moment-timezone';
import 'moment-timezone';
import { Transaction } from 'sequelize';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  AutoIncrement,
  PrimaryKey,
  DataType,
  BelongsTo,
  HasMany,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Incident, Chat, ChangeLog, Event, Company } from '.';
import { Editor, LegalGroupStatusEnum, PolymorphicType } from '../constants';
import { handleAfterCommit, sendChangeLogUpdate } from '../helpers';

@Table({
  tableName: 'legal_groups',
  underscored: true,
  timestamps: true,
})
export class LegalGroup extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id: number;

  @Column({ type: DataType.STRING })
  thread_id: string;

  @ForeignKey(() => Incident)
  @Column({ type: DataType.INTEGER })
  incident_id: number;

  @ForeignKey(() => Company)
  @Column({ type: DataType.INTEGER })
  company_id: number;

  @Column({
    type: DataType.ENUM(...Object.values(LegalGroupStatusEnum)),
  })
  status: LegalGroupStatusEnum;

  @Column({ type: DataType.JSONB })
  participants: string[];

  @HasMany(() => Chat, { onDelete: 'CASCADE' })
  chats: Chat[];

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: PolymorphicType.LEGAL_GROUP },
    as: 'legal_group_logs',
  })
  legal_group_logs: ChangeLog[];

  @BelongsTo(() => Incident, { onDelete: 'CASCADE' })
  incident: Incident;

  @BelongsTo(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @BeforeUpdate
  static async createChangeLogForLegalGroup(
    legalGroup: LegalGroup,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { transaction, editor } = options;

    if (!editor) return;

    const oldLegalGroup = await this.getLegalGroupById(legalGroup.id);

    // prepare timezone
    const timezone = oldLegalGroup?.incident?.event?.time_zone;

    const mapping = {
      status: 'status',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changedFields = legalGroup.changed() || [];

        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        const updatedLegalGroup = await this.getLegalGroupById(legalGroup.id);

        if (properties.length) {
          let changelogs = [];

          changelogs = await this.formatLegalGroupChangeLog(
            properties,
            updatedLegalGroup,
            editor,
            oldLegalGroup,
            timezone,
          );

          const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

          for (const changelog of bulkChangeLogs) {
            await sendChangeLogUpdate(
              changelog,
              editor,
              PolymorphicType.LEGAL_GROUP,
              timezone,
            );
          }
        }
      });
    }
  }

  static async formatLegalGroupChangeLog(
    properties: string[],
    legalGroup: LegalGroup,
    editor: Editor,
    oldLegalGroup: LegalGroup,
    time_zone: string,
  ) {
    const changelogs = [];
    const legalGroupPlain = legalGroup.get({ plain: true });
    const oldLegalGroupPlain = oldLegalGroup.get({ plain: true });

    const formattedTime = moment()
      .tz(time_zone)
      .format('MMM Do,YYYY | hh:mm A');

    for (const property of properties) {
      let text = '';
      const newValue = legalGroupPlain[property];
      const oldValue = oldLegalGroupPlain[property];

      switch (property) {
        default:
          text = `${newValue.toLowerCase()} this conversation on ${formattedTime}`;
          break;
      }

      changelogs.push({
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: legalGroupPlain.id,
        change_logable_type: PolymorphicType.LEGAL_GROUP,
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        editor_name: editor.editor_name,
      });
    }

    return changelogs;
  }

  static async getLegalGroupById(id: number) {
    return await LegalGroup.findByPk(id, {
      attributes: ['status', 'id'],
      include: [
        {
          model: Incident,
          attributes: ['event_id'],
          include: [
            {
              model: Event,
              attributes: ['time_zone'],
            },
          ],
        },
      ],
      useMaster: true,
    });
  }
}
