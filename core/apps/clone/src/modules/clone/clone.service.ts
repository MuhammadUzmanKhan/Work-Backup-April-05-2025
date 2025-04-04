import { Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable } from '@nestjs/common';
import {
  CameraZone,
  EventDepartment,
  EventIncidentDivision,
  EventIncidentType,
  EventSource,
  EventUser,
  IncidentZone,
  ReferenceMap,
  User,
} from '@ontrack-tech-group/common/models';
import {
  AlertableType,
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import {
  IncidentService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { throwCatchError } from '@ontrack-tech-group/common/helpers';
import { CloneAlertsDto, CloneDto } from '@Modules/clone/dto';
import {
  cloneAlerts,
  cloneData,
  cloneSubZones,
  cloneSubZonesWo,
  withGenericTransaction,
} from '@Modules/clone/helper';
import EventConstants from '@Common/helpers/contants';
import {
  cloneIncidentMessagingCenterHelper,
  cloneMobileIncidentInboxesHelper,
  clonePresetMessagingHelper,
} from '@Common/helpers/cloningMethods';

@Injectable()
export class CloneService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly incidentService: IncidentService,
    private readonly pusherService: PusherService,
  ) {}

  async cloneAlert(user: User, clone_alert: CloneAlertsDto) {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      const response = await cloneAlerts(
        user,
        clone_alert,
        this.incidentService,
        transaction,
      );

      await transaction.commit();

      this.sendUpdated(
        {
          message: 'Alerts Cloned Successfully',
          incidentTypePriorityGuideCount:
            response.incidentTypePriorityGuideCount,
        },
        clone_alert.current_event_id,
        'clone',
        EventConstants.SocketTypes.ALERT,
        true,
      );

      return response;
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }
  }

  async cloneIncidentSources(user: User, clone_alert: CloneDto) {
    const response = await withGenericTransaction(
      clone_alert,
      user,
      EventSource,
      this.sequelize,
    );

    this.sendUpdated(
      { message: 'Event Sources Cloned Successfully', count: response.counts },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.SOURCE,
      true,
    );

    return response;
  }

  async cloneIncidentTypes(user: User, clone_alert: CloneDto) {
    const response = await withGenericTransaction(
      clone_alert,
      user,
      EventIncidentType,
      this.sequelize,
    );

    this.sendUpdated(
      {
        message: 'Incident Divisions Cloned Successfully',
        count: response.counts,
      },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.INCIDENT_TYPE,
      true,
    );

    return response;
  }

  async cloneIncidentZones(user: User, clone_alert: CloneDto) {
    const response = await withGenericTransaction(
      clone_alert,
      user,
      IncidentZone,
      this.sequelize,
      true,
    );

    this.sendUpdated(
      { message: `Incident Zones cloned`, count: response.counts },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.INCIDENT_ZONE,
      true,
    );

    return response;
  }

  async cloneIncidentSubZones(user: User, clone_alert: CloneDto) {
    const response = await cloneSubZones(clone_alert, user, this.sequelize);

    this.sendUpdated(
      { message: `Incident Sub Zones cloned`, count: response.counts },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.INCIDENT_ZONE,
      true,
    );

    return response;
  }

  async cloneCameraZone(user: User, clone_alert: CloneDto) {
    const response = await withGenericTransaction(
      clone_alert,
      user,
      CameraZone,
      this.sequelize,
    );

    this.sendUpdated(
      { message: `Incident Sub Zones cloned`, count: response.counts },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.INCIDENT_ZONE,
      true,
    );

    return response;
  }

  async cloneReferenceMap(user: User, clone_alert: CloneDto) {
    const response = await withGenericTransaction(
      clone_alert,
      user,
      ReferenceMap,
      this.sequelize,
      false,
      true,
    );

    this.sendUpdated(
      { message: 'Reference Map Cloned Successfully' },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.REFRENCE_MAP,
      true,
    );

    return response;
  }

  async cloneWorkforceDepartments(user: User, clone_alert: CloneDto) {
    await withGenericTransaction(clone_alert, user, EventUser, this.sequelize);

    const response = await withGenericTransaction(
      clone_alert,
      user,
      EventDepartment,
      this.sequelize,
    );

    this.sendUpdated(
      { message: 'Departments Cloned Successfully' },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.DEPARTMENT,
      true,
    );

    return response;
  }

  async cloneWorkforceDivisions(user: User, clone_alert: CloneDto) {
    const response = await withGenericTransaction(
      clone_alert,
      user,
      EventIncidentDivision,
      this.sequelize,
    );

    this.sendUpdated(
      { message: 'User Divisions Cloned Successfully' },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.DIVISIONS,
      true,
    );

    return response;
  }

  async cloneIncidentMessagingCenter(user: User, clone_alert: CloneDto) {
    const response = await cloneIncidentMessagingCenterHelper(
      user,
      clone_alert,
    );

    this.sendUpdated(
      { message: 'Event Incident Messages Cloned Successfully' },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.INCIDENT_MESSAGE_CENTER,
      true,
    );

    return response;
  }

  async clonePresetMessaging(user: User, clone_alert: CloneDto) {
    const response = await clonePresetMessagingHelper(user, clone_alert);

    this.sendUpdated(
      {
        message: 'Preset Message Cloned Successfully',
        createdCount: response.createdCount,
      },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.INCIDENT_PRESET_MESSAGING,
      true,
    );

    return response;
  }

  async cloneMobileIncidentInboxes(user: User, clone_alert: CloneDto) {
    const response = await cloneMobileIncidentInboxesHelper(user, clone_alert);
    this.sendUpdated(
      {
        message: 'Mobile Incident Inbox Cloned Successfully',
        createdCount: response.createdCount,
      },
      clone_alert.current_event_id,
      'clone',
      EventConstants.SocketTypes.INCIDENT_MOBILE_INBOX,
      true,
    );

    return { message: 'Mobile Incident Inbox Cloned Successfully' };
  }

  async cloneIncidentModuleSetup(user: User, clone_alert: CloneDto) {
    const transaction: Transaction = await this.sequelize.transaction();
    try {
      // Alerts By Incident Types
      await cloneAlerts(
        user,
        {
          ...clone_alert,
          alertable_type: AlertableType.INCIDENT_TYPE,
        },
        this.incidentService,
        transaction,
      );
      // Alerts By Priority Guides
      await cloneAlerts(
        user,
        {
          ...clone_alert,
          alertable_type: AlertableType.PRIORITY_GUIDE,
        },
        this.incidentService,
        transaction,
      );
      await cloneData(clone_alert, user, EventSource, transaction);
      await cloneData(clone_alert, user, EventIncidentType, transaction);
      await cloneData(clone_alert, user, IncidentZone, transaction, true);
      await cloneData(clone_alert, user, CameraZone, transaction);
      await cloneData(
        clone_alert,
        user,
        ReferenceMap,
        transaction,
        false,
        true,
      );
      await cloneData(clone_alert, user, EventUser, transaction);
      await cloneData(clone_alert, user, EventDepartment, transaction);
      await cloneData(clone_alert, user, EventIncidentDivision, transaction);
      await cloneData(clone_alert, user, EventIncidentDivision, transaction);
      await cloneSubZonesWo(clone_alert, user, transaction);
      await clonePresetMessagingHelper(user, clone_alert);
      await cloneIncidentMessagingCenterHelper(user, clone_alert);
      await cloneMobileIncidentInboxesHelper(user, clone_alert);
      await transaction.commit();
      return {
        message: 'Cloned Entire Incident Module',
      };
    } catch (e) {
      await transaction.rollback();
      throwCatchError(e);
    }
  }

  private async sendUpdated(
    data: any,
    event_id: number,
    status: string,
    type: string,
    newEntry: boolean,
  ) {
    this.pusherService.sendDataUpdates(
      `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
      [PusherEvents.INCIDENT_SETUP],
      {
        ...data,
        status,
        type,
        newEntry,
      },
    );
  }
}
