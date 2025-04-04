import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import {
  STRING,
  BOOLEAN,
  INTEGER,
  JSONB,
  TEXT,
  DATEONLY,
  TIME,
  Transaction,
} from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
  BelongsToMany,
  Sequelize,
  AfterCreate,
  HasOne,
  BeforeUpdate,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import {
  ChangeLog,
  Comment,
  Company,
  ContactDirectory,
  Day,
  Image,
  IncidentMessageCenter,
  MessageSetting,
  EventUser,
  EventContact,
  EventSubtasks,
  EventSource,
  EventIncidentDivision,
  EventIncidentType,
  IncidentZone,
  MobileIncidentInbox,
  PriorityGuide,
  PresetMessage,
  MessageGroup,
  Scan,
  EventDepartment,
  EventInventory,
  Incident,
  UserIncidentDivision,
  IncidentDivision,
  IncidentType,
  Inventory,
  Department,
  User,
  InventoryZone,
  Shift,
  UserPins,
  Reservation,
  IncidentForm,
  EventCad,
  Assignment,
  LostAndFound,
  ServiceRequest,
  Vendor,
  EventVendors,
  Route,
  ReservationStatistic,
  RidershipStatistics,
  GlobalIncident,
  ReferenceMap,
  PointOfInterest,
  StaffEventSchedule,
  Cad,
  Task,
  TaskList,
  EventDepartmentUser,
  TicketClearTemplate,
  Zone,
  CameraZone,
  ResolvedIncidentNote,
  Alert,
  Note,
  AuditShift,
  Region,
  ScanCount,
  ServiceRequestType,
  EventInventoryType,
  InventoryType,
  LiveVideo,
  Damage,
  InventoryDamage,
  WeatherProvider,
  Conversation,
  DotMapShift,
  DotMapDot,
  Preset,
  EventTwilioNumbers,
} from '.';
import {
  Editor,
  MessageType,
  PinableType,
  PolymorphicType,
  Priority,
} from '../constants';
import {
  createChangeLog,
  formatDate,
  handleAfterCommit,
  humanizeTitleCase,
  sendChangeLogUpdate,
} from '../helpers';
import { AppInjector } from '../controllers';
import { TranslateService } from '../services';

@Table({
  tableName: 'events',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Event extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @Column({ type: JSONB })
  location: any;

  @Column({ type: INTEGER })
  vehicle_count: number;

  @Column({ type: INTEGER })
  total_hours: number;

  @Column({ type: INTEGER })
  hourly_rate: number;

  @Column({ type: BOOLEAN })
  active: boolean;

  @Column({ type: TEXT })
  about_event: string;

  @Column({ type: DATEONLY })
  start_date: Date;

  @Column({ type: DATEONLY })
  end_date: Date;

  @Column({ type: BOOLEAN })
  staff_future: boolean;

  @Column({ type: BOOLEAN })
  department_future: boolean;

  @Column({ type: BOOLEAN })
  vendor_future: boolean;

  @Column({ type: BOOLEAN })
  reservation_future: boolean;

  @Column({ type: BOOLEAN })
  camping_future: boolean;

  @Column({ type: BOOLEAN })
  inventory_future: boolean;

  @Column({ type: BOOLEAN })
  service_request_future: boolean;

  @Column({ type: BOOLEAN })
  incident_future: boolean;

  @Column({ type: BOOLEAN })
  incident_future_v2: boolean;

  @Column({ type: BOOLEAN })
  reporting_future: boolean;

  @Column({ type: BOOLEAN })
  dot_map_service_v2: boolean;

  @Column({ type: BOOLEAN })
  transportation_future: boolean;

  @Column({ type: STRING })
  event_location: string;

  @Column({ type: STRING })
  short_event_location: string;

  @Column({ type: BOOLEAN })
  deposit_full_charges: boolean;

  @Column({ type: STRING })
  time_zone: string;

  @Column({ type: STRING })
  logo: string;

  @Column({ type: BOOLEAN })
  lost_and_found_future: boolean;

  @Column({ type: BOOLEAN })
  message_service: boolean;

  @Column({ type: BOOLEAN })
  archive: boolean;

  @Column({ type: INTEGER })
  status: number;

  @Column({ type: STRING })
  venue_name: string;

  @Column({ type: INTEGER })
  expected_attendance: number;

  @Column({ type: INTEGER })
  event_type: number;

  @Column({ type: BOOLEAN })
  messaging_capability: boolean;

  @Column({ type: BOOLEAN })
  workforce_messaging: boolean;

  @Column({ type: BOOLEAN })
  guest_messaging: boolean;

  @Column({ type: BOOLEAN })
  pre_show_block: boolean;

  @Column({ type: BOOLEAN })
  show_block: boolean;

  @Column({ type: BOOLEAN })
  post_show_block: boolean;

  @Column({ type: JSONB })
  frequently_used_dot: any;

  @Column({ type: TIME })
  start_time: string;

  @Column({ type: TIME })
  end_time: string;

  @Column({ type: BOOLEAN })
  dot_map_service: boolean;

  @Column({ type: INTEGER })
  daily_attendance: number;

  @Column({ type: INTEGER })
  external_event_id: number;

  @Column({ type: DATEONLY })
  public_start_date: Date;

  @Column({ type: DATEONLY })
  public_end_date: Date;

  @Column({ type: TIME })
  public_start_time: string;

  @Column({ type: TIME })
  public_end_time: string;

  @Column({ type: STRING })
  url: string;

  @Column({ type: STRING })
  key_genre: string;

  @Column({ type: STRING })
  genre: string;

  @Column({ type: STRING })
  sub_genre: string;

  @Column({ type: BOOLEAN })
  division_lock_service: boolean;

  @Column({ type: BOOLEAN })
  event_access_lock: boolean;

  @Column({ type: BOOLEAN, defaultValue: false })
  task_future: boolean;

  @Column({ type: BOOLEAN })
  demo_event: boolean;

  @Column({ type: STRING })
  request_status: string;

  @Column({ type: STRING })
  event_category: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  ticket_clear_template_future: boolean;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  requestee_id: number;

  @Column({ type: BOOLEAN, defaultValue: false })
  event_form_future: boolean;

  @Column({ type: STRING, defaultValue: 'festivals' })
  dialer_layout: string;

  @Column({ type: BOOLEAN })
  dialer_dispatch_layout: boolean;

  @Column({ type: BOOLEAN })
  audit_future: boolean;

  @ForeignKey(() => Region)
  @Column({ type: INTEGER })
  region_id: number;

  @Column({ type: BOOLEAN })
  cloned: boolean;

  @Column({ type: BOOLEAN })
  import: boolean;

  @Column({ type: INTEGER })
  venue_id: number;

  @BelongsTo(() => Region)
  region: Region;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Company)
  company: Company;

  @HasMany(() => EventUser, { onDelete: 'CASCADE' })
  event_users: EventUser[];

  @BelongsToMany(() => User, () => EventUser)
  users: User[];

  @BelongsToMany(() => EventContact, () => ContactDirectory)
  event_contacts: EventContact[];

  @BelongsToMany(() => Vendor, () => EventVendors)
  vendors: Vendor[];

  @HasMany(() => Route)
  routes: Route[];

  @HasMany(() => EventVendors)
  event_vendors: EventVendors[];

  @HasMany(() => MessageSetting)
  message_settings: MessageSetting[];

  @HasMany(() => Day)
  days: Day[];

  @HasMany(() => EventCad)
  event_cads: EventCad[];

  @HasMany(() => IncidentMessageCenter)
  incident_message_centers: IncidentMessageCenter[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    constraints: false,
    scope: { imageable_type: 'Event' },
    as: 'eventAttachments',
  })
  eventAttachments: Image[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    constraints: false,
    scope: { imageable_type: 'Audit' },
    as: 'auditAttachments',
  })
  auditAttachments: Image[];

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    constraints: false,
    scope: { imageable_type: PolymorphicType.EVENT_INCIDENTS },
    as: 'eventIncidents',
  })
  eventIncidents: Image[];

  @HasMany(() => EventSubtasks)
  subtasks: EventSubtasks[];

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: 'Event' },
    as: 'eventLogs',
  })
  eventLogs: ChangeLog[];

  @HasMany(() => Comment, {
    foreignKey: 'commentable_id',
    constraints: false,
    scope: { commentable_type: 'Event' },
    as: 'eventComments',
  })
  eventComments: Comment[];

  @HasMany(() => EventSource)
  event_sources: EventSource[];

  @HasMany(() => EventIncidentDivision)
  event_incident_divisions: EventIncidentDivision[];

  @BelongsToMany(() => IncidentDivision, () => EventIncidentDivision)
  incident_divisions: EventIncidentDivision[];

  @HasMany(() => EventIncidentType)
  event_incident_types: EventIncidentType[];

  @BelongsToMany(() => IncidentType, () => EventIncidentType)
  incident_types: IncidentType[];

  @HasMany(() => IncidentZone)
  incident_zones: IncidentZone[];

  @HasMany(() => Incident)
  incidents: Incident[];

  @HasMany(() => MobileIncidentInbox)
  mobile_incident_inboxes: MobileIncidentInbox[];

  @HasMany(() => PriorityGuide)
  priority_guides: PriorityGuide[];

  @HasMany(() => PresetMessage)
  preset_messages: PresetMessage[];

  @HasMany(() => MessageGroup, {
    foreignKey: 'message_groupable_id',
    constraints: false,
    scope: { message_groupable_type: PolymorphicType.EVENT },
    as: 'eventMessageGroups',
  })
  eventMessageGroups: MessageGroup[];

  @HasMany(() => UserPins, {
    foreignKey: 'pinable_id',
    constraints: false,
    scope: { pinable_type: PinableType.EVENT },
    as: 'user_pin_events',
  })
  user_pin_events: UserPins[];

  @HasMany(() => UserPins, {
    foreignKey: 'pinable_id',
    constraints: false,
    scope: { pinable_type: PinableType.DASHBOARD_EVENT },
    as: 'user_dashboard_pin_events',
  })
  user_dashboard_pin_events: UserPins[];

  @HasMany(() => Note, {
    foreignKey: 'noteable_id',
    constraints: false,
    scope: { noteable_type: PolymorphicType.EVENT },
  })
  event_notes: Note[];

  @HasMany(() => Scan)
  scans: Scan[];

  @HasMany(() => EventDepartment)
  event_departments: EventDepartment[];

  @BelongsToMany(() => Department, () => EventDepartment)
  departments: Department[];

  @HasMany(() => EventInventory)
  event_inventories: EventInventory[];

  @BelongsToMany(() => Inventory, () => EventInventory)
  inventories: Inventory[];

  @HasMany(() => UserIncidentDivision)
  user_incident_divisions: UserIncidentDivision[];

  @HasMany(() => InventoryZone)
  inventory_zones: InventoryZone[];

  @HasMany(() => Shift)
  shifts: Shift[];

  @HasMany(() => Reservation)
  reservations: Reservation[];

  @HasMany(() => IncidentForm)
  incident_forms: IncidentForm[];

  @HasMany(() => Assignment)
  assignments: Assignment[];

  @HasMany(() => ReservationStatistic)
  reservation_statistic: ReservationStatistic[];

  @HasMany(() => RidershipStatistics)
  ridership_statistics: RidershipStatistics[];

  @HasMany(() => LostAndFound)
  lost_and_founds: LostAndFound[];

  @HasMany(() => ServiceRequest)
  service_requests: ServiceRequest[];

  @HasMany(() => GlobalIncident)
  global_incidents: GlobalIncident[];

  @HasMany(() => ReferenceMap)
  reference_maps: ReferenceMap[];

  @HasMany(() => PointOfInterest)
  point_of_interests: PointOfInterest[];

  @HasMany(() => StaffEventSchedule)
  staff_event_schedules: StaffEventSchedule[];

  @HasMany(() => Cad)
  cads: Cad[];

  @HasMany(() => Task)
  tasks: Task[];

  @HasMany(() => TaskList)
  task_lists: TaskList[];

  @HasMany(() => EventDepartmentUser)
  event_department_users: EventDepartmentUser[];

  @HasOne(() => TicketClearTemplate)
  ticket_clear_template: TicketClearTemplate;

  @HasMany(() => Zone)
  zones: Zone[];

  @HasMany(() => CameraZone)
  camera_zones: CameraZone[];

  @HasMany(() => ResolvedIncidentNote)
  resolved_incident_note: ResolvedIncidentNote[];

  @HasMany(() => Alert)
  alerts: Alert[];

  @HasMany(() => AuditShift)
  audit_shifts: AuditShift[];

  @HasMany(() => DotMapShift)
  dotmap_shifts: DotMapShift[];

  @HasMany(() => DotMapDot)
  dotmap_dots: DotMapDot[];

  @HasMany(() => Preset)
  presets: Preset[];

  @HasMany(() => ScanCount)
  scan_counts: ScanCount[];

  @HasMany(() => ServiceRequestType)
  service_request_types: ServiceRequestType[];

  @HasMany(() => EventInventoryType)
  event_inventory_types: EventInventoryType[];

  @HasMany(() => EventTwilioNumbers)
  event_twilio_numbers: EventTwilioNumbers[];

  @BelongsToMany(() => InventoryType, () => EventInventoryType)
  inventory_types: InventoryType[];

  @HasMany(() => LiveVideo)
  live_videos: LiveVideo[];

  @HasMany(() => Damage)
  damage: Damage[];

  @HasMany(() => InventoryDamage)
  inventory_damage: InventoryDamage[];

  @ForeignKey(() => WeatherProvider)
  @Column({ type: INTEGER })
  weather_provider_id: number;

  @BelongsTo(() => WeatherProvider)
  weather_provider: WeatherProvider;

  @HasMany(() => Conversation)
  conversations: Conversation[];

  // Computed property
  public static getStatusNameByKey: Literal = Sequelize.literal(`(
    CASE 
        WHEN "Event"."status" IS NOT NULL THEN 
        CASE 
            WHEN "Event"."status" = 0 THEN 'on_hold'
            WHEN "Event"."status" = 1 THEN 'completed'
            WHEN "Event"."status" = 2 THEN 'in_progress'
            WHEN "Event"."status" = 3 THEN 'upcoming'
            ELSE NULL
          END
        ELSE 'upcoming'
      END
    )
    `);

  public static getTypeNameByKey: Literal = Sequelize.literal(`(
        CASE 
            WHEN "Event"."event_type" IS NOT NULL THEN 
            CASE 
                WHEN "Event"."event_type" = 0 THEN 'dot_map'
                WHEN "Event"."event_type" = 1 THEN 'event'
                ELSE NULL
              END
            ELSE NULL
          END
        )
    `);

  public static orderByStatusSequence: Literal = Sequelize.literal(`(
    CASE 
        WHEN "Event"."status" = 2 THEN 0
        WHEN "Event"."status" = 3 THEN 1
        WHEN "Event"."status" = 1 THEN 2
        WHEN "Event"."status" = 0 THEN 3
      END
    )
  `);

  // hooks for changelogs
  @AfterCreate
  static async createEventChangeLog(
    event: Event,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          formatted_log_text: `Created an event`,
          change_logable_id: event.id,
          change_logable_type: PolymorphicType.EVENT,
          column: 'event',
          editor_type: PolymorphicType.USER,
          old_value: null,
          new_value: event.name,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.EVENT);
      });
    }
  }

  // hooks
  @AfterCreate
  static async createIncidentMessageCenter(event: Event, options: any) {
    const { isCloned } = options;

    if (isCloned) return;

    const centerNames = ['Inbox A', 'Inbox B'];

    for (const centerName of centerNames) {
      await IncidentMessageCenter.findOrCreate({
        where: { event_id: event.id, name: centerName },
      });
    }
  }

  @AfterCreate
  static async createMobileIncidentInbox(event: Event) {
    await MobileIncidentInbox.findOrCreate({
      where: { event_id: event.id, name: 'SOS Guest Inbox' },
    });
  }

  @AfterCreate
  static async createPriorityGuides(event: Event) {
    const eventPriorityGuidesFile = path.join(
      __dirname,
      'seed/event-priority-guides.json',
    );

    let defaultPriorityGuides = fs.readFileSync(
      eventPriorityGuidesFile,
      'utf-8',
    );
    defaultPriorityGuides = JSON.parse(defaultPriorityGuides);

    for (const priorityGuide of defaultPriorityGuides) {
      await PriorityGuide.findOrCreate({
        where: {
          event_id: event.id,
          priority: Object.values(Priority).indexOf(
            priorityGuide['priority'].toUpperCase(),
          ),
          name: priorityGuide['name'],
          description: priorityGuide['description'],
        },
      });
    }
  }

  @AfterCreate
  static async createPresetMessages(event: Event, options: any) {
    const { isCloned } = options;

    if (isCloned) return;

    const eventPresetMessagesFile = path.join(
      __dirname,
      'seed/event-preset-messages.json',
    );

    let defaultPresetMessages = fs.readFileSync(
      eventPresetMessagesFile,
      'utf-8',
    );

    defaultPresetMessages = JSON.parse(defaultPresetMessages);

    for (const presetMessage of defaultPresetMessages) {
      await PresetMessage.findOrCreate({
        where: {
          event_id: event.id,
          title: presetMessage['title'],
          text: presetMessage['text'],
        },
      });
    }
  }

  @AfterCreate
  static async createScanTypeMessageGroup(event: Event) {
    const scanTypes: string[] = [
      'pick_up_pax',
      'drop_unload',
      'venue_staging',
      'break_in',
      'out_of_service',
    ];

    for (const scanType of scanTypes) {
      const messageGroup = await MessageGroup.findOrCreate({
        where: {
          scan_type: scanType,
          message_groupable_id: event.id,
          message_groupable_type: PolymorphicType.EVENT,
          company_id: event.company_id,
          message_type: Object.values(MessageType).indexOf('CUSTOM'),
          event_id: event.id,
        },
      });

      messageGroup[0].name = humanizeTitleCase(scanType);
      messageGroup[0].save();
    }
  }

  @AfterCreate
  static async addAndUpdateExternalEventId(event: Event) {
    if (!event.name) return;
    this.addAndUpdateExternalEventIdWithDelay(event);
  }

  @BeforeUpdate
  static async updateEventChangelog(
    event: Event,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    // Fetch the old state of the event before the update
    const oldEvent = await this.getEventById(event.id);

    // Define which fields we want to track for changes
    const mapping: Record<string, string> = {
      name: 'name',
      status: 'status',
      about_event: 'about_event',
      request_status: 'request_status',
      venue_name: 'venue_name',
      demo_event: 'demo_event',
      event_category: 'event_category',
      event_access_lock: 'event_access_lock',
      division_lock_service: 'division_lock_service',
      start_date: 'start_date',
      end_date: 'end_date',
      public_start_date: 'public_start_date',
      public_end_date: 'public_end_date',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Get the fields that have been modified in this update
        const changedFields = event.changed() || [];

        // Map the changed fields to the properties we care about
        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        const updatedEvent = await this.getEventById(event.id);

        if (properties.length) {
          // Generate the change logs for the modified properties
          const changelogs = await this.formatEventChangeLog(
            properties,
            updatedEvent,
            editor,
            oldEvent,
          );

          if (changelogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

            const translateService =
              await AppInjector.resolve(TranslateService);

            for (const changelog of bulkChangeLogs) {
              const logs =
                await translateService.translateSingleChangLogToAllLanguages(
                  changelog,
                  PolymorphicType.EVENT,
                );

              await sendChangeLogUpdate(logs, editor, PolymorphicType.EVENT);
            }
          }
        }
      });
    }
  }

  static async getEventById(id: number) {
    return await Event.findByPk(id, {
      attributes: [
        'id',
        'name',
        'about_event',
        'request_status',
        'venue_name',
        'demo_event',
        'event_category',
        'event_access_lock',
        'division_lock_service',
        'start_date',
        'end_date',
        'public_start_date',
        'public_end_date',
        [Event.getStatusNameByKey, 'status'],
      ],
      useMaster: true,
    });
  }

  static async formatEventChangeLog(
    properties: string[],
    event: Event,
    editor: Editor,
    oldEvent: Event,
  ) {
    const changelogs = [];
    const eventPlain = event.get({ plain: true });
    const oldEventPlain = oldEvent.get({ plain: true });

    for (const property of properties) {
      let text = '';
      const newValue = eventPlain[property];
      const oldValue = oldEventPlain[property];

      switch (property) {
        case 'demo_event':
          text = `${eventPlain.demo_event ? 'The event has been marked as Demo' : 'The event is no longer marked as Demo'}`;
          break;
        case 'event_access_lock':
          text = `Event Access Lock has been ${eventPlain.event_access_lock ? 'enabled' : 'disabled'}`;
          break;
        case 'division_lock_service':
          text = `Division Lock Service has been ${eventPlain.division_lock_service ? 'enabled' : 'disabled'}`;
          break;
        case 'about_event':
          text = `Description has been updated from '${oldValue}' to '${newValue}'`;
          break;
        case 'start_date':
          text = `Operational Start Date has been updated from '${formatDate(oldValue)}' to '${formatDate(newValue)}'`;
          break;
        case 'end_date':
          text = `Operational End Date has been updated from '${formatDate(oldValue)}' to '${formatDate(newValue)}'`;
          break;
        case 'public_start_date':
          if (formatDate(oldValue) !== formatDate(newValue)) {
            text = `Public Start Date has been updated from '${formatDate(oldValue)}' to '${formatDate(newValue)}'`;
            break;
          }
          continue;
        case 'public_end_date':
          if (formatDate(oldValue) !== formatDate(newValue)) {
            text = `Public End Date has been updated from '${formatDate(oldValue)}' to '${formatDate(newValue)}'`;
            break;
          }
          continue;

        default:
          text = ` ${humanizeTitleCase(property)} has been updated from '${humanizeTitleCase(oldValue)}' to '${humanizeTitleCase(newValue)}'`;
          break;
      }

      changelogs.push({
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: event.id,
        change_logable_type: PolymorphicType.EVENT,
        parent_changed_at: new Date(),
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        editor_name: editor.editor_name,
      });
    }

    return changelogs;
  }

  // private functions
  private static async addAndUpdateExternalEventIdWithDelay(event: Event) {
    try {
      const response = await axios.get(
        'https://festival-staging.insomniac.com/api/partner/events/?app=737bec9c82c7fbe&ver=1660040761',
        {
          headers: { 'partner-token': 'HjyJXWCvu2yR3vcwAgtKct3-mgHIMEJE' },
        },
      );

      const resData = response.data['data'] || [];
      const data = resData.find((res: any) => res['name'] === event.name);

      if (data && event.name === data['name']) {
        await event.update({ external_event_id: data['id'] });
      }
    } catch (err) {
      console.log(
        '🚀 ~ file: event.model.ts:437 ~ Event ~ addAndUpdateExternalEventIdWithDelay ~ err:',
        err,
      );
    }
  }
}
