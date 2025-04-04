import { v2 } from '@google-cloud/translate';
import { randomBytes } from 'crypto';
import {
  STRING,
  BOOLEAN,
  INTEGER,
  TEXT,
  JSONB,
  Transaction,
  Sequelize,
  Op,
} from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  HasMany,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  AfterCreate,
  BeforeCreate,
  Unique,
  BelongsToMany,
  BeforeUpdate,
  AfterUpdate,
  HasOne,
} from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import {
  User,
  Event,
  EventContact,
  Source,
  IncidentDivision,
  IncidentType,
  Department,
  Inventory,
  VendorRole,
  Incident,
  UserCompanyRole,
  InventoryType,
  UserPins,
  CompanyContact,
  FuelType,
  InventoryTypeCategory,
  GlobalIncident,
  Region,
  CompanyWeatherProvider,
  TaskCategory,
  ChangeLog,
  DotMapVendor,
  Area,
  Position,
  PositionName,
  IncidentTypeTranslation,
  LegalGroup,
  TwilioNumber,
} from '.';
import { translateWithRetry } from '../helpers';
import { Editor, PinableType, PolymorphicType } from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  humanizeTitleCase,
  sendChangeLogUpdate,
} from '../helpers';
import { AppInjector } from '../controllers';
import { TranslateService } from '../services';

@Table({ tableName: 'companies', underscored: true, timestamps: true })
export class Company extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  logo: string;

  @Column({ type: TEXT })
  about: string;

  @Column({ type: STRING })
  url: string;

  @Column({ type: STRING, defaultValue: 'Africa/Abidjan' })
  timezone: string;

  @Column({ type: STRING })
  location: string;

  @Column({ type: STRING })
  contact_name: string;

  @Column({ type: STRING })
  contact_phone: string;

  @Unique
  @Column({ type: STRING })
  contact_email: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  use_pay_fabric_live: boolean;

  @Column({ type: STRING })
  company_token: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  active: boolean;

  @Column({ type: STRING })
  country: string;

  @Column({ type: JSONB })
  coordinates: any;

  @Column({ type: STRING })
  category: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  parent_id: number;

  @ForeignKey(() => Region)
  @Column({ type: INTEGER })
  region_id: number;

  @Column({ type: STRING })
  api_key: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  created_by: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  updated_by: number;

  @Column({ type: BOOLEAN })
  demo_company: boolean;

  @Column({ type: STRING, defaultValue: 'en' })
  default_lang: string;

  @Column({ type: STRING })
  twilio_api_key_sid: string;

  @Column({ type: STRING })
  twilio_api_key_secret: string;

  @Column({ type: STRING })
  twilio_account_sid: string;

  @HasMany(() => TwilioNumber)
  twilio_numbers: TwilioNumber[];

  @BelongsTo(() => Region)
  region: Region;

  @HasMany(() => Event)
  events: Event[];

  @HasMany(() => Company, { foreignKey: 'parent_id' })
  subCompanies: Company[];

  @HasOne(() => LegalGroup, { foreignKey: 'company_id', onDelete: 'CASCADE' })
  legal_group: LegalGroup;

  @BelongsTo(() => Company, { foreignKey: 'parent_id' })
  parent: Company;

  @HasMany(() => UserPins, {
    foreignKey: 'pinable_id',
    constraints: false,
    scope: { pinable_type: PinableType.COMPANY },
    as: 'user_pin_companies',
  })
  user_pin_companies: Company[];

  @HasMany(() => EventContact)
  event_contacts: EventContact[];

  @HasMany(() => Source)
  sources: Source[];

  @HasMany(() => IncidentDivision)
  incident_divisions: IncidentDivision[];

  @HasMany(() => Incident)
  incidents: Incident[];

  @HasMany(() => IncidentType)
  incident_types: IncidentType[];

  @HasMany(() => Department)
  departments: Department[];

  @HasMany(() => Inventory)
  inventories: Inventory[];

  @HasMany(() => VendorRole)
  vendor_roles: VendorRole[];

  @HasMany(() => InventoryType)
  inventory_types: InventoryType[];

  @HasMany(() => CompanyContact, { onDelete: 'CASCADE' })
  company_contact: CompanyContact[];

  @HasMany(() => FuelType)
  fuel_types: FuelType[];

  @HasMany(() => InventoryTypeCategory)
  inventory_type_categories: InventoryTypeCategory[];

  @HasMany(() => GlobalIncident)
  global_incidents: GlobalIncident[];

  @HasMany(() => UserCompanyRole)
  users_companies_roles: UserCompanyRole[];

  @BelongsToMany(() => User, () => UserCompanyRole)
  users: User[];

  @HasMany(() => CompanyWeatherProvider)
  company_weather_providers: CompanyWeatherProvider[];

  @HasMany(() => TaskCategory, { foreignKey: 'company_id' })
  taskCategories: TaskCategory[];

  @HasMany(() => DotMapVendor)
  dotmap_vendors: DotMapVendor[];

  @HasMany(() => Area)
  dotmap_areas: Area[];

  @HasMany(() => Position)
  dotmap_positions: Position[];

  @HasMany(() => PositionName)
  dotmap_position_names: PositionName[];

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    constraints: false,
    as: 'creator',
  })
  creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    constraints: false,
    as: 'editor',
  })
  editor: User;

  // hooks
  @BeforeCreate
  static async assingCompanyToken(company: Company) {
    const companyToken = randomBytes(16).toString('hex');
    company.company_token = companyToken;
  }

  @AfterCreate
  static async createVendorRoles(company: Company) {
    const roles = [
      'Manager',
      'Supervisor',
      'Lead',
      'Guard',
      'K9',
      'Auditor',
      'Bicycle Unit',
      'Moto Unit',
      'Admin',
      'Eviction',
    ];

    for (const role of roles) {
      await VendorRole.findOrCreate({
        where: { company_id: company.id, role },
      });
    }
  }

  @AfterCreate
  static async createCompanyChangelog(
    company: Company,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          formatted_log_text: `Created Company '${company.name}'`,
          change_logable_id: company.id,
          change_logable_type: PolymorphicType.COMPANY,
          column: 'company',
          editor_type: PolymorphicType.USER,
          newValue: null,
          oldValue: null,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.COMPANY);
      });
    }
  }

  @BeforeUpdate
  static async updateCompanyChangelog(
    company: Company,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const oldCompany: Company = await this.getCompanyById(company.id);

    const mapping = {
      name: 'name',
      about: 'about',
      url: 'url',
      location: 'location',
      timezone: 'timezone',
      contact_name: 'contact_name',
      contact_phone: 'contact_phone',
      contact_email: 'contact_email',
      parent_id: 'parentCompanyName',
      category: 'category',
      region_id: 'regionName',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changedFields = company.changed() || [];

        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        const updatedCompany = await this.getCompanyById(company.id);
        if (properties.length) {
          const changelogs = await this.formatCompanyChangeLog(
            properties,
            updatedCompany,
            oldCompany,
            editor,
          );

          if (changelogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

            const translateService =
              await AppInjector.resolve(TranslateService);

            for (const changelog of bulkChangeLogs) {
              const logs =
                await translateService.translateSingleChangLogToAllLanguages(
                  changelog,
                  PolymorphicType.COMPANY,
                );

              await sendChangeLogUpdate(logs, editor, PolymorphicType.COMPANY);
            }
          }
        }
      });
    }
  }

  static async formatCompanyChangeLog(
    properties: string[],
    _company: Company,
    oldCompany?: Company,
    editor?: Editor,
  ) {
    const changelogs = [];
    const company = _company.get({ plain: true });
    const oldCompanyPlain = oldCompany.get({ plain: true });

    for (const property of properties) {
      let text = '';
      const newValue = company[property];
      const oldValue = oldCompanyPlain[property];

      switch (property) {
        case 'about':
          text = `Description has been updated from '${oldValue || 'N/A'}' to '${newValue || 'N/A'}'`;
          break;
        case 'regionName':
          text = `Region has been updated from '${oldValue || 'N/A'}' to '${newValue || 'N/A'}'`;
          break;
        case 'parentCompanyName':
          text = `Parent Company has been updated from '${oldValue || 'N/A'}' to '${newValue || 'N/A'}'`;
          break;
        case 'contact_phone':
        case 'contact_email':
        case 'contact_name':
          text = `Primary ${humanizeTitleCase(property)} has been updated from '${oldValue || 'N/A'}' to '${newValue || 'N/A'}'`;
          break;

        default:
          text = `${humanizeTitleCase(property)} has been updated from '${oldValue || 'N/A'}' to '${newValue || 'N/A'}'`;
          break;
      }

      changelogs.push({
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: company.id,
        change_logable_type: PolymorphicType.COMPANY,
        parent_changed_at: Date.now(),
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        commented_by: editor.editor_name,
      });
    }
    return changelogs;
  }

  static async getCompanyById(id: number) {
    return await Company.findByPk(id, {
      attributes: [
        'id',
        'name',
        'about',
        'url',
        'location',
        'contact_name',
        'contact_phone',
        'country',
        'parent_id',
        'timezone',
        'contact_email',
        'category',
        'region_id',
        [
          Sequelize.literal(
            `(SELECT name FROM companies where "id"="Company"."parent_id")`,
          ),
          'parentCompanyName',
        ],
        [Sequelize.literal(`"region"."name"`), 'regionName'],
      ],
      include: [
        {
          model: Region,
          attributes: ['name'],
        },
      ],
      plain: true,
      useMaster: true,
    });
  }

  @AfterUpdate
  static async createTranslationsInDefaultLanguage(
    company: Company,
    options: {
      transaction?: Transaction;
      configService: ConfigService;
      googleTranslate: v2.Translate;
    },
  ) {
    const newValues = company.dataValues;
    const oldValues = company.previous();

    if (
      !newValues.parent_id ||
      !oldValues.default_lang ||
      oldValues.default_lang === newValues.default_lang
    )
      return;

    const { transaction, googleTranslate, configService } = options;
    transaction.afterCommit(async () => {
      try {
        const incidentTypeTranslation = await IncidentTypeTranslation.findOne({
          where: { language: newValues.default_lang },
          attributes: ['created_at'],
          include: [
            {
              model: IncidentType,
              where: {
                company_id: company.id,
                parent_id: { [Op.ne]: null },
              },
              attributes: [],
            },
          ],
          order: [['created_at', 'DESC']],
        });

        const translationsToCopy = await IncidentTypeTranslation.findAll({
          where: {
            language: oldValues.default_lang,
            ...(incidentTypeTranslation && {
              created_at: {
                [Op.gt]: incidentTypeTranslation.dataValues.created_at,
              },
            }),
          },
          include: [
            {
              model: IncidentType,
              where: {
                company_id: company.id,
                parent_id: { [Op.ne]: null },
              },
              attributes: [],
            },
          ],
        });

        const bulkIncidentTypeTranslations = [];

        for (let translation of translationsToCopy) {
          translation = translation.dataValues;

          const translatedText = await translateWithRetry(
            translation.translation,
            newValues.default_lang,
            googleTranslate,
            configService.get('MAX_TRANSLATE_ATTEMPT'),
          );

          delete translation.id;

          bulkIncidentTypeTranslations.push({
            ...translation,
            language: newValues.default_lang,
            translation: translatedText,
            incident_type_id: translation.incident_type_id,
          });
        }

        await IncidentTypeTranslation.bulkCreate(bulkIncidentTypeTranslations);
      } catch (error) {
        console.log('🚀 ~ Company ~ error:', error);
      }
    });
  }
}
