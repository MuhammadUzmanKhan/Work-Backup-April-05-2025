import { INTEGER, Op, Sequelize, Transaction } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  AfterBulkCreate,
  BeforeDestroy,
} from 'sequelize-typescript';
import { ChangeLog, Region, UserCompanyRole } from '.';
import { Editor, PolymorphicType } from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  sendChangeLogUpdate,
} from '../helpers';

@Table({
  tableName: 'users_companies_roles_regions',
  underscored: true,
  timestamps: true,
})
export class UserCompanyRoleRegion extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => UserCompanyRole)
  @Column({ type: INTEGER })
  users_companies_roles_id: number;

  @ForeignKey(() => Region)
  @Column({ type: INTEGER })
  region_id: number;

  @BelongsTo(() => Region)
  region: Region;

  @BelongsTo(() => UserCompanyRole)
  userCompanyRole: UserCompanyRole;

  // Changelogs when user region will be changed (BULK)
  @AfterBulkCreate
  static async associationUserRegionChangeLogsBulk(
    userCompanyRoleRegion: UserCompanyRoleRegion[],
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        try {
          const userCompanyRoleRegionIds = userCompanyRoleRegion.map(
            ({ id }) => id,
          );

          const createdUserCompanyRoleRegions =
            await this.getUserCompanyRoleRegionById(userCompanyRoleRegionIds);

          const changeLogs = createdUserCompanyRoleRegions.map(
            (userCompanyRoleRegion: UserCompanyRoleRegion) => ({
              old_value: null,
              column: 'region',
              new_value: userCompanyRoleRegion['region_name'],
              formatted_log_text: `Region '${userCompanyRoleRegion['region_name']}' has been assigned`,
              change_logable_id: userCompanyRoleRegion['user_id'],
              change_logable_type: PolymorphicType.USER,
              parent_changed_at: Date.now(),
              editor_type: PolymorphicType.USER,
              editor_id: editor.editor_id,
              commented_by: editor.editor_name,
            }),
          );

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
          console.log(
            '🚀 ~ UserCompanyRoleRegion ~ awaithandleAfterCommit ~ e:',
            e,
          );
        }
      });
    }
  }

  // Changelogs for unassinging user from region
  @BeforeDestroy
  static async deleteUserRegionChangeLogs(
    userCompanyRoleRegion: UserCompanyRoleRegion,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const formattedUserRegion = await this.getUserCompanyRoleRegionById([
      userCompanyRoleRegion.id,
    ]);

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          old_value: formattedUserRegion[0]['region_name'],
          column: 'region',
          new_value: null,
          formatted_log_text: `Region '${formattedUserRegion[0]['region_name']}' has been unassigned`,
          change_logable_id: formattedUserRegion[0]['user_id'],
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

  static async getUserCompanyRoleRegionById(ids: number[]) {
    return await UserCompanyRoleRegion.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: [
        'id',
        [Sequelize.literal(`"region"."name"`), 'region_name'],
        [Sequelize.literal(`"userCompanyRole"."user_id"`), 'user_id'],
      ],
      include: [
        {
          model: Region,
          attributes: [],
        },
        {
          model: UserCompanyRole,
          attributes: [],
        },
      ],
      subQuery: false,
      raw: true,
      useMaster: true,
    });
  }
}
