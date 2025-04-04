import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';
import {
  CommentableTypes,
  DeleteIncidentType,
  EventAndModuleCount,
  FormattedComment,
  NotificationSocket,
  PolymorphicType,
  PusherChannels,
  PusherEvents,
  SocketTypesStatus,
  TotalAssetsSummary,
} from '../constants';
import {
  Event,
  ChangeLog,
  Image,
  Department,
  Message,
  User,
  IncidentDivision,
  Task,
  TaskList,
  UserCompanyRole,
  Company,
  Incident,
  ResolvedIncidentNote,
  IncidentType,
  AuditStaff,
  Cad,
  CadType,
  GlobalIncident,
  TaskCategory,
  AuditNote,
} from '../models';
@Injectable()
export class PusherService {
  public pusher: Pusher;

  constructor(private readonly configService: ConfigService) {
    this.pusher = new Pusher({
      appId: this.configService.get('PUSHER_APP_ID'),
      key: this.configService.get('PUSHER_KEY'),
      secret: this.configService.get('PUSHER_SECRET'),
      cluster: this.configService.get('PUSHER_CLUSTER'),
      useTLS: true,
    });
  }

  public triggerMultipleEventsAChannel(
    channelName: PusherChannels | PolymorphicType | string,
    events: any[],
    data:
      | Event
      | FormattedComment
      | ChangeLog
      | Image
      | Partial<Department>
      | User
      | IncidentDivision
      | string
      | Message
      | Task
      | TaskList
      | UserCompanyRole
      | Company
      | Incident
      | ResolvedIncidentNote
      | IncidentType
      | DeleteIncidentType[]
      | AuditStaff
      | EventAndModuleCount
      | TotalAssetsSummary[]
      | Cad
      | CadType
      | GlobalIncident
      | any,
  ) {
    events.forEach((event) => {
      this.pusher.trigger(channelName, event, data);
    });
  }

  public sendUpdatedEvent(event: Event) {
    if (event)
      this.triggerMultipleEventsAChannel(
        PusherChannels.EVENTS_CHANNEL,
        [PusherEvents.ALL, event.id.toString()],
        event,
      );
  }

  public sendUpdatedUser(user: User, event_id: number) {
    if (user)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.USER, `${PusherEvents.USER}-${user.id}`],
        user,
      );
  }

  public sendUpdatedChangelog(changelog: ChangeLog, type: PolymorphicType) {
    if (changelog) {
      let channel: PusherChannels;
      switch (type) {
        case PolymorphicType.EVENT:
          channel = PusherChannels.EVENT_CHANGELOG_CHANNEL;
          break;
        case PolymorphicType.TASK:
          channel = PusherChannels.TASK_CHANGELOG_CHANNEL;
          break;
        case PolymorphicType.USER_COMPANY_ROLE:
          channel = PusherChannels.USER_COMPANY_ROLE_CHANGELOG_CHANNEL;
          break;
        case PolymorphicType.EVENT_USER:
          channel = PusherChannels.UNASSIGN_EVENT_USER_CHANNEL;
          break;
        case PolymorphicType.INCIDENT:
          channel = PusherChannels.INCIDENT_CHANGELOG_CHANNEL;
          break;
        case PolymorphicType.COMPANY:
          channel = PusherChannels.COMPANY_CHANGELOG_CHANNEL;
          break;
        case PolymorphicType.USER:
          channel = PusherChannels.USER_CHANGELOG_CHANNEL;
          break;
        case PolymorphicType.INCIDENT_TYPE:
          channel = PusherChannels.INCIDENT_TYPE_CHANGELOG_CHANNEL;
          break;
        case PolymorphicType.INCIDENT_TYPE_TRANSLATION:
          channel = PusherChannels.INCIDENT_TYPE_TRANSLATION_CHANGELOG_CHANNEL;
          break;
        default:
          return;
      }
      this.triggerMultipleEventsAChannel(
        channel,
        [changelog.change_logable_id.toString()],
        changelog,
      );
    }
  }

  public sendUpdatedComment(
    comment: FormattedComment,
    type: string,
    commentable_id: number,
    eventId?: number,
  ) {
    let channel;

    if (comment) {
      switch (type) {
        case CommentableTypes.EVENT:
          channel = PusherChannels.EVENT_COMMENTS_CHANNEL;
          this.triggerMultipleEventsAChannel(
            channel,
            [commentable_id.toString()],
            comment,
          );
          break;
        case CommentableTypes.USER:
          channel = `${PusherChannels.EVENTS_CHANNEL}-${eventId}`;
          this.triggerMultipleEventsAChannel(
            channel,
            [`${PusherEvents.EVENT_STAFF_COMMENTS_UPDATES}-${commentable_id}`],
            comment,
          );
          break;
        case CommentableTypes.TASK:
          channel = PusherChannels.TASK_COMMENTS_CHANNEL;
          this.triggerMultipleEventsAChannel(
            channel,
            [commentable_id.toString()],
            comment,
          );
          break;
        case CommentableTypes.USER_COMPANY_ROLE:
          channel = PusherChannels.USER_COMPANY_ROLE_COMMENTS_CHANNEL;
          this.triggerMultipleEventsAChannel(
            channel,
            [commentable_id.toString()],
            comment,
          );
          break;
        case CommentableTypes.INCIDENT:
          channel = PusherChannels.INCIDENT_COMMENTS_CHANNEL;
          this.triggerMultipleEventsAChannel(
            channel,
            [commentable_id.toString()],
            comment,
          );
          break;

        default:
          break;
      }
    }
  }

  public sendUpdatedAttachment(
    attachment: Image,
    type: PolymorphicType,
    id: number,
  ) {
    let channel: PusherChannels;
    switch (type) {
      case PolymorphicType.EVENT:
        channel = PusherChannels.EVENT_ATTACHMENT_CHANNEL;
        break;
      case PolymorphicType.TASK:
        channel = PusherChannels.TASK_ATTACHMENT_CHANNEL;
        break;
      case PolymorphicType.INCIDENT:
        channel = PusherChannels.INCIDENT_ATTACHMENT_CHANNEL;
        break;
      default:
        break;
    }
    if (!channel) return;

    this.triggerMultipleEventsAChannel(channel, [id.toString()], attachment);
  }

  public broadCastConversationMessages(
    eventId: number,
    userId: number,
    data: Message,
  ) {
    this.pusher.trigger(
      `${PusherChannels.EVENTS_CHANNEL}-${eventId}`,
      `${PusherEvents.EVENT_CONVERSATION_MESSAGE_UPDATES}-${userId}`,
      data,
    );
  }

  public broadcastSentMessages(eventId: number, userId: number, data: Message) {
    this.pusher.trigger(
      `${PusherChannels.EVENTS_CHANNEL}-${eventId}`,
      `${PusherEvents.EVENT_SENT_MESSAGES_UPDATES}-${userId}`,
      data,
    );
  }

  public broadcastStaffMembersMessages(
    eventId: number,
    userId: number,
    data: Message,
  ) {
    this.pusher.trigger(
      `${PusherChannels.EVENTS_CHANNEL}-${eventId}`,
      `${PusherEvents.EVENT_STAFF_MESSAGES_UPDATES}-${userId}`,
      data,
    );
  }

  public sendUpdateDepartment(
    department: Partial<Department>,
    event_id: number,
    department_id: number,
  ) {
    if (department)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [department_id.toString(), PusherEvents.DEPARTMENTS],
        department,
      );
  }

  public disassociateDepartmentFromEvent(department: any, event_id: number) {
    if (department)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.DISASSOCIATE_DEPARTMENTS],
        department,
      );
  }

  public assignDepartmentToEvents(
    message: string,
    event_id: number,
    departmentData?: any,
  ) {
    if (message) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.ASSOCIATE_DEPARTMENTS],
        message,
      );
    } else {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.ASSOCIATE_DEPARTMENTS],
        departmentData,
      );
    }
  }

  public disassociateDivisionFromEvent(
    incident_division_message: string,
    event_id: number,
    division_data?: any,
  ) {
    if (incident_division_message) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.DISASSOCIATE_INCIDENT_DIVISION],
        incident_division_message,
      );
    } else {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.DISASSOCIATE_INCIDENT_DIVISION],
        division_data,
      );
    }
  }

  public associateDivisionFromEvent(
    incident_division_message: string,
    event_id: number,
    incident_divisions: any,
  ) {
    if (incident_division_message) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.ASSOCIATE_INCIDENT_DIVISION],
        incident_division_message,
      );
    } else {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.ASSOCIATE_INCIDENT_DIVISION],
        incident_divisions,
      );
    }
  }

  public deleteEvent(event_id: number) {
    if (event_id)
      this.triggerMultipleEventsAChannel(
        PusherChannels.EVENTS_CHANNEL,
        [PusherEvents.DELETE_EVENT],
        event_id.toString(),
      );
  }

  public requestedEventCount(request_event_count: number) {
    this.triggerMultipleEventsAChannel(
      PusherChannels.EVENTS_CHANNEL,
      [PusherEvents.REQUESTED_EVENT_COUNT],
      request_event_count.toString(),
    );
  }

  public uploadCsvForUser(csv_upload_message: string, event_id: number) {
    if (csv_upload_message)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.USER_CHANNEL_UPLOAD_CSV],
        csv_upload_message,
      );
  }

  public sendUpdatedIncidentDivision(
    incident_division: IncidentDivision,
    event_id: number,
    incident_division_id: number,
  ) {
    if (incident_division)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [incident_division_id.toString(), PusherEvents.INCIDENT_DIVISION],
        incident_division,
      );
  }

  public assignStaffToDepartmentAndDivision(
    messgae: string,
    event_id: number,
    assign_department_and_division_data?: any,
  ) {
    if (messgae) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.ASSIGN_STAFF_TO_DEPARTMENT_AND_DIVISION],
        messgae,
      );
    } else {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}-${event_id}`,
        [PusherEvents.ASSIGN_STAFF_TO_DEPARTMENT_AND_DIVISION],
        assign_department_and_division_data,
      );
    }
  }

  public sendNewMessage(message: Message) {
    const { messageable_id, messageable_type, event_id } = message;
    if (message)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENT_MESSAGE_UPDATES}-${messageable_id}-${messageable_type}-${event_id}`,
        [PusherEvents.MESSAGE],
        message,
      );
  }

  public sendUpdatedTask(task: Task) {
    if (task)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.TASKS_CHANNEL}-${task.event_id}`,
        [PusherEvents.ALL, task.id.toString()],
        task,
      );
  }

  public sendUpdatedTaskCategory(
    taskCategory: TaskCategory,
    type: SocketTypesStatus,
  ) {
    if (taskCategory)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.TASKS_CATEGORY_CHANNEL}-${taskCategory.company_id}`,
        [PusherEvents.ALL, taskCategory.id.toString()],
        { ...taskCategory, type },
      );
  }

  public sendMultipleTasksUpdate(message: string, event_id: number) {
    if (message)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.TASKS_CHANNEL}-${event_id}`,
        [PusherEvents.MULTIPLE_TASKS],
        message,
      );
  }

  public sendUpdatedTaskList(taskList: TaskList) {
    if (taskList)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.TASK_LIST_CHANNEL}-${taskList.event_id}`,
        [PusherEvents.ALL, taskList.id.toString()],
        taskList,
      );
  }

  public sendUpdatedTaskCount(taskCounts: any, eventId: number) {
    if (taskCounts)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.TASKS_CHANNEL}-${eventId}`,
        [PusherEvents.TASK_CHANNEL_COUNTS],
        taskCounts,
      );
  }

  public sendEventMapPoint(event: Event) {
    if (event)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.DASHBOARD_CHANNEL}`,
        [PusherEvents.EVENT],
        event,
      );
  }

  public sendCompanyMapPoint(company: Company) {
    if (company)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.DASHBOARD_CHANNEL}`,
        [PusherEvents.COMPANY],
        company,
      );
  }

  public sendDashboardIncident(incident: Incident) {
    if (incident)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.DASHBOARD_CHANNEL}`,
        [PusherEvents.INCIDENT],
        incident,
      );
  }

  public sendPinnedEventIncidentUpdate(incident: Incident) {
    if (incident)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.DASHBOARD_CHANNEL}`,
        [PusherEvents.PINNED_EVENT_INCIDENT],
        incident,
      );
  }

  public sendResolvedIncidentNote(resolvedIncidentNote: ResolvedIncidentNote) {
    if (resolvedIncidentNote)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.INCIDENT_CHANNEL}`,
        [PusherEvents.RESOLVED_INCIDENT_NOTE],
        resolvedIncidentNote,
      );
  }

  public sendUpdatedIncidentType(
    incident_type: IncidentType,
    event_id: number,
    incident_type_id: number,
  ) {
    if (incident_type)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
        [incident_type_id.toString(), PusherEvents.INCIDENT_TYPE],
        incident_type,
      );
  }

  public sendDeletedIncidentType(
    incident_delete: DeleteIncidentType[],
    event_id: number,
  ) {
    if (incident_delete.length) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
        [`${PusherEvents.INCIDENT_TYPE}-'all'`],
        incident_delete,
      );
    }
  }

  public sendPinnedEventData(pinnedEventData: any) {
    if (pinnedEventData) {
      this.triggerMultipleEventsAChannel(
        PusherChannels.DASHBOARD_CHANNEL,
        [PusherEvents.PINNED_EVENT_DATA],
        pinnedEventData,
      );
    }
  }

  public sendSuccessMessage(message: string) {
    if (message)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.EVENTS_CHANNEL}`,
        [PusherEvents.ASSIGN_STAFF_TO_DEPARTMENT_AND_DIVISION],
        message,
      );
  }

  public sendAuditStaffUpdate(staff: AuditStaff, eventId: number) {
    if (staff) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
        [PusherEvents.AUDIT_STAFF_UPDATE],
        staff,
      );
    }
  }

  public sendMultipleAuditStaffUpdate(staff: AuditStaff[], eventId: number) {
    if (staff.length) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.AUDIT_CHANNEL}-v2-${eventId}`,
        [PusherEvents.AUDIT_STAFF_BULK_UPDATE],
        staff,
      );
    }
  }

  public sendAuditStaffUploadUpdate(message: string, eventId: number) {
    if (message) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
        [PusherEvents.AUDIT_STAFF_UPLOAD_CSV],
        message,
      );
    }
  }

  public sendStaffNoteUpdate(staffNotes: AuditNote[], eventId: number) {
    if (staffNotes) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
        [PusherEvents.AUDIT_STAFF_NOTES],
        staffNotes,
      );
    }
  }

  public sendAuditStaffData(staff: any, eventId: number) {
    if (staff) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
        [PusherEvents.AUDIT_STAFF_DATA],
        staff,
      );
    }
  }

  public sendMultipleAuditStaffData(staff: AuditStaff[], eventId: number) {
    if (staff.length) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.AUDIT_CHANNEL}-v2-${eventId}`,
        [PusherEvents.AUDIT_STAFF_BULK_DATA],
        staff,
      );
    }
  }

  public sendAuditStaffClearUpdate(
    message: string,
    eventId: number,
    deletedStaffIds: number[],
  ) {
    if (message) {
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
        [PusherEvents.AUDIT_STAFF_CLEAR],
        { message, deletedStaffIds },
      );
    }
  }

  public sendAuditStaffAssetsData(
    assetsSummary: TotalAssetsSummary[],
    eventId: number,
  ) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
      [PusherEvents.AUDIT_STAFF_ASSETS],
      assetsSummary,
    );
  }

  public sendModuleCountUpdate(eventAndCount: EventAndModuleCount) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.EVENTS_CHANNEL}`,
      [PusherEvents.MODULE_COUNT],
      eventAndCount,
    );
  }

  public sendAuditStaffUpdateByDates(staff: any, eventId: number) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
      [PusherEvents.AUDIT_STAFF_DATA_BY_DATE],
      staff,
    );
  }

  public updateUserStatus(user_id: number, status: string) {
    if (status)
      this.triggerMultipleEventsAChannel(
        `${PusherChannels.USER_STATUS}-${user_id}`,
        [PusherEvents.USER_STATUS_UPDATE],
        status,
      );
  }

  public sendAuditStaffOrderVsDeliverStats(data: any, eventId: number) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.AUDIT_CHANNEL}-${eventId}`,
      [PusherEvents.AUDIT_STAFF_ORDER_DELIVER],
      data,
    );
  }

  public sendLiveVideoUpdate(data: any, eventId: number) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.LIVE_VIDEO_CHANNEL}-${eventId}`,
      [PusherEvents.LIVE_VIDEO_UPDATE],
      data,
    );
  }

  public sendDataUpdates(channel: string, events: string[], data: any) {
    this.triggerMultipleEventsAChannel(channel, events, data);
  }

  public sendNotification(
    eventId: number,
    userId: number,
    data: { code: string | number; message: string },
  ) {
    const channel = eventId
      ? `private-notification-${eventId}-user-${userId}`
      : `private-notification-user-${userId}`;
    this.pusher.trigger(channel, `message`, data);
  }

  public sendWeatherProviderUpdate(data: any) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.WEATHER_CHANNEL}`,
      [PusherEvents.WEATHER_PROVIDER_UPDATE],
      data,
    );
  }

  public sendCompanyWeatherProviderUpdate(
    data: any,
    weather_provider_id: number,
  ) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.WEATHER_CHANNEL}-${weather_provider_id}`,
      [PusherEvents.COMPANY_WEATHER_PROVIDER_UPDATE],
      data,
    );
  }

  public async getChannelListWithPrefix(channelPrefix: string) {
    const result = await this.pusher.get({
      path: '/channels',
      params: {
        filter_by_prefix: channelPrefix,
      },
    });

    const channels = Object.keys((await result.json()).channels);

    return channels;
  }

  public sendCadUpdate(cad: Cad, eventId: number, cadId: number) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.CAD_CHANNEL}-${eventId}`,
      [cadId, PusherEvents.CAD],
      cad,
    );
  }

  public sendCadTypeUpdate(cadType: CadType, companyId: number) {
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.CAD_TYPE_CHANNEL}-${companyId}`,
      [PusherEvents.CAD_TYPE],
      cadType,
    );
  }

  public sendNotificationSocket(notificationSocketData: NotificationSocket) {
    const { company_id, user_id } = notificationSocketData;
    this.triggerMultipleEventsAChannel(
      `${PusherChannels.NOTFICATION_CHANNEL}-${company_id}-user-${user_id}`,
      [PusherEvents.NOTIFICATION],
      {
        ...notificationSocketData,
      },
    );
  }
}
