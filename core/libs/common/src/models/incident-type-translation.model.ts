import { STRING, INTEGER, Transaction, where } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  AfterBulkCreate,
  AfterUpdate,
  HasMany,
  AfterCreate,
} from 'sequelize-typescript';

import { ChangeLog, Incident, IncidentType } from '.';
import {
  Editor,
  IncidentTypeTranslationCreateInterface,
  IncidentTypeTranslationUpdateInterface,
  PolymorphicType,
} from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  isCompanyExist,
  sendChangeLogUpdate,
} from '../helpers';

@Table({
  tableName: 'incident_type_translations',
  underscored: true,
  timestamps: true,
})
export class IncidentTypeTranslation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  language: string;

  @Column({ type: STRING })
  translation: string;

  @ForeignKey(() => IncidentType)
  @Column({ type: INTEGER })
  incident_type_id: number;

  @BelongsTo(() => IncidentType)
  incident_type: IncidentType;

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: 'IncidentTypeTranslation' },
    as: 'incident_type_translation_logs',
  })
  incident_type_translation_logs: ChangeLog[];

  @AfterBulkCreate
  static async createIncidentTypeTranslationBulkChangelog(
    variants: IncidentType[],
    options: {
      transaction?: Transaction;
      editor?: Editor;
      company_id?: number;
    },
  ) {
    const { editor, transaction, company_id } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const company = await isCompanyExist(company_id);

        // Create change logs for each task
        const changeLogs = variants.map((variant) => {
          const { translation } = variant.dataValues;

          return {
            old_value: null,
            column: 'translation',
            new_value: translation,
            formatted_log_text: `added a variant ${translation} to ${company.name}`,
            change_logable_id: variant.id,
            change_logable_type: PolymorphicType.INCIDENT_TYPE_TRANSLATION,
            editor_id: editor.editor_id,
            editor_type: PolymorphicType.USER,
            parent_changed_at: Date.now(),
            commented_by: editor.editor_name,
            additional_values: { company_name: company.name },
          };
        });

        // Bulk insert the change logs
        if (changeLogs.length) {
          const bulkChangeLogs = await ChangeLog.bulkCreate(changeLogs);
          for (const changelog of bulkChangeLogs) {
            await sendChangeLogUpdate(
              changelog,
              editor,
              PolymorphicType.INCIDENT_TYPE_TRANSLATION,
            );
          }
        }
      });
    }
  }

  @AfterCreate
  static async createIncidentTypeTranslationChangelog(
    incidentTypeTranslation: IncidentTypeTranslation,
    options: IncidentTypeTranslationCreateInterface,
  ) {
    const { editor, transaction, company } = options;

    if (!company) return;

    const {
      company_id,
      sub_company_id,
      core_incident_type_name,
      core_incident_type_id,
    } = company;

    if (transaction && editor && sub_company_id && company_id) {
      await handleAfterCommit(transaction, async () => {
        const subCompany = await isCompanyExist(sub_company_id);

        const { translation } = incidentTypeTranslation.dataValues;

        const changelog = {
          old_value: null,
          column: 'translation',
          new_value: translation,
          formatted_log_text: `added a variant ${translation} to ${core_incident_type_name} to ${subCompany.name}`,
          change_logable_id: company_id,
          change_logable_type: PolymorphicType.INCIDENT_TYPE,
          editor_id: editor.editor_id,
          editor_type: PolymorphicType.USER,
          parent_changed_at: Date.now(),
          commented_by: editor.editor_name,
          // company_name, core_incident_type_name is stored because there is dynamic sub company name and core_incident_type_name in changelogs
          additional_values: {
            company_name: subCompany.name,
            sub_company_id,
            core_incident_type_name,
            core_incident_type_id,
          },
        };

        await createChangeLog(changelog, editor, PolymorphicType.INCIDENT_TYPE);
      });
    }
  }

  @AfterUpdate
  static async updateIncidentTypeTranslationChangelog(
    incidentTypeTranslation: IncidentTypeTranslation,
    options: IncidentTypeTranslationUpdateInterface,
  ) {
    const newValues = incidentTypeTranslation.dataValues;
    const oldValues = incidentTypeTranslation.previous();
    const { editor, company, transaction } = options;

    const { company_id, sub_company_id } = company;

    if (transaction && incidentTypeTranslation && sub_company_id && editor) {
      await handleAfterCommit(transaction, async () => {
        const subCompany = await isCompanyExist(sub_company_id);

        const coreIncidentType = await IncidentType.findOne({
          where: {
            id: incidentTypeTranslation.incident_type_id,
          },
          attributes: ['id'],
          include: [
            {
              model: IncidentType,
              as: 'parent',
              attributes: ['id', 'name'],
            },
          ],
        });

        const changelog = {
          old_value: oldValues.translation,
          column: 'translation',
          new_value: newValues.translation,
          formatted_log_text: `changed ${oldValues.translation} to ${newValues.translation} in ${subCompany.name}`,
          change_logable_id: company_id,
          change_logable_type: PolymorphicType.INCIDENT_TYPE,
          editor_id: editor.editor_id,
          editor_type: PolymorphicType.USER,
          parent_changed_at: Date.now(),
          commented_by: editor.editor_name,
          // company_name is stored because there is dynamic sub company name in changelogs
          additional_values: {
            company_name: subCompany.name,
            sub_company_id,
            core_incident_type_name: coreIncidentType.parent.name,
            core_incident_type_id: coreIncidentType.parent.id,
          },
        };

        await createChangeLog(changelog, editor, PolymorphicType.INCIDENT_TYPE);
      });
    }
  }
}
