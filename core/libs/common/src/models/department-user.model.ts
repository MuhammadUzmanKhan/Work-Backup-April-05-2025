import { INTEGER, Sequelize, Transaction, UpdateOptions } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  AfterCreate,
  BeforeDestroy,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Company, Department, User } from '.';
import { Editor, PolymorphicType } from '../constants';
import { createChangeLog, handleAfterCommit } from '../helpers';

@Table({
  tableName: 'department_users',
  underscored: true,
  timestamps: true,
})
export class DepartmentUsers extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Department)
  department: Department;

  // Changelogs for User on Create
  @AfterCreate
  static async assignDepartmentToUserChangeLog(
    departmentUsers: DepartmentUsers,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const formattedDepartmentUser = await this.getDepartmentUserById(
          departmentUsers.id,
        );

        const changelog = {
          old_value: null,
          column: 'department',
          new_value: formattedDepartmentUser['department_name'],
          formatted_log_text: `Added in department '${formattedDepartmentUser['department_name']}' of company '${formattedDepartmentUser['company_name']}'`,
          change_logable_id: departmentUsers.user_id,
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

  // Changelogs for User on Delete
  @BeforeDestroy
  static async deleteDepartmentUserChangeLog(
    departmentUsers: DepartmentUsers,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const formattedDepartmentUser = await this.getDepartmentUserById(
      departmentUsers.id,
    );

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          old_value: formattedDepartmentUser['department_name'],
          column: 'department',
          new_value: null,
          formatted_log_text: `Removed from department '${formattedDepartmentUser['department_name']}' of company '${formattedDepartmentUser['company_name']}'`,
          change_logable_id: departmentUsers.user_id,
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

  // Changelogs for User
  @BeforeUpdate
  static async updateDepartmentUserChangelogs(
    departmentUser: DepartmentUsers,
    options: { transaction?: Transaction },
  ) {
    // Extract the editor information from options
    const { editor, transaction } = options as UpdateOptions & {
      editor: Editor;
    };

    if (!editor) return;

    // Fetch the old state of the user before the update
    const oldDepartmentUser = await this.getDepartmentUserById(
      departmentUser.id,
    );

    if (transaction) {
      // Execute after the transaction has been committed
      await handleAfterCommit(transaction, async () => {
        const updatedDepartmentUser = await this.getDepartmentUserById(
          departmentUser.id,
        );

        const changelog = {
          old_value: oldDepartmentUser['department_name'],
          column: 'department',
          new_value: updatedDepartmentUser['department_name'],
          formatted_log_text: `Updated the association of department from '${oldDepartmentUser['department_name']}' to '${updatedDepartmentUser['department_name']}' of company '${updatedDepartmentUser['company_name']}'`,
          change_logable_id: updatedDepartmentUser.user_id,
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

  static async getDepartmentUserById(id: number) {
    return await DepartmentUsers.findOne({
      where: { id },
      attributes: [
        'id',
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department->company"."name"`), 'company_name'],
      ],
      include: [
        {
          model: Department,
          attributes: [],
          include: [
            {
              model: Company,
              attributes: [],
            },
          ],
        },
      ],
      subQuery: false,
      raw: true,
      useMaster: true,
    });
  }
}
