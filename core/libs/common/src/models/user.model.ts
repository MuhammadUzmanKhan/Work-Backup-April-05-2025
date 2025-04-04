import 'reflect-metadata';

import {
  STRING,
  BOOLEAN,
  INTEGER,
  DATE,
  JSONB,
  Transaction,
  UpdateOptions,
} from 'sequelize';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  Unique,
  AllowNull,
  AutoIncrement,
  HasMany,
  HasOne,
  BelongsToMany,
  Sequelize,
  AfterCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import { randomBytes } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { ForbiddenException } from '@nestjs/common';
import {
  Company,
  Image,
  EventUser,
  Comment,
  Scan,
  IncidentDepartmentUsers,
  DepartmentUsers,
  Location,
  Department,
  Incident,
  UserIncidentDivision,
  IncidentDivision,
  Event,
  UserCompanyRole,
  UserShift,
  Shift,
  Alert,
  Filter,
  UserPins,
  Message,
  UserInventory,
  Assignment,
  Inventory,
  LostAndFound,
  ServiceRequest,
  Vendor,
  Route,
  Day,
  DayRoute,
  VendorRole,
  UserVendorRole,
  VendorUsers,
  MessageGroupUsers,
  MessageGroup,
  UserRoute,
  HourEstimation,
  StaffEventSchedule,
  UserTask,
  Task,
  EventDepartmentUser,
  Camper,
  Note,
  ScanCount,
  ReferenceMap,
  LiveVideo,
  BaseDeployment,
  ChangeLog,
  TaskListOrder,
  UserNotification,
  NotificationSetting,
  CommentMention,
  Chat,
  Preset,
} from '.';
import { Editor, ERRORS, PolymorphicType, RolesNumberEnum } from '../constants';
import {
  handleAfterCommit,
  humanizeTitleCase,
  parseCSV,
  sendChangeLogUpdate,
} from '../helpers';
import { RolesEnum } from '../constants';

@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
  defaultScope: {
    attributes: {
      exclude: [
        'encrypted_password',
        'pin',
        'reset_password_token',
        'sender_cell',
        'mfa_token',
      ],
    },
  },
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Unique
  @AllowNull(false)
  @Column({ type: STRING })
  email: string;

  @AllowNull(false)
  @Column({ type: STRING })
  encrypted_password: string;

  @Column({ type: STRING })
  reset_password_token: string;

  @Column({ type: DATE })
  reset_password_sent_at: Date;

  @Column({ type: DATE })
  remember_created_at: Date;

  @AllowNull(false)
  @Column({ type: INTEGER, defaultValue: 0 })
  sign_in_count: number;

  @Column({ type: DATE })
  current_sign_in_at: Date;

  @Column({ type: DATE })
  last_sign_in_at: Date;

  @Column({ type: STRING })
  current_sign_in_ip: string;

  @Column({ type: STRING })
  last_sign_in_ip: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  cell: string;

  @Column({ type: STRING })
  pin: string;

  @Column({ type: JSONB })
  last_scan: any; // TODO: Update the type

  @Column({ type: BOOLEAN })
  employee: boolean;

  @Column({ type: STRING })
  first_name: string;

  @Column({ type: STRING })
  last_name: string;

  @Column({ type: BOOLEAN })
  active: boolean;

  @Column({ type: BOOLEAN })
  demo_user: boolean;

  @Column({ type: BOOLEAN })
  message_service: boolean;

  @Column({ type: INTEGER })
  status: number;

  @Column({ type: STRING })
  country_code: string;

  @Column({ type: STRING })
  device_model: string;

  @Column({ type: STRING })
  app_version: string;

  @Column({ type: STRING })
  country_iso_code: string;

  @Column({ type: DATE })
  blocked_at: Date;

  @Column({ type: BOOLEAN })
  reference_user: boolean;

  @Column({ type: STRING, defaultValue: 'en' })
  language_code: string;

  @Column({ type: STRING })
  sender_cell: string;

  @Column({ type: STRING })
  mfa_token: string;

  @Column({ type: STRING })
  time_format: string;

  @Column({ type: STRING })
  temperature_format: string;

  @Column({ type: STRING })
  date_format: string;

  @HasMany(() => EventUser, { onDelete: 'CASCADE' })
  event_users: EventUser[];

  @HasMany(() => Chat, { foreignKey: 'sender_id', onDelete: 'CASCADE' })
  legal_chats: Chat[];

  @HasMany(() => HourEstimation)
  hour_estimations: HourEstimation[];

  @BelongsToMany(() => Event, () => EventUser)
  events: Event[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    constraints: false,
    scope: { imageable_type: 'User' },
  })
  images: Image[];

  @HasMany(() => Comment, {
    foreignKey: 'commentable_id',
    constraints: false,
    scope: { commentable_type: 'User' },
    as: 'comments',
  })
  comments: Comment[];

  @HasMany(() => UserPins, { onDelete: 'CASCADE' })
  user_pins: UserPins[];

  @HasMany(() => UserInventory, { onDelete: 'CASCADE' })
  user_inventories: UserInventory[];

  @BelongsToMany(() => Inventory, () => UserInventory)
  inventories: Inventory[];

  @HasMany(() => Scan, { onDelete: 'CASCADE' })
  scans: Scan[];

  @HasMany(() => IncidentDepartmentUsers)
  incident_department_users: IncidentDepartmentUsers[];

  @BelongsToMany(() => Incident, () => IncidentDepartmentUsers)
  incidents: Incident[];

  @HasOne(() => DepartmentUsers, { onDelete: 'CASCADE' })
  department_user: DepartmentUsers;

  @BelongsToMany(() => Department, () => DepartmentUsers)
  department: Department;

  @HasOne(() => Location, {
    foreignKey: 'locationable_id',
    constraints: false,
    scope: { locationable_type: 'User' },
    as: 'location',
  })
  location: Location;

  @HasMany(() => UserIncidentDivision)
  user_incident_divisions: UserIncidentDivision[];

  @BelongsToMany(() => IncidentDivision, () => UserIncidentDivision)
  incident_divisions: IncidentDivision[];

  @HasMany(() => UserShift, { onDelete: 'CASCADE' })
  user_shifts: UserShift[];

  @HasMany(() => UserRoute, { onDelete: 'CASCADE' })
  user_routes: UserRoute[];

  @BelongsToMany(() => Shift, () => UserShift)
  shift: Shift[];

  @HasMany(() => Alert)
  user_alerts: Alert[];

  @HasMany(() => Filter)
  filters: Filter[];

  @HasMany(() => Message, {
    foreignKey: 'messageable_id',
    constraints: false,
    scope: { messageable_type: 'User' },
    as: 'userMessages',
  })
  userMessages: Message[];

  @HasMany(() => Assignment)
  assignment: Assignment[];

  @HasMany(() => LostAndFound)
  lost_and_founds: LostAndFound[];

  @HasMany(() => ServiceRequest)
  service_requests: ServiceRequest[];

  @HasMany(() => MessageGroupUsers, { onDelete: 'CASCADE' })
  message_group_users: MessageGroupUsers[];

  @BelongsToMany(() => MessageGroup, () => MessageGroupUsers)
  message_groups: MessageGroup[];

  @HasMany(() => StaffEventSchedule)
  staff_event_schedules: StaffEventSchedule[];

  @HasMany(() => UserTask, { foreignKey: 'user_id' })
  user_tasks: UserTask[];

  @BelongsToMany(() => Task, () => UserTask)
  tasks: Task[];

  @HasMany(() => EventDepartmentUser)
  event_department_users: EventDepartmentUser[];

  @HasMany(() => Event)
  event_requests: Event[];

  @HasMany(() => VendorUsers, { onDelete: 'CASCADE' })
  vendor_users: VendorUsers[];

  @BelongsToMany(() => Vendor, () => VendorUsers)
  vendors: Vendor[];

  @HasMany(() => UserCompanyRole)
  users_companies_roles: UserCompanyRole[];

  @BelongsToMany(() => Company, () => UserCompanyRole)
  companies: Company[];

  @HasMany(() => Note)
  notes: Note[];

  @HasMany(() => ScanCount)
  scan_counts: ScanCount[];

  @HasMany(() => ReferenceMap)
  reference_maps: ReferenceMap[];

  @HasMany(() => LiveVideo)
  live_videos: LiveVideo[];

  @HasMany(() => BaseDeployment)
  base_deployments: BaseDeployment[];

  @HasMany(() => TaskListOrder, { onDelete: 'CASCADE' })
  task_list_orders: TaskListOrder[];

  @HasMany(() => UserNotification, { onDelete: 'CASCADE' })
  user_notifications: UserNotification[];

  @HasMany(() => NotificationSetting, { onDelete: 'CASCADE' })
  notification_settings: TaskListOrder[];

  @HasMany(() => Preset)
  presets: Preset[];

  @HasMany(() => CommentMention, { onDelete: 'CASCADE' })
  comment_mentions: CommentMention[];

  // hooks
  @AfterCreate
  static async addTelnyxPhoneNumber(user: User) {
    const { country_code, cell } = user;
    const numbers = process.env.TELNYX_PHONE_NUMBERS.split(',');
    const randomNumber = Math.floor(Math.random() * numbers.length);

    const camper = await Camper.findOne({
      where: { cell, country_code },
      attributes: ['sender_cell'],
    });

    await user.update({
      sender_cell: camper?.sender_cell || numbers[randomNumber],
    });
  }

  // Changelogs for User
  @BeforeUpdate
  static async updateUserChangelogs(
    user: User,
    options: { transaction?: Transaction },
  ) {
    // Extract the editor information from options
    const { editor } = options as UpdateOptions & { editor: Editor };

    // Skip if the user is being created for the first time
    if (user['_options'].isNewRecord && !editor) return;

    const { transaction } = options;

    // Fetch the old state of the user before the update
    const oldUser = await this.getUserById(user.id);

    // Map of user properties to track changes
    const mapping: Record<string, string> = {
      blocked_at: 'blocked_at',
      status: 'status',
      demo_user: 'demo_user',
      name: 'name',
      first_name: 'first_name',
      last_name: 'last_name',
      cell: 'cell',
      email: 'email',
      language_code: 'language_code',
      country_code: 'country_code',
    };

    if (transaction) {
      // Execute after the transaction has been committed
      await handleAfterCommit(transaction, async () => {
        // Get the fields that have been modified in this update
        const changedFields = user.changed() || [];

        // Map the changed fields to the properties we care about
        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        if (properties.length) {
          // Generate the change logs for the modified properties
          const changelogs = await this.formatChangeLog(
            properties,
            user,
            editor,
            oldUser,
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

  static async formatChangeLog(
    properties: string[],
    user: User,
    editor: Editor,
    oldUser?: User,
  ) {
    const changelogs = [];

    // Convert the updated user object to a plain object
    const userPlain = user.get({ plain: true });

    // Iterate over the properties that were changed
    for (const property of properties) {
      let text = '';
      const newValue = userPlain[property];
      const oldValue = oldUser[property];

      // Determine the appropriate change log message based on the property
      switch (property) {
        case 'blocked_at':
          text = `has been ${newValue ? 'Blocked' : 'Unblocked'}`;
          break;
        case 'demo_user':
          text = `has been updated to ${newValue ? 'Demo User' : 'Real User'}`;
          break;
        case 'status':
          text = `has been updated the Status to ${newValue === 'available' ? 'Available' : 'Unavailable'}`;
          break;
        default:
          text = `updated the ${humanizeTitleCase(property)} from '${oldValue || 'N/A'}' to '${newValue}'`;
          break;
      }

      // Add the change log entry to the list
      changelogs.push({
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: userPlain.id,
        change_logable_type: PolymorphicType.USER,
        parent_changed_at: Date.now(),
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        commented_by: editor.editor_name,
      });
    }

    return changelogs;
  }

  static async getUserById(id: number) {
    return await User.findByPk(id, {
      attributes: [
        'id',
        'email',
        'name',
        'cell',
        'employee',
        'first_name',
        'last_name',
        'active',
        'app_version',
        'demo_user',
        'device_model',
        'employee',
        'blocked_at',
        'message_service',
        'pin',
        'country_code',
        'country_iso_code',
        'reference_user',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
      ],
      plain: true,
      useMaster: true,
    });
  }

  public static getStatusByKey = `(CASE
    WHEN "users"."status" IS NOT NULL THEN
      CASE
        WHEN "users"."status" = 0 THEN 'available'
        WHEN "users"."status" = 1 THEN 'unavailable'
      END
    ELSE NULL
  END)`;

  public static getStatusByUserKey = `(CASE
    WHEN "User"."status" IS NOT NULL THEN
      CASE
        WHEN "User"."status" = 0 THEN 'available'
        WHEN "User"."status" = 1 THEN 'unavailable'
      END
    ELSE NULL
  END)`;

  public static getSenderStatusByKey = `(CASE
    WHEN "sender"."status" IS NOT NULL THEN
      CASE
        WHEN "sender"."status" = 0 THEN 'available'
        WHEN "sender"."status" = 1 THEN 'unavailable'
      END
    ELSE NULL
  END)`;

  public static getUserRoleByKey: Literal = Sequelize.literal(`(CASE
    WHEN "User"."role" IS NOT NULL THEN
      CASE
        ${Object.entries(RolesEnum)
          .map(
            ([, value], index) =>
              `WHEN "User"."role" = ${index} THEN '${value}'`,
          )
          .join('\n')}
      END
    ELSE NULL
  END)`);

  public static getCreatorUserRoleByKey: Literal = Sequelize.literal(`(CASE
    WHEN "created_by"."role" IS NOT NULL THEN
      CASE
        ${Object.entries(RolesEnum)
          .map(
            ([, value], index) =>
              `WHEN "created_by"."role" = ${index} THEN '${value}'`,
          )
          .join('\n')}
      END
    ELSE NULL
  END)`);

  private static updateStaffCsvHeaderNames(rows) {
    const headerMapping = {
      Name: 'name',
      'First Name': 'first_name',
      'Last Name': 'last_name',
      Email: 'email',
      'Country Code': 'country_code',
      'Country ISO Code': 'country_iso_code',
      Phone: 'cell',
      Role: 'role',
      'Vendor Role Id': 'vendor_role_id',
    };

    return rows.map((obj) =>
      Object.entries(obj).reduce((acc, [key, value]) => {
        const updatedKey = headerMapping[key.trim()] || key.trim();
        return { ...acc, [updatedKey]: value };
      }, {}),
    );
  }

  public static async parseCsvAndSaveUsers(
    params,
    currentCompanyId: number,
    upload_type: string,
    httpService: HttpService,
  ) {
    let parsedFileData = [];
    let userErrors = [];
    let vendor = null;
    let shift = null;
    let route = null;
    let day = null;
    let createdCount = 0;
    let responseMessage: string;

    const department = params.department_id
      ? await Department.findOne({
          where: { id: params.department_id, company_id: currentCompanyId },
        })
      : null;

    const event = (
      await Event.findOne({
        where: { id: params.event_id },
        include: [
          {
            model: Vendor,
            where: params.vendor_id ? { id: params.vendor_id } : {},
            attributes: ['id'],
            through: { attributes: [] },
            required: false,
          },
          {
            model: Route,
            where: params.route_id ? { id: params.route_id } : {},
            required: false,
          },
          {
            model: Shift,
            where: params.shift_id ? { id: params.shift_id } : {},
            required: false,
            include: [{ model: Route, attributes: ['id'] }],
          },
        ],
      })
    ).get({ plain: true });

    if (params.vendor_id) vendor = event.vendors;
    if (!vendor && params.vendor_id)
      throw new ForbiddenException(
        ERRORS.VENDOR_IS_NOT_ASSOCIATED_WITH_PASSED_EVENT_ID,
      );

    if (params.route_id && params.shift_id) {
      if (!params.day_id)
        throw new ForbiddenException(
          ERRORS.DAY_ID_IS_REQUIRED_IF_A_DRIVER_IS_ASSOCIATED_WITH_THE_PASSED_ROUTE_SHIFT,
        );

      route = event.routes;
      shift = event.shifts;

      day = await Day.findOne({
        where: { id: params.day_id, event_id: event.id },
      });
      if (!day) throw new ForbiddenException(ERRORS.DAY_NOT_FOUND);

      const routeShift = route.shifts.find((s) => s.id === shift.id);
      if (!routeShift)
        throw new ForbiddenException(ERRORS.NO_SHIFT_FOUND_FOR_THIS_ROUTE);

      const routeDays = await DayRoute.findAll({
        where: { route_id: route.id, day_id: params.day_id },
      });
      if (!routeDays.length)
        throw new ForbiddenException(
          ERRORS.NO_ROUTE_FOUND_FOR_THE_PASSED_DAY_ID,
        );
    }

    try {
      parsedFileData = await parseCSV(params.file, httpService);
      if (!parsedFileData.length) return [];
    } catch (error) {
      userErrors.push({ department: department?.name, error: error });
    }

    for (const row of User.updateStaffCsvHeaderNames(parsedFileData)) {
      const data = await User.saveUser(
        row,
        params,
        currentCompanyId,
        department,
        upload_type,
        route && shift && day,
        vendor && event,
      );
      userErrors = data?.userErrors;
      if (data?.createdUser) {
        createdCount = createdCount + 1;
      }
      if (
        User.updateStaffCsvHeaderNames(parsedFileData).length > createdCount
      ) {
        responseMessage = 'Some Data Have Anomalies';
      }
    }

    return { userErrors, responseMessage };
  }

  private static async saveUser(
    body,
    params,
    company_id: number,
    department: Department,
    upload_type: string,
    allowCreateShiftRoute: boolean,
    allowCreateVendorUser: boolean,
  ) {
    const userErrors = [];
    let user;
    let createdUser = false;

    try {
      body.company_id = company_id;
      if (!body.country_code.includes('+'))
        body.country_code = `+${body.country_code}`;

      body.country_iso_code = parsePhoneNumberFromString(
        `${body.country_code}${body.cell}`,
      )?.country;
      if (!body.role) return;

      if (!body.country_iso_code) {
        userErrors.push({
          name: `${body['first_name']} ${body['last_name']}`,
          cell: body['cell'],
          department: department?.name,
          error: 'Cell number is invalid with country code',
        });
      }

      user = await User.findOne({
        where: { country_code: body.country_code, cell: body.cell },
      });
      if (!user) {
        body.password = randomBytes(16).toString('hex');
        if (upload_type) body.role = RolesNumberEnum.DRIVER;

        user = await User.create(
          {
            ...body,
            name: `${body.first_name} ${body.last_name}`,
            role: RolesNumberEnum[body.role.toUpperCase()],
            encrypted_password: '',
          },
          { raw: true },
        );

        await UserCompanyRole.create({
          role_id: RolesNumberEnum[body.role.toUpperCase()],
          company_id,
          user_id: user.id,
        });
        createdUser = true;
      }

      const vendorRoleId = body.vendor_role_id ? body.vendor_role_id : null;
      const vendorRoleObj = vendorRoleId
        ? await VendorRole.findOne({
            where: { id: vendorRoleId, company_id: company_id },
          })
        : null;

      if (vendorRoleObj) {
        const userVendorRoleObj = await UserVendorRole.findOne({
          where: { event_id: params.event_id, user_id: user.id },
        });

        if (
          userVendorRoleObj &&
          userVendorRoleObj.vendor_role_id !== vendorRoleId
        ) {
          userErrors.push({
            name: `${body['first_name']} ${body['last_name']}`,
            cell: body['cell'],
            department: department?.name,
            error: 'User has already been associated with another vendor role',
          });
        } else {
          await UserVendorRole.findOrCreate({
            where: {
              event_id: params.event_id,
              vendor_role_id: vendorRoleId,
              user_id: user.id,
            },
          });
        }
      }

      if (!vendorRoleObj && vendorRoleId) {
        userErrors.push({
          name: `${body['first_name']} ${body['last_name']}`,
          cell: body['cell'],
          department: department?.name,
          error: 'VendorRole not found',
        });
      }

      // If route , days and shift exist against the event then create user shifts
      if (allowCreateShiftRoute) {
        await UserShift.findOrCreate({
          where: {
            user_id: user.id,
            shift_id: params.shift_id,
            day_id: params.day_id,
          },
        });
      }

      // If vendor exist against the event then find and create the vendor users
      if (allowCreateVendorUser) {
        await VendorUsers.destroy({
          where: {
            user_id: user.id,
            event_id: params.event_id,
            vendor_id: { $ne: params.vendor_id },
          },
        });

        await VendorUsers.findOrCreate({
          where: {
            vendor_id: params.vendor_id,
            event_id: params.event_id,
          },
        });
      }

      // If department exist against the provided departmentId then create department user if not exist
      if (params.department_id && department) {
        const departUser = (
          await DepartmentUsers.findOrCreate({
            where: {
              user_id: user.id,
              department_id: params.department_id,
            },
          })
        )[0];

        departUser.department_id = department.id;
        departUser.save();
      }

      // Update the Event user if not exist
      params.event_id &&
        (await EventUser.findOrCreate({
          where: { event_id: params.event_id, user_id: user.id },
        }));

      params.division_id &&
        (await UserIncidentDivision.findOrCreate({
          where: {
            user_id: user.id,
            incident_division_id: params.division_id,
            event_id: params.event_id,
          },
        }));
    } catch (error) {
      userErrors.push({
        name: `${body['first_name']} ${body['last_name']}`,
        cell: body['cell'],
        department: department?.name,
        error: error?.errors?.[0].message,
      });
    }

    return { userErrors, createdUser };
  }
}
