import { CloneDto } from '@Common/dto';

export const cloneIncidentMessageInbox = {
  type: CloneDto,
  examples: {
    Example: {
      value: {
        current_event_id: 1234,
        clone_event_id: 3212,
      },
    },
  },
};
