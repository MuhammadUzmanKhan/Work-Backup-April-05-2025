import { STRING, INTEGER, NUMBER, Transaction } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  AllowNull,
  Unique,
  BeforeUpdate,
  AfterCreate,
} from 'sequelize-typescript';
import { Editor, PolymorphicType } from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  humanizeTitleCase,
  sendChangeLogUpdate,
  toTitleCase,
} from '../helpers';
import { ChangeLog, Company } from '.';

@Table({
  tableName: 'company_contacts',
  underscored: true,
  timestamps: true,
})
export class CompanyContact extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: NUMBER })
  name: number;

  @Column({ type: STRING })
  number: string;

  @Unique
  @Column({ type: STRING })
  email: string;

  @Column({ type: STRING })
  type: string;

  @AllowNull(false)
  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: string;

  @BelongsTo(() => Company)
  company: Company;

  // hooks for changelogs
  @AfterCreate
  static async createCompanyContactChangeLog(
    companyContact: CompanyContact,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const formattedCompanyContact = await this.getCompanyContactById(
      companyContact.id,
    );

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          formatted_log_text: `Created ${toTitleCase(companyContact.type)} Contact`,
          change_logable_id: formattedCompanyContact.company_id,
          change_logable_type: PolymorphicType.COMPANY,
          column: 'contact',
          oldValue: null,
          newValue: companyContact.name,
          editor_id: editor.editor_id,
          editor_type: PolymorphicType.USER,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.COMPANY);
      });
    }
  }

  @BeforeUpdate
  static async updateCompanyContactChangelog(
    companyContact: CompanyContact,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    if (companyContact['_options'].isNewRecord) return;

    const { editor, transaction } = options;

    if (!editor) return;

    const oldCompanyContact: CompanyContact = await this.getCompanyContactById(
      companyContact.id,
    );

    const mapping = {
      name: 'name',
      number: 'number',
      email: 'email',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changedFields = companyContact.changed() || [];
        // Map the changed fields to the properties we care about
        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        const updatedCompanyContact = await this.getCompanyContactById(
          companyContact.id,
        );

        if (properties.length) {
          // Generate the change logs for the modified properties
          const changelogs = await this.formatCompanyContactChangeLog(
            properties,
            updatedCompanyContact,
            editor,
            oldCompanyContact,
          );

          if (changelogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

            for (const changelog of bulkChangeLogs) {
              await sendChangeLogUpdate(
                changelog,
                editor,
                PolymorphicType.COMPANY,
              );
            }
          }
        }
      });
    }
  }

  static async formatCompanyContactChangeLog(
    properties: string[],
    _companyContact: CompanyContact,
    editor?: Editor,
    oldCompanyContact?: CompanyContact,
  ) {
    const changelogs = [];
    const companyContact = _companyContact.get({ plain: true });

    const oldCompanyContactPlain = oldCompanyContact.get({ plain: true });

    for (const property of properties) {
      let text = '';
      const newValue = companyContact[property];
      const oldValue = oldCompanyContactPlain[property];

      text = `Updated the ${toTitleCase(companyContact.type)} Contact ${humanizeTitleCase(property)} from '${humanizeTitleCase(oldValue)}' to '${humanizeTitleCase(newValue)}'`;

      changelogs.push({
        old_value: oldValue,
        new_value: newValue,
        column: property,
        formatted_log_text: text,
        change_logable_id: companyContact.company_id,
        change_logable_type: PolymorphicType.COMPANY,
        editor_id: editor.editor_id,
        editor_type: PolymorphicType.USER,
        parent_changed_at: Date.now(),
        editor_name: editor.editor_name,
      });
    }

    return changelogs;
  }

  static async getCompanyContactById(id: number) {
    return await CompanyContact.findOne({
      where: { id },
      attributes: ['name', 'email', 'number', 'company_id', 'type'],
      include: [
        {
          model: Company,
          attributes: ['id', 'updated_by'],
        },
      ],
      useMaster: true,
    });
  }
}
