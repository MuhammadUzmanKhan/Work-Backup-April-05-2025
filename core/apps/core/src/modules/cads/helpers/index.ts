import {
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';

export const cadDeleteSocket = async (
  id: number,
  eventId: number,
  pusherService: PusherService,
  type: string,
  message: string,
): Promise<void> => {
  pusherService.sendDataUpdates(
    `${PusherChannels.CAD_CHANNEL}-${eventId}`,
    [PusherEvents.CAD],
    {
      id,
      message,
      type,
    },
  );
};
