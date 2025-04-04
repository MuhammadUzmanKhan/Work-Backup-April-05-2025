import { PusherService } from '@ontrack-tech-group/common/services';
import { MobileIncidentInbox } from '@ontrack-tech-group/common/models';
import {
  Options,
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';

/**
 *
 * @param id
 * Return the obect same as Get Mobibile Incident Inbox on create and update
 */
export const getMobileIncidentInbox = async (id: number, options?: Options) => {
  return await MobileIncidentInbox.findByPk(id, {
    attributes: {
      exclude: ['updatedAt'],
      include: [[MobileIncidentInbox.getStatusNameByKey, 'visible_status']],
    },
    ...options,
  });
};

export function sendUpdatedMobileIncidentInbox(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_MOBILE_INBOX],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}
