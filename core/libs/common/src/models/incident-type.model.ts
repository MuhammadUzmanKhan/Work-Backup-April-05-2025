import { STRING, INTEGER, BOOLEAN, Sequelize, IncludeOptions } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  HasMany,
  BelongsTo,
  BelongsToMany,
  AfterCreate,
  AfterUpdate,
} from 'sequelize-typescript';
import {
  Alert,
  ChangeLog,
  Company,
  Event,
  EventIncidentType,
  GlobalIncident,
  Incident,
  IncidentTypeTranslation,
} from '.';
import {
  HookBasicOptionsInterface,
  IncidentTypeCreateInterface,
  PolymorphicType,
} from '../constants';
import { createChangeLog, handleAfterCommit, isCompanyExist } from '../helpers';

@Table({
  tableName: 'incident_types',
  underscored: true,
  timestamps: true,
})
export class IncidentType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: STRING })
  color: string;

  @Column({ type: BOOLEAN })
  is_test: boolean;

  @Column({ type: STRING, defaultValue: 'normal' })
  default_priority: string;

  @Column({ type: BOOLEAN })
  pinned: boolean;

  @ForeignKey(() => IncidentType)
  @Column({ type: INTEGER })
  parent_id: number;

  @HasMany(() => EventIncidentType)
  event_incident_types: EventIncidentType[];

  @BelongsToMany(() => Event, () => EventIncidentType)
  events: Event[];

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => Alert, {
    foreignKey: 'alertable_id',
    constraints: false,
    scope: { alertable_type: 'IncidentType' },
    as: 'incident_type_alerts',
  })
  incident_type_alerts: Alert[];

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: 'IncidentType' },
    as: 'incident_type_logs',
  })
  incident_type_logs: ChangeLog[];

  @HasMany(() => GlobalIncident)
  global_incidents: GlobalIncident[];

  @HasMany(() => Incident)
  incidents: Incident[];

  @HasMany(() => IncidentType, { foreignKey: 'parent_id' })
  variations: IncidentType[];

  @BelongsTo(() => IncidentType, { foreignKey: 'parent_id' })
  parent: IncidentType;

  @HasMany(() => IncidentTypeTranslation, {
    onDelete: 'CASCADE',
  })
  incident_type_translations: IncidentTypeTranslation[];

  public static getDefaultPriorityNameByKey: Literal = Sequelize.literal(`(
    CASE 
        WHEN "IncidentType"."default_priority" IS NOT NULL THEN 
        CASE 
            WHEN "IncidentType"."default_priority" = 'low' THEN 'low'
            WHEN "IncidentType"."default_priority" = 'normal' THEN 'medium'
            WHEN "IncidentType"."default_priority" = 'high' THEN 'important'
            WHEN "IncidentType"."default_priority" = 'critical' THEN 'critical'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  @AfterCreate
  static async createIncidentTypeChangelog(
    incidentType: IncidentType,
    options: IncidentTypeCreateInterface,
  ) {
    const { editor, transaction, company_id } = options;

    if (transaction && company_id && editor) {
      await handleAfterCommit(transaction, async () => {
        const createdIncidentType = await IncidentType.findOne({
          where: {
            id: incidentType.id,
          },
          attributes: ['id', 'name'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['name'],
            },
          ],
        });

        const changelog = {
          old_value: null,
          column: 'name',
          new_value: createdIncidentType.name,
          formatted_log_text: `added a new core incident type ${createdIncidentType.name}`,
          change_logable_id: company_id,
          change_logable_type: PolymorphicType.INCIDENT_TYPE,
          editor_id: editor.editor_id,
          editor_type: PolymorphicType.USER,
          parent_changed_at: Date.now(),
          commented_by: editor.editor_name,
          additional_values: {
            company_name: createdIncidentType.company.name,
            sub_company_id: null,
            core_incident_type_id: createdIncidentType.id,
            core_incident_type_name: createdIncidentType.name,
          },
        };

        await createChangeLog(changelog, editor, PolymorphicType.INCIDENT_TYPE);
      });
    }
  }

  @AfterUpdate
  static async updateIncidentTypeChangelog(
    incidentType: IncidentType,
    options: HookBasicOptionsInterface,
  ) {
    const newValues = incidentType.dataValues;
    const oldValues = incidentType.previous();
    const { editor, transaction } = options;

    if (transaction && editor && !incidentType.parent_id) {
      await handleAfterCommit(transaction, async () => {
        const company = await isCompanyExist(incidentType.company_id);

        const changelog = {
          old_value: oldValues.name,
          column: 'name',
          new_value: newValues.name,
          formatted_log_text: `changed ${oldValues.name} to ${newValues.name} in ${company.name}`,
          change_logable_id: company.id,
          change_logable_type: PolymorphicType.INCIDENT_TYPE,
          editor_id: editor.editor_id,
          editor_type: PolymorphicType.USER,
          parent_changed_at: Date.now(),
          commented_by: editor.editor_name,
          // company_name is stored because there is dynamic sub company name in changelogs
          additional_values: {
            company_name: company.name,
            sub_company_id: null,
            core_incident_type_id: newValues.id,
            core_incident_type_name: newValues.name,
          },
        };

        await createChangeLog(changelog, editor, PolymorphicType.INCIDENT_TYPE);
      });
    }
  }
}
