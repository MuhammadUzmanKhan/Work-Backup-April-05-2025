import { INTEGER, Op, Sequelize, Transaction } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  AfterBulkCreate,
  BeforeDestroy,
} from 'sequelize-typescript';
import { ChangeLog, Event, IncidentDivision, User } from '.';
import { Editor, PolymorphicType } from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  sendChangeLogUpdate,
} from '../helpers';

@Table({
  tableName: 'user_incident_divisions',
  underscored: true,
  timestamps: true,
})
export class UserIncidentDivision extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => IncidentDivision)
  @Column({ type: INTEGER })
  incident_division_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => IncidentDivision)
  incident_division: IncidentDivision;

  @BelongsTo(() => Event)
  event: Event;

  @AfterBulkCreate
  static async associationUserIncidentDivisionBulk(
    userIncidentDivisions: UserIncidentDivision[],
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        try {
          const userDivisionsIds = userIncidentDivisions.map(({ id }) => id);

          const createdUserIncidents =
            await this.getUserIncidentDivisionsById(userDivisionsIds);

          const changeLogs = createdUserIncidents.map((userDivision) => ({
            old_value: null,
            column: 'incident_division',
            new_value: userDivision['division_name'],
            formatted_log_text: `Incident Division '${userDivision['division_name']}' has been assigned`,
            change_logable_id: userDivision['user_id'],
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

  // Changelogs for User on Delete
  @BeforeDestroy
  static async deleteUserIncidentDivisionChangelogs(
    userIncidentDivisions: UserIncidentDivision,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const formattedUserIncidentDivision =
      await this.getUserIncidentDivisionsById([userIncidentDivisions.id]);

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          old_value: formattedUserIncidentDivision[0]['division_name'],
          column: 'incident_division',
          new_value: null,
          formatted_log_text: `Incident Division '${formattedUserIncidentDivision[0]['division_name']}' has been unassigned`,
          change_logable_id: formattedUserIncidentDivision[0]['user_id'],
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

  static async getUserIncidentDivisionsById(ids: number[]) {
    return await UserIncidentDivision.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: [
        'id',
        'user_id',
        [Sequelize.literal(`"incident_division"."name"`), 'division_name'],
      ],
      include: [
        {
          model: IncidentDivision,
          attributes: [],
        },
      ],
      subQuery: false,
      raw: true,
      useMaster: true,
    });
  }
}
