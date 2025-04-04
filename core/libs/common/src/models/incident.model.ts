import {
  INTEGER,
  TEXT,
  BOOLEAN,
  STRING,
  DATE,
  Sequelize,
  Transaction,
  Op,
  QueryTypes,
  UpdateOptions,
} from 'sequelize';
import moment from 'moment-timezone';
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
  HasOne,
  BeforeSave,
  AfterCreate,
  AfterBulkCreate,
  BeforeUpdate,
  AfterUpdate,
} from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import {
  Company,
  User,
  Event,
  Inventory,
  Department,
  Scan,
  IncidentDepartmentUsers,
  IncidentDivision,
  Source,
  IncidentZone,
  StatusChange,
  Image,
  Message,
  Location,
  IncidentForm,
  IncidentType,
  IncidentMultipleDivision,
  ChangeLog,
  ResolvedIncidentNote,
  Comment,
  GlobalIncident,
  LiveVideo,
  LegalGroup,
} from '.';
import {
  Editor,
  IncidentPriorityApi,
  IncidentStatusType,
  IncidentTypePriority,
  PolymorphicType,
  PriorityFilter,
  SourceTypeNumber,
} from '../constants';
import {
  checkIfIncidentDivisionsChanged,
  getDateTimeWithTimezoneIncluded,
  getKeyByValue,
  humanizeTitleCase,
  isEventExist,
  processTimeStamp,
} from '../helpers';
import { PusherService, TranslateService } from '../services';
import { AppInjector } from '../controllers/common.controller';

@Table({
  tableName: 'incidents',
  underscored: true,
  timestamps: true,
})
export class Incident extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: INTEGER })
  status: number;

  @Column({ type: INTEGER })
  priority: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  created_by: number;

  @Column({ type: STRING })
  updated_by: string;

  @Column({ type: STRING })
  created_by_type: string;

  @Column({ type: STRING })
  updated_by_type: string;

  @Column({ type: STRING })
  incident_type: string;

  @Column({ type: DATE })
  logged_date_time: Date;

  @Column({ type: BOOLEAN })
  unread: boolean;

  @Column({ type: BOOLEAN })
  has_image: boolean;

  @Column({ type: BOOLEAN })
  has_comment: boolean;

  @Column({ type: STRING })
  resolved_time: string;

  @Column({ type: STRING })
  locator_code: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @ForeignKey(() => Source)
  @Column({ type: INTEGER })
  source_id: number;

  @ForeignKey(() => IncidentZone)
  @Column({ type: INTEGER })
  incident_zone_id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  reporter_id: number;

  @Column({ type: INTEGER })
  parent_id: number;

  @ForeignKey(() => IncidentDivision)
  @Column({ type: INTEGER })
  incident_division_id: number;

  @ForeignKey(() => GlobalIncident)
  @Column({ type: INTEGER })
  global_incident_id: number;

  @ForeignKey(() => IncidentForm)
  @Column({ type: INTEGER })
  incident_form_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @ForeignKey(() => Scan)
  @Column({ type: INTEGER })
  scan_id: number;

  @Column({ type: TEXT })
  description: string;

  @Column({ type: INTEGER })
  source_type: number;

  @Column({ type: STRING })
  row: string;

  @Column({ type: STRING })
  seat: string;

  @Column({ type: STRING })
  section: string;

  @Column({ type: BOOLEAN })
  is_legal: boolean;

  @Column({ type: BOOLEAN })
  is_archived: boolean;

  @Column({ type: BOOLEAN })
  is_concluded: boolean;

  @Column({ type: DATE })
  legal_changed_at: Date;

  @ForeignKey(() => IncidentType)
  @Column({ type: INTEGER })
  incident_type_id: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsTo(() => Scan)
  scan: Scan;

  @BelongsTo(() => IncidentZone)
  incident_zone: IncidentZone;

  @HasOne(() => LegalGroup, { foreignKey: 'incident_id', onDelete: 'CASCADE' })
  legal_group: LegalGroup;

  @HasMany(() => IncidentDepartmentUsers)
  incident_department_users: IncidentDepartmentUsers[];

  @BelongsToMany(() => Department, () => IncidentDepartmentUsers)
  departments: Department[];

  @BelongsToMany(() => User, () => IncidentDepartmentUsers)
  users: User[];

  @BelongsTo(() => IncidentDivision) //optional
  incident_division: IncidentDivision;

  @BelongsTo(() => Department) //optional
  reporter: Department;

  @HasMany(() => StatusChange, {
    foreignKey: 'status_changeable_id',
    constraints: false,
    scope: { status_changeable_type: 'Incident' },
    as: 'incident_status_changes',
  })
  incident_status_changes: StatusChange[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: 'Incident' },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  @HasMany(() => Message, {
    foreignKey: 'messageable_id',
    constraints: false,
    scope: { messageable_type: 'Incident' },
    as: 'incident_messages',
  })
  incident_messages: Message[];

  @HasOne(() => Location, {
    foreignKey: 'locationable_id',
    constraints: false,
    scope: { locationable_type: 'Incident' },
    as: 'location',
  })
  location: Location;

  @HasMany(() => Incident, { foreignKey: 'parent_id' })
  linked_incidents: Incident[];

  @BelongsTo(() => Incident, { foreignKey: 'parent_id' })
  parent: Incident;

  @BelongsTo(() => IncidentForm)
  incident_form: IncidentForm;

  @BelongsTo(() => IncidentType)
  incident_types: IncidentType;

  @HasMany(() => IncidentMultipleDivision)
  incident_multiple_division: IncidentMultipleDivision[];

  @BelongsToMany(() => IncidentDivision, () => IncidentMultipleDivision)
  incident_divisions: IncidentDivision[];

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: 'Incident' },
    as: 'incident_logs',
  })
  incident_logs: ChangeLog[];

  @HasOne(() => ResolvedIncidentNote, {
    foreignKey: 'incident_id',
  })
  resolved_incident_note: ResolvedIncidentNote;

  @BelongsTo(() => Source)
  source: Source;

  @HasMany(() => Comment, {
    foreignKey: 'commentable_id',
    constraints: false,
    scope: { commentable_type: PolymorphicType.INCIDENT },
    as: 'comments',
  })
  comments: Comment;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    constraints: false,
  })
  creator: User;

  @BelongsTo(() => GlobalIncident)
  global_incident: GlobalIncident;

  @HasOne(() => Scan)
  incident_scan: Scan;

  @HasMany(() => LiveVideo)
  live_videos: LiveVideo[];

  public static getStatusNameByKey: Literal = Sequelize.literal(`(
    CASE
        WHEN "Incident"."status" IS NOT NULL THEN
        CASE
            WHEN "Incident"."status" = 0 THEN 'open'
            WHEN "Incident"."status" = 1 THEN 'dispatched'
            WHEN "Incident"."status" = 2 THEN 'resolved'
            WHEN "Incident"."status" = 3 THEN 'archived'
            WHEN "Incident"."status" = 4 THEN 'follow_up'
            WHEN "Incident"."status" = 5 THEN 'in_route'
            WHEN "Incident"."status" = 6 THEN 'at_scene'
            WHEN "Incident"."status" = 7 THEN 'responding'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static getStatusNameByKeyForInclude: Literal = Sequelize.literal(`(
    CASE
        WHEN "incidents"."status" IS NOT NULL THEN
        CASE
            WHEN "incidents"."status" = 0 THEN 'open'
            WHEN "incidents"."status" = 1 THEN 'dispatched'
            WHEN "incidents"."status" = 2 THEN 'resolved'
            WHEN "incidents"."status" = 3 THEN 'archived'
            WHEN "incidents"."status" = 4 THEN 'follow_up'
            WHEN "incidents"."status" = 5 THEN 'in_route'
            WHEN "incidents"."status" = 6 THEN 'at_scene'
            WHEN "incidents"."status" = 7 THEN 'responding'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static getDashboardStatusNameByKey: Literal = Sequelize.literal(`(
    CASE
        WHEN "Incident"."status" IS NOT NULL THEN
        CASE
            WHEN "Incident"."status" = 0 THEN 'Open'
            WHEN "Incident"."status" = 1 THEN 'Dispatched'
            WHEN "Incident"."status" = 2 THEN 'Resolved'
            WHEN "Incident"."status" = 3 THEN 'Dispatched'
            WHEN "Incident"."status" = 4 THEN 'Follow Up'
            WHEN "Incident"."status" = 5 THEN 'Dispatched'
            WHEN "Incident"."status" = 6 THEN 'Dispatched'
            WHEN "Incident"."status" = 7 THEN 'Dispatched'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static getPriorityNameByKey: Literal = Sequelize.literal(`(
    CASE
        WHEN "Incident"."priority" IS NOT NULL THEN
        CASE
            WHEN "Incident"."priority" = 0 THEN 'low'
            WHEN "Incident"."priority" = 1 THEN 'normal'
            WHEN "Incident"."priority" = 2 THEN 'important'
            WHEN "Incident"."priority" = 3 THEN 'critical'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static getPriorityNameByKeyNewMapping: Literal = Sequelize.literal(`(
    CASE
        WHEN "Incident"."priority" IS NOT NULL THEN
        CASE
            WHEN "Incident"."priority" = 0 THEN 'low'
            WHEN "Incident"."priority" = 1 THEN 'medium'
            WHEN "Incident"."priority" = 2 THEN 'high'
            WHEN "Incident"."priority" = 3 THEN 'critical'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static getPriorityNameByKeyNewMappingForInclude: Literal =
    Sequelize.literal(`(
    CASE
        WHEN "incidents"."priority" IS NOT NULL THEN
        CASE
            WHEN "incidents"."priority" = 0 THEN 'low'
            WHEN "incidents"."priority" = 1 THEN 'medium'
            WHEN "incidents"."priority" = 2 THEN 'high'
            WHEN "incidents"."priority" = 3 THEN 'critical'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static getDashboardPriorityNameByKey: Literal = Sequelize.literal(`(
    CASE
        WHEN "Incident"."priority" IS NOT NULL THEN
        CASE
            WHEN "Incident"."priority" = 0 THEN 'Low'
            WHEN "Incident"."priority" = 1 THEN 'Medium'
            WHEN "Incident"."priority" = 2 THEN 'High'
            WHEN "Incident"."priority" = 3 THEN 'Critical'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  public static orderByStatusSequence: Literal = Sequelize.literal(`(
    CASE
        WHEN "Incident"."status" = 0 THEN 0
        WHEN "Incident"."status" = 1 THEN 1
        WHEN "Incident"."status" = 7 THEN 2
        WHEN "Incident"."status" = 6 THEN 3
        WHEN "Incident"."status" = 5 THEN 4
        WHEN "Incident"."status" = 3 THEN 5
        WHEN "Incident"."status" = 4 THEN 6
        WHEN "Incident"."status" = 2 THEN 7
      END
    )
  `);

  public static getStatusNameHumanCase: Literal = Sequelize.literal(`(
    CASE
        WHEN "Incident"."status" IS NOT NULL THEN
        CASE
            WHEN "Incident"."status" = 0 THEN 'Open'
            WHEN "Incident"."status" = 1 THEN 'Dispatched'
            WHEN "Incident"."status" = 2 THEN 'Resolved'
            WHEN "Incident"."status" = 3 THEN 'Arrival'
            WHEN "Incident"."status" = 4 THEN 'Follow Up'
            WHEN "Incident"."status" = 5 THEN 'Transport'
            WHEN "Incident"."status" = 6 THEN 'On Scene'
            WHEN "Incident"."status" = 7 THEN 'Responding'
            ELSE NULL
          END
        ELSE NULL
      END
    )
  `);

  @BeforeSave
  static async setIncidentType(incident: Incident) {
    if (!incident.incident_type_id) return incident;

    const incident_type = await IncidentType.findByPk(
      incident.incident_type_id,
      {
        attributes: ['name'],
      },
    );

    if (incident_type) {
      incident.incident_type = incident_type.name;
    }

    return incident;
  }

  @BeforeSave
  static async setIncidentPriority(incident: Incident) {
    if (incident.priority === undefined) {
      let default_priority: string;

      const incident_type = await IncidentType.findByPk(
        incident.incident_type_id,
        {
          attributes: ['default_priority'],
        },
      );

      if (incident_type) {
        default_priority = incident_type.default_priority;

        if (default_priority === IncidentPriorityApi.MEDIUM) {
          default_priority = PriorityFilter.NORMAL;
        }
        incident.priority =
          IncidentTypePriority[incident_type.default_priority].toUpperCase();
      }
      {
        incident.priority = IncidentTypePriority.NORMAL;
      }
    }
    return incident;
  }

  @BeforeSave
  static async setSourceType(incident: Incident) {
    if (!incident.source_type) {
      incident.source_type = 0; //0 is 'fe'
    }
    return incident;
  }

  @AfterCreate
  static async setLoggedDateTime(incident: Incident) {
    const event = await Event.findByPk(incident.event_id, {
      attributes: ['time_zone'],
    });

    const converted_time_zone = moment(incident.createdAt).tz(event.time_zone);

    await incident.update({ logged_date_time: converted_time_zone });

    return incident;
  }

  @BeforeUpdate
  static async updateIncidentChangelog(
    incident: Incident,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (incident['_options'].isNewRecord || !editor) return;

    const oldIncident = (await this.getIncidentById(incident.id)).get({
      plain: true,
    });

    const mapping = {
      priority: 'priority',
      status: 'status',
      incident_division_ids: 'incident_divisions',
      incident_type_id: 'incident_type',
      description: 'description',
      incident_zone_id: 'incident_zone',
      source_id: 'source_name',
      locator_code: 'locator_code',
      reporter_id: 'reporter',
      logged_date_time: 'logged_date_time',
      row: 'row',
      seat: 'seat',
      section: 'section',
      location: 'location',
      is_legal: 'is_legal',
    };

    if (transaction) {
      transaction.afterCommit(async () => {
        const changedFields = incident.changed() || [];
        const updatedIncident = await this.getIncidentById(incident.id);

        const { time_zone } = await isEventExist(updatedIncident.event_id);

        const properties = [];
        let bulkChangeLogs = [];

        for (const field of changedFields) {
          const _mapValue = mapping[field];

          if (_mapValue) {
            properties.push(_mapValue);
            if (_mapValue === mapping.incident_zone_id) {
              properties.push(mapping.location);
            }
          }
        }

        if (
          checkIfIncidentDivisionsChanged(
            oldIncident.incident_divisions,
            updatedIncident.incident_divisions,
          )
        ) {
          properties.push('incident_divisions');
        }

        const changelogs = await this.formatChangeLog(
          properties,
          [updatedIncident],
          false,
          oldIncident,
          editor,
        );

        if (changelogs?.length) {
          bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);
        }

        try {
          const pusherService = new PusherService(new ConfigService());

          for (let changeLog of bulkChangeLogs) {
            changeLog = await changeLog.get({ plain: true });
            changeLog['text'] = changeLog.formatted_log_text;
            changeLog['editor_name'] =
              editor?.editor_name || changeLog['commented_by'];
            changeLog['commented_by'] =
              editor?.editor_name || changeLog['commented_by'];

            const translateService =
              await AppInjector.resolve(TranslateService);

            const logs =
              await translateService.translateSingleChangLogToAllLanguages(
                changeLog,
                PolymorphicType.INCIDENT,
                time_zone,
              );

            delete changeLog.formatted_log_text;

            pusherService.sendUpdatedChangelog(
              processTimeStamp(logs),
              PolymorphicType.INCIDENT,
            );
          }
        } catch (error) {
          console.log(
            '🚀 ~ Incident ~ transaction.afterCommit ~ error:',
            error,
          );
        }
      });
    }
  }

  @AfterCreate
  static async createIncidentChangelog(
    incident: Incident,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    await StatusChange.create({
      status: incident.status,
      status_changeable_id: incident.id,
      status_changeable_type: PolymorphicType.INCIDENT,
      updated_by: editor.editor_id,
    });

    const properties = [
      'id',
      'company_name',
      'event_name',
      'description',
      'status',
      'incident_type',
      'priority',
      'created_by',
      'incident_zone',
      'incident_divisions',
      'source_type',
      'location',
      'source_name',
      'locator_code',
      'reporter',
      'row',
      'seat',
      'section',
    ];

    if (transaction) {
      transaction.afterCommit(async () => {
        try {
          const createdIncident = await this.getIncidentById(incident.id);

          const changelogs = await this.formatChangeLog(
            properties,
            [createdIncident],
            true,
            null,
            editor,
          );

          if (changelogs?.length) await ChangeLog.bulkCreate(changelogs);
        } catch (e) {
          console.log(e);
        }
      });
    }
  }

  @AfterBulkCreate
  static async createChangelogForBulk(
    incidents: Incident[],
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;
    const properties = [
      'id',
      'company_name',
      'event_name',
      'description',
      'status',
      'incident_type',
      'priority',
      'created_by',
      'incident_zone',
      'incident_divisions',
      'source_type',
      'location',
    ];

    if (transaction) {
      transaction.afterCommit(async () => {
        try {
          const createdIncidents = await Incident.findAll({
            where: {
              id: { [Op.in]: incidents.map((incident) => incident.id) },
            },
            attributes: [...this.incidentCommonAttributes],
            include: this.getIncidentsListQueryInclude(),
            useMaster: true,
          });

          const changelogs = await this.formatChangeLog(
            properties,
            createdIncidents,
            true,
            null,
            editor,
          );

          if (changelogs?.length) await ChangeLog.bulkCreate(changelogs);
        } catch (e) {
          console.log(e);
        }
      });
    }
  }

  static async formatChangeLog(
    properties: string[],
    incidents: Incident[],
    isNew: boolean,
    oldIncident?: Incident,
    editor?: Editor,
  ) {
    const changelogs = [];

    const changelogMiddleText = {
      incidentIs: 'of Incident is',
      setTo: 'set to',
    };

    for (const _incident of incidents) {
      const incident = _incident.get({ plain: true });

      const changelogForEachProperty = [];
      for (const property of properties) {
        let new_value = null;

        // format logged date time in specific format
        if (property === 'logged_date_time' && incident.logged_date_time) {
          incident.logged_date_time = getDateTimeWithTimezoneIncluded(
            incident.timezone,
            incident.logged_date_time,
          );

          if (oldIncident) {
            oldIncident.logged_date_time = getDateTimeWithTimezoneIncluded(
              incident.timezone,
              oldIncident.logged_date_time,
            ) as unknown as Date;
          }
        }

        switch (property) {
          case 'created_by':
            if (isNew) {
              changelogForEachProperty.push({
                text: `${humanizeTitleCase(property)} '${
                  incident.creator.name
                }'`,
                new_value: incident.creator.name,
                column: property,
              });
            }

            break;

          case 'incident_zone':
            if (isNew && !incident.incident_zone) break;

            changelogForEachProperty.push({
              new_value: incident.incident_zone?.name,
              column: property,
              text: isNew
                ? `${humanizeTitleCase('incident_zone')} ${
                    changelogMiddleText.setTo
                  } '${incident.incident_zone?.name}'`
                : `${humanizeTitleCase('incident_zone')} changed from '${
                    oldIncident.incident_zone?.name
                  }' to '${incident.incident_zone?.name}'`,
              old_value: !isNew ? oldIncident.incident_zone?.name : null,
            });

            break;

          case 'is_legal':
            changelogForEachProperty.push({
              new_value: incident.is_legal ? 'enabled' : 'disabled',
              column: property,
              text: `Legal Review ${incident.is_legal ? 'enabled' : 'disabled'} of incident`,
              old_value: oldIncident.is_legal ? 'enabled' : 'disabled',
            });

            break;

          case 'source_type':
            if (isNew) {
              new_value = getKeyByValue(
                incident.source_type,
                SourceTypeNumber,
              ).toLowerCase();
              changelogForEachProperty.push({
                text: `${humanizeTitleCase(property)} ${
                  changelogMiddleText.setTo
                } '${new_value}'`,
                new_value,
                column: property,
              });
            }

            break;

          case 'location':
            if (isNew && !incident.incident_zone) break;

            const newLocation = `${incident.incident_zone?.latitude},${incident.incident_zone?.longitude}`;
            changelogForEachProperty.push({
              new_value: newLocation,
              column: property,
              text: isNew
                ? `${humanizeTitleCase(property)} ${
                    changelogMiddleText.setTo
                  } '${newLocation}'`
                : `${humanizeTitleCase(property)} changed from ${
                    oldIncident.incident_zone?.latitude
                  },${oldIncident.incident_zone?.longitude} to '${newLocation}'`,
              old_value: !isNew
                ? `${oldIncident.incident_zone?.latitude},${oldIncident.incident_zone?.latitude}`
                : null,
            });

            break;

          case 'incident_divisions':
            const log = this.getIncidentDivisionChangeLog(
              incident,
              oldIncident,
              isNew,
            );

            if (log) changelogForEachProperty.push(log);

            break;

          case 'company_name':
          case 'event_name':
          case 'id':
            if (isNew) {
              changelogForEachProperty.push({
                text: `${humanizeTitleCase(property)} ${
                  changelogMiddleText.incidentIs
                } '${incident[property]}'`,
                new_value: incident[property],
                column: property,
              });
            }

            break;

          case 'logged_date_time':
            const newValueText = moment(incident[property])
              .tz(incident.timezone)
              .format('MM/DD/YYYY hh:mm A');
            const middleTextForLoggedDateTime =
              (!isNew &&
                (oldIncident[property]
                  ? `changed from '${moment(oldIncident[property])
                      .tz(incident.timezone)
                      .format('MM/DD/YYYY hh:mm A')}'`
                  : 'updated')) ||
              '';
            changelogForEachProperty.push({
              new_value: incident[property],
              column: property,
              text: isNew
                ? `DateTime ${changelogMiddleText.setTo} '${newValueText}'`
                : `DateTime ${middleTextForLoggedDateTime} to '${newValueText}'`,
              old_value: !isNew ? oldIncident[property] : null,
            });

            break;

          default:
            if (!incident[property]) break;

            const middleText =
              (!isNew &&
                (oldIncident[property]
                  ? `changed from '${oldIncident[property]}'`
                  : 'updated')) ||
              '';
            changelogForEachProperty.push({
              new_value: incident[property],
              column: property,
              text: isNew
                ? `${humanizeTitleCase(property)} ${
                    changelogMiddleText.setTo
                  } '${incident[property]}'`
                : `${humanizeTitleCase(property)} ${middleText} to '${
                    incident[property]
                  }'`,
              old_value: !isNew ? oldIncident[property] : null,
            });

            break;
        }
      }

      changelogs.push(
        ...changelogForEachProperty.map(
          ({ text, column, old_value, new_value }, index) => ({
            old_value,
            column,
            new_value,
            formatted_log_text: text,
            change_logable_id: incident.id,
            change_logable_type: PolymorphicType.INCIDENT,
            editor_id: editor.editor_id,
            editor_type: PolymorphicType.USER,
            parent_changed_at: Date.now(),
            commented_by: editor.editor_name,
            createdAt: moment()
              .clone()
              .add(10 * (index + 1), 'milliseconds')
              .toDate(),
          }),
        ),
      );
    }

    return changelogs;
  }

  static async getIncidentById(id: number) {
    // Check if user has access to this event or not based on its company or subcompany

    const incident = await Incident.findOne({
      attributes: [
        ...this.incidentCommonAttributes,
        ...this.getAllIncidentsRawQueries(),
      ],
      where: { id },
      include: this.getIncidentsListQueryInclude(),
      subQuery: false,
      useMaster: true,
    });

    return incident;
  }

  static incidentCommonAttributes: any = [
    'id',
    'description',
    'event_id',
    'unread',
    'created_by',
    'locator_code',
    'reporter_id',
    'parent_id',
    'logged_date_time',
    'source_type',
    'row',
    'seat',
    'section',
    'is_legal',
    [Incident.getStatusNameHumanCase, 'status'],
    [Incident.getDashboardPriorityNameByKey, 'priority'],
    'resolved_time',
    [
      Sequelize.literal('CAST("Incident"."updated_by" AS INTEGER)'),
      'updated_by',
    ],
    [Sequelize.literal(`"source"."name"`), 'source_name'],
    [Sequelize.literal(`"event"."name"`), 'event_name'],
    [Sequelize.literal(`"event"."time_zone"`), 'timezone'],
    [Sequelize.literal(`"company"."name"`), 'company_name'],
    [Sequelize.literal(`"incident_types"."name"`), 'incident_type'],
  ];

  static getAllIncidentsRawQueries: any = () => {
    return [
      [
        Sequelize.literal(`(
            SELECT name
            FROM "departments"
            WHERE "departments"."id" = "Incident"."reporter_id"
          )`),
        'reporter',
      ],
    ];
  };

  static getIncidentsListQueryInclude: any = () => {
    return [
      {
        model: Event,
        attributes: [],
      },
      {
        model: Company,
        attributes: [],
      },
      {
        model: IncidentZone,
        attributes: ['name', 'latitude', 'longitude'],
      },
      {
        model: IncidentDivision,
        as: 'incident_divisions',
        through: { attributes: [] },
        attributes: [
          [
            Sequelize.literal('CAST("incident_divisions"."id" AS INTEGER)'),
            'id',
          ],
          'name',
        ],
        required: false,
      },
      {
        model: IncidentType,
        attributes: [],
      },
      {
        model: Source,
        attributes: [],
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'name'],
      },
    ];
  };

  static getIncidentDivisionChangeLog = (
    incident: Incident,
    oldIncident: Incident,
    isNew: boolean,
    property = 'incident_divisions',
  ) => {
    const oldDivisions =
      oldIncident?.incident_divisions
        ?.map((division) => division.name)
        .join(', ') || null;

    const newDivisions =
      incident.incident_divisions
        ?.map((division) => division.name)
        .join(', ') || null;

    if (incident.incident_divisions?.length) {
      return {
        new_value: newDivisions,
        column: property,
        text: `${humanizeTitleCase(property)} updated to '${newDivisions}'`,
        old_value: !isNew
          ? oldIncident.incident_divisions.length
            ? oldDivisions
            : null
          : null,
      };
    } else if (!incident.incident_divisions?.length && !isNew) {
      return {
        new_value: null,
        column: property,
        text: `${humanizeTitleCase(property)} has been removed`,
        old_value: oldDivisions,
      };
    }

    return false;
  };

  @AfterUpdate
  static async updateIncidentResolvedTime(
    incident: Incident,
    options: {
      transaction: Transaction;
      updated_by: number;
      hook_triggered?: boolean;
    },
  ) {
    if (options.hook_triggered) return;

    const { id, status, event_id, updated_by } = incident;

    const { transaction } = options;

    if (status != null && updated_by) {
      try {
        await StatusChange.create(
          {
            status: IncidentStatusType[status].toLowerCase(),
            status_changeable_id: id,
            status_changeable_type: PolymorphicType.INCIDENT,
            updated_by,
          },
          {
            transaction,
          },
        );
      } catch (error) {
        console.log('🚀 ~ Incident ~ error:', error);
      }
    }

    try {
      const result = await this.sequelize.query(
        `SELECT * FROM get_incident_avg_resolved_time(${event_id}, VARIADIC ARRAY[${[
          id,
        ]}])`,
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      await incident.update(
        {
          resolved_time:
            result[0]['get_incident_avg_resolved_time'].avg_resolved_time,
        },
        {
          transaction,
          hook_triggered: true,
        } as UpdateOptions & { hook_triggered: boolean },
      );
    } catch (error) {
      console.log('🚀 ~ Incident ~ updateIncidentResolvedTime ~ error:', error);
    }

    try {
      const incidentZones = await IncidentZone.findAll({
        where: {
          event_id: incident.event_id,
        },
        attributes: ['id'],
      });

      if (incidentZones.length) {
        const incidentZoneAVGResolvedTime = await this.sequelize.query(
          `
            SELECT * FROM get_incident_zone_resolved_time(${incident.event_id}, VARIADIC ARRAY[${incidentZones.map((incidentZone) => incidentZone.id)}])
            `,
          {
            type: QueryTypes.SELECT,
            transaction,
          },
        );

        for (const incidentZone of incidentZones) {
          await incidentZone.update(
            {
              linked_incidents_avg_resolved_time:
                incidentZoneAVGResolvedTime[0][
                  'get_incident_zone_resolved_time'
                ]?.[incidentZone.id]?.avg_resolved_time,
            },
            {
              transaction,
            },
          );
        }
      }
    } catch (error) {
      console.log(
        '🚀 ~ Incident ~ updateIncidentZoneResolvedTime ~ error:',
        error,
      );
    }

    return;
  }
}
