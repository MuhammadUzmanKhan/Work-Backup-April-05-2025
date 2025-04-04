import { Sequelize } from 'sequelize-typescript';
import { NotFoundException } from '@nestjs/common';
import {
  Chat,
  Company,
  Event,
  Incident,
  LegalGroup,
  User,
  UserCompanyRole,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  PusherChannels,
  PusherEvents,
  ERRORS,
  IncidentDashboardStats,
} from '@ontrack-tech-group/common/constants';
import {
  getArrayInChunks,
  getUserIdsFromUserSpecificChannel,
  extractUserIdAndCompanyIdFromChannel,
  getUsersData,
  sendBatchesWithDelay,
  sendBatchesWithDelayWithIndivisualMessages,
  withTryCatch,
} from '@ontrack-tech-group/common/helpers';
import {
  getIncidentDivisionsWithResolvedTimeForSockets,
  getIncidentMultipleDivisionsNotAvailable,
} from '@Modules/incident-division/helpers';
import {
  getIncidentNoZonesAvailable,
  getIncidentZoneById,
} from '@Modules/incident-zone/helpers';
import { getIncidentTypeByIdHelper } from '@Modules/incident-type/helpers';

import { getUserLastCall, incidentLinkUnlinkSocketData } from './queries';
import { getUserIdsFollowingDivisionLockChecks } from './division-lock';
import { LegalCountsInterface } from './interfaces';

import { getDispatchLogForUser } from '.';

export const sendDispatchLogUpdate = async (
  incidentId: number,
  userIds: number[],
  eventId: number,
  pusherService: PusherService,
  isNew: boolean,
  isUnlink = false,
  dispatchLogs?: Incident | null,
): Promise<void> => {
  if (!dispatchLogs) {
    dispatchLogs = (
      await getDispatchLogForUser(incidentId, userIds, eventId)
    )?.get({ plain: true });
  }

  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
    [`${PusherEvents.INCIDENT_DISPATCH_LOGS}-${incidentId}`],
    {
      ...dispatchLogs,
      isNew,
      isUnlink,
    },
  );
};

export const sendLinkedIncidentUpdate = async (
  linkIncidentIds: number[],
  incidentId: number,
  eventId: number,
  pusherService: PusherService,
  user: User,
  type: string,
): Promise<void> => {
  const incidents = await incidentLinkUnlinkSocketData(
    incidentId,
    linkIncidentIds,
    user,
  );

  const incidentChunks = getArrayInChunks(incidents, 3); // dividing incident list in chunk of 3 because of too much data

  for (const incidents of incidentChunks) {
    const socketData = {
      incidents,
      incidentId,
      type,
    };

    pusherService.sendDataUpdates(
      `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
      [`${PusherEvents.INCIDENT_LINKED}-${incidentId}`],
      { incidents },
    );

    pusherService.sendDataUpdates(
      `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
      [PusherEvents.LINK_UNLINK_INCIDENTS],
      socketData,
    );
  }
};

export const sendIncidentsDashboardOverviewUpdate = async (
  event_id: number,
  pusherService: PusherService,
  // DATA IS DYNAMIC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  incidentHourlyStats: {
    counts: {
      incidentCounts: number;
    };
    data: IncidentDashboardStats;
  },
): Promise<void> => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_DASHBOARD_OVERVIEW],
    incidentHourlyStats,
  );
};

export const sendDashboardListingsUpdates = async (
  incidentTypeId: number,
  incidentZoneId: number,
  incidentDivisionIds: number[],
  eventId: number,
  companyId: number,
  pusherService: PusherService,
  sequelize: Sequelize,
  prevIncidentTypeId?: number,
  prevIncidentZoneId?: number,
  prevIncidentDivisionIds?: number[],
): Promise<void> => {
  const incidentTypes = [];
  const incidentZones = [];
  const incidentDivisions = [];
  const _incidentDivisionIds = [];

  if (incidentTypeId) {
    incidentTypes.push(
      await getIncidentTypeByIdHelper(
        incidentTypeId,
        eventId,
        companyId,
        sequelize,
      ),
    );
  }

  if (prevIncidentTypeId && prevIncidentTypeId != incidentTypeId) {
    incidentTypes.push(
      await getIncidentTypeByIdHelper(
        prevIncidentTypeId,
        eventId,
        companyId,
        sequelize,
      ),
    );
  }

  if (incidentZoneId) {
    incidentZones.push(
      await getIncidentZoneById(incidentZoneId, eventId, sequelize),
    );
  } else {
    const noZone = await getIncidentNoZonesAvailable(
      companyId,
      eventId,
      sequelize,
    );
    incidentZones.push(noZone);
  }

  if (prevIncidentZoneId && prevIncidentZoneId != incidentZoneId) {
    incidentZones.push(
      await getIncidentZoneById(prevIncidentZoneId, eventId, sequelize),
    );
  } else {
    const noZone = await getIncidentNoZonesAvailable(
      companyId,
      eventId,
      sequelize,
    );
    incidentZones.push(noZone);
  }

  if (incidentDivisionIds && incidentDivisionIds.length) {
    _incidentDivisionIds.push(...incidentDivisionIds);
  } else {
    const noDivision = await getIncidentMultipleDivisionsNotAvailable(
      companyId,
      eventId,
      sequelize,
    );
    incidentDivisions.push(noDivision);
  }

  if (prevIncidentDivisionIds?.length) {
    _incidentDivisionIds.push(...prevIncidentDivisionIds);
  } else {
    const noDivision = await getIncidentMultipleDivisionsNotAvailable(
      companyId,
      eventId,
      sequelize,
    );
    incidentDivisions.push(noDivision);
  }

  if (_incidentDivisionIds.length) {
    const _incidentDivisions =
      await getIncidentDivisionsWithResolvedTimeForSockets(
        _incidentDivisionIds,
        eventId,
        sequelize,
      );
    incidentDivisions.push(..._incidentDivisions);
  }
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
    [PusherEvents.INCIDENT_DASHBOARD_LISTS],
    { incidentTypes, incidentZones, incidentDivisions },
  );
};

export const sendIncidentsCountUpdate = async (
  event_id: number,
  pusherService: PusherService,
): Promise<void> => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_COUNT],
    {},
    // await getIncidentCountsHelper(event_id),
  );
};

export const sendIncidentUpdateForUpload = (
  event_id: number,
  pusherService: PusherService,
): void => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT],
    { isNew: true, isUpload: true },
  );
};

export const sendIncidentUpdate = async (
  incident: Incident,
  event_id: number,
  isNew: boolean,
  pusherService: PusherService,
  isUpload = false,
  divisionLockService = false,
): Promise<void> => {
  const socketData = {
    ...(incident && incident.get({ plain: true })),
    isNew,
    isUpload,
  };

  const channels = await pusherService.getChannelListWithPrefix(
    `${PusherChannels.PRESENCE_INCIDENT_LISTING}-${event_id}-user`,
  );

  const userIds = getUserIdsFromUserSpecificChannel(channels);

  const usersData = await getUsersData(
    userIds,
    incident.company_id,
    incident.id,
  );

  const userIdsHaveUnreadComments: number[] = [];

  const channelWithUnreadComments: string[] = [];
  const channelWithoutUnreadComments: string[] = [];

  usersData.map((user) => {
    if (user.has_unread_comments) {
      userIdsHaveUnreadComments.push(user.id);
      if (!divisionLockService)
        channelWithUnreadComments.push(
          `${PusherChannels.PRESENCE_INCIDENT_LISTING}-${event_id}-user-${user.id}`,
        );
    } else if (!divisionLockService)
      channelWithoutUnreadComments.push(
        `${PusherChannels.PRESENCE_INCIDENT_LISTING}-${event_id}-user-${user.id}`,
      );
  });

  if (divisionLockService) {
    // get two lists of userIds with edit access and without edit access of incident by those users
    const {
      userIdsToSendWithEdit,
      userIdsToSendWithoutEdit,
      userIdsToRemoveIncident,
    } = getUserIdsFollowingDivisionLockChecks(usersData, incident);

    // create list of channels for those users who have edit access of incident
    const channelWithEditAccess = userIdsToSendWithEdit.map((userId) => ({
      channel: `${PusherChannels.PRESENCE_INCIDENT_LISTING}-${event_id}-user-${userId}`,
      data: {
        ...socketData,
        hasEditAccess: true,
        has_unread_comments: userIdsHaveUnreadComments.includes(userId),
      },
    }));

    // create list of channels for those users who don't have edit access of incident
    const channelWithoutEditAccess = userIdsToSendWithoutEdit.map((userId) => ({
      channel: `${PusherChannels.PRESENCE_INCIDENT_LISTING}-${event_id}-user-${userId}`,
      data: {
        ...socketData,
        hasEditAccess: false,
        has_unread_comments: userIdsHaveUnreadComments.includes(userId),
      },
    }));

    // create list of channels for those users who don't have access to the incident
    const channelToRemoveIncident = userIdsToRemoveIncident.map((userId) => ({
      channel: `${PusherChannels.PRESENCE_INCIDENT_LISTING}-${event_id}-user-${userId}`,
      data: {
        ...(incident && { id: incident.id }),
        isHidden: true,
        has_unread_comments: userIdsHaveUnreadComments.includes(userId),
      },
    }));

    // sending incident data with edit access.

    sendBatchesWithDelayWithIndivisualMessages(
      pusherService.pusher,
      channelWithEditAccess,
      [PusherEvents.INCIDENT],
    );

    // sending incident data without edit access.
    sendBatchesWithDelayWithIndivisualMessages(
      pusherService.pusher,
      channelWithoutEditAccess,
      [PusherEvents.INCIDENT],
    );

    // sending incident id to remove incident from these users.
    sendBatchesWithDelayWithIndivisualMessages(
      pusherService.pusher,
      channelToRemoveIncident,
      [PusherEvents.INCIDENT],
    );
  } else {
    sendBatchesWithDelay(
      pusherService.pusher,
      channelWithUnreadComments,
      [PusherEvents.INCIDENT],
      {
        ...socketData,
        has_unread_comments: true,
      },
    );

    sendBatchesWithDelay(
      pusherService.pusher,
      channelWithoutUnreadComments,
      [PusherEvents.INCIDENT],
      {
        ...socketData,
        has_unread_comments: false,
      },
    );
  }

  sendIncidentsCountUpdate(event_id, pusherService);
};

const checkValidUserAssociationWithCompany = async (
  userId: number,
  companyId: number,
): Promise<{ isSuperAdmin: boolean; isValidUser: boolean }> => {
  const _where =
    companyId === 0
      ? { user_id: userId, role_id: 0 }
      : { user_id: userId, company_id: companyId };

  const userRole = await UserCompanyRole.findOne({
    where: _where,
    attributes: ['role_id'],
  });

  return {
    isSuperAdmin: userRole?.role_id === 0,
    isValidUser: !!userRole,
  };
};

const getCompanyHierarchy = async (companyId: number): Promise<number[]> => {
  const company = await Company.findByPk(companyId, {
    include: [{ model: Company, as: 'subCompanies' }],
  });

  const companyAndSubcompanyIds = [
    companyId,
    ...(company?.subCompanies?.map((sub) => sub.id) || []),
  ];

  return companyAndSubcompanyIds;
};

// update the incident against company_id
export const sendIncidentLegalUpdate = async (
  incident: Incident,
  isNew: boolean,
  pusherService: PusherService,
  legalCount?: LegalCountsInterface,
  legalFlag?: boolean,
): Promise<void> => {
  const socketData = {
    ...(incident && incident.get({ plain: true })),
    isNew,
    legalFlag,
  };

  // Fetch all channels with the specified prefix
  const channelPrefix = `${PusherChannels.PRESENCE_INCIDENT_LEGAL}-company-`;
  const channels = await pusherService.getChannelListWithPrefix(channelPrefix);

  for (const channel of channels) {
    const { userId, companyId } = extractUserIdAndCompanyIdFromChannel(channel);

    // Validate user role in the company
    const { isSuperAdmin, isValidUser } =
      await checkValidUserAssociationWithCompany(userId, companyId);

    if (!isValidUser) continue;

    const baseChannel = `${PusherChannels.PRESENCE_INCIDENT_LEGAL}-company-${isSuperAdmin ? '0' : companyId}-user-${userId}`;

    const dataToSend = {
      incident: socketData,
      ...(legalCount && { legalCount }),
    };

    if (isSuperAdmin) {
      pusherService.sendDataUpdates(
        baseChannel,
        [PusherEvents.INCIDENT_LEGAL],
        dataToSend,
      );
      continue;
    }

    const companyAndSubcompanyIds = await getCompanyHierarchy(companyId);

    // Check if the update should be sent
    if (companyAndSubcompanyIds.includes(incident.company_id)) {
      pusherService.sendDataUpdates(
        baseChannel,
        [PusherEvents.INCIDENT_LEGAL],
        dataToSend,
      );
    }
  }
};

export const sendLegalChatUpdate = async (
  chat: Chat,
  incident_id: number,
  pusherService: PusherService,
): Promise<void> => {
  const socketData = {
    ...(chat && chat.get({ plain: true })),
  };

  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${incident_id}`,
    [PusherEvents.INCIDENT_LEGAL_CHAT],
    socketData,
  );
};

export const sendLegalChatCount = async (
  legalLogCount: number,
  incident_id: number,
  pusherService: PusherService,
): Promise<void> => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${incident_id}`,
    [PusherEvents.INCIDENT_LEGAL_CHAT_COUNT],
    legalLogCount,
  );
};

export const sendLegalGroupStatusUpdate = async (
  legalGroup: LegalGroup,
  incident_id: number,
  pusherService: PusherService,
): Promise<void> => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${incident_id}`,
    [PusherEvents.INCIDENT_LEGAL_GROUP],
    legalGroup,
  );
};

export const sendDispatchedStaffData = async (
  userIds: number[],
  eventId: number,
  pusherService: PusherService,
): Promise<void> => {
  const usersDispatchLogs = await getUserLastCall(userIds, eventId);

  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${eventId}`,
    [`${PusherEvents.INCIDENT_DISPATCH_LOGS}`],
    usersDispatchLogs,
  );
};

export const sendIncidentCountUpdate = async (
  event_id: number,
  pusherService: PusherService,
): Promise<void> => {
  withTryCatch(async () => {
    const event: Event | null = await Event.findByPk(event_id, {
      attributes: [[Event.getStatusNameByKey, 'status']],
    });

    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    pusherService.sendModuleCountUpdate({
      event_id,
      module: 'incident_future',
      status: event['status'] as unknown as string,
    });
  }, 'sendIncidentCountUpdate');
};

export const sendIncidentLegalCount = async (
  legalCount: LegalCountsInterface,
  company_id: number,
  pusherService: PusherService,
  type: string,
  newEntry: boolean,
): Promise<void> => {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${company_id}`,
    [PusherEvents.INCIDENT_LEGAL_COUNT],
    {
      ...legalCount,
      type,
      newEntry,
    },
  );
};
