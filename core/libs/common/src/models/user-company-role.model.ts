import { INTEGER, DATE, STRING, Transaction, Op } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  Sequelize,
  HasMany,
  BeforeUpdate,
  AfterCreate,
  BeforeDestroy,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import {
  ChangeLog,
  Company,
  Department,
  Role,
  User,
  UserCompanyRoleRegion,
} from '.';
import {
  _roleMapping,
  Editor,
  PolymorphicType,
  roleMapping,
} from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  humanizeTitleCase,
  sendChangeLogUpdate,
} from '../helpers';

@Table({
  tableName: 'users_companies_roles',
  underscored: true,
  timestamps: true,
})
export class UserCompanyRole extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @ForeignKey(() => Role)
  @Column({ type: INTEGER })
  role_id: number;

  @Column({ type: DATE })
  blocked_at: Date;

  @Column({ type: STRING })
  category: string;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => Role)
  role: Role;

  @HasMany(() => UserCompanyRoleRegion)
  regions: UserCompanyRoleRegion[];

  // Changelogs for User on Create
  @AfterCreate
  static async createUserCompanyChangelogs(
    userCompanyRole: UserCompanyRole,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const formattedUserCompanyRole = await this.getUserCompaniesByUserId(
          userCompanyRole.id,
        );

        const changelog = {
          old_value: null,
          column: 'company',
          new_value: formattedUserCompanyRole['company'],
          formatted_log_text: `Associated to company '${formattedUserCompanyRole['company']}' with the role '${formattedUserCompanyRole['role']}'`,
          change_logable_id: userCompanyRole.user_id,
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

  // Changelogs for User on Update
  @BeforeUpdate
  static async updateUserCompanyChangelogs(
    userCompanyRole: UserCompanyRole,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const oldUserCompanyRole = await this.getUserCompaniesByUserId(
      userCompanyRole.id,
    );

    const mapping: Record<string, string> = {
      blocked_at: 'blocked_at',
      company_id: 'company_id',
      role_id: 'role_id',
      category: 'category',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changedFields = userCompanyRole.changed() || [];

        const updatedUserCompanyRole = await this.getUserCompaniesByUserId(
          userCompanyRole.id,
        );

        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        if (properties.length) {
          const changelogs = await this.formatChangeLog(
            properties,
            updatedUserCompanyRole,
            editor,
            oldUserCompanyRole,
          );

          if (changelogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

            for (const changelog of bulkChangeLogs) {
              await sendChangeLogUpdate(
                changelog,
                editor,
                PolymorphicType.USER,
              );
            }
          }
        }
      });
    }
  }

  // Changelogs for User on Delete
  @BeforeDestroy
  static async deleteUserCompanyChangelogs(
    userCompanyRole: UserCompanyRole,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const formattedUserCompanyRole = await this.getUserCompaniesByUserId(
      userCompanyRole.id,
    );

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          old_value: null,
          column: 'company',
          new_value: null,
          formatted_log_text: `Disassociated from company '${formattedUserCompanyRole['company']}'`,
          change_logable_id: userCompanyRole.user_id,
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

  // Format change log utility
  static async formatChangeLog(
    properties: string[],
    userCompanyRole: UserCompanyRole,
    editor: Editor,
    oldUserCompanyRole?: UserCompanyRole,
  ) {
    const changelogs = properties.map((property) => {
      const isIdField = property.includes('id');
      property = isIdField ? property.split('_id')[0] : property;

      let newValue = userCompanyRole[property];
      let oldValue = oldUserCompanyRole?.[property];

      if (property === 'category') {
        newValue = !userCompanyRole[property]
          ? 'All'
          : userCompanyRole[property];
        oldValue = !oldUserCompanyRole[property]
          ? 'All'
          : oldUserCompanyRole[property];
      }

      let text = '';
      switch (property) {
        case 'blocked_at':
          text = `'${newValue ? 'Blocked' : 'Unblocked'}' from '${userCompanyRole['company']}'`;
          break;
        case 'company':
          text = `Updated the association from '${oldValue || 'N/A'}' to '${newValue}'`;
          break;
        default:
          text = `Updated the ${humanizeTitleCase(property)} from '${oldValue || 'N/A'}' to '${newValue}'`;
          break;
      }

      return {
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: userCompanyRole.user_id,
        change_logable_type: PolymorphicType.USER,
        parent_changed_at: Date.now(),
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        commented_by: editor.editor_name,
      };
    });

    return changelogs;
  }

  static async getUserCompaniesByUserId(id: number) {
    return await UserCompanyRole.findOne({
      where: { id },
      attributes: [
        'id',
        'user_id',
        'blocked_at',
        'role_id',
        'category',
        [UserCompanyRole.getUserRoleByKeyWeb, 'role'],
        [Sequelize.literal(`"user"."name"`), 'user_name'],
        [Sequelize.literal(`"company"."name"`), 'company'],
        [Sequelize.literal(`"company"."id"`), 'company_id'],
        [Sequelize.literal(`"user->department"."name"`), 'department_name'],
        [Sequelize.literal(`"user->department"."id"`), 'department_id'],
      ],
      include: [
        {
          model: Company,
          attributes: [],
        },
        {
          model: User,
          attributes: [],
          include: [
            {
              model: Department,
              attributes: [],
              where: {
                company_id: {
                  [Op.eq]: Sequelize.literal('"UserCompanyRole"."company_id"'),
                },
              },
              through: { attributes: [] },
              required: false,
            },
          ],
        },
      ],
      subQuery: false,
      raw: true,
      useMaster: true,
    });
  }

  public static getUserRoleByKeyWeb: Literal = Sequelize.literal(`
  CASE "UserCompanyRole"."role_id"
    ${roleMapping}
    ELSE NULL
  END
`);

  public static _getUserRoleByKeyWeb: Literal = Sequelize.literal(`
  CASE "users_companies_roles"."role_id"
    ${roleMapping}
    ELSE NULL
  END
`);

  public static getUserRoleByKey: Literal = Sequelize.literal(`
    CASE "UserCompanyRole"."role_id"
      ${_roleMapping}
      ELSE NULL
    END
  `);

  public static _getUserRoleByKey: Literal = Sequelize.literal(`
    CASE "users_companies_roles"."role_id"
      ${_roleMapping}
      ELSE NULL
    END
  `);
}
