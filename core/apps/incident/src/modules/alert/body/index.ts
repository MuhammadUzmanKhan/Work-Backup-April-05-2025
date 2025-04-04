import { AlertableType } from '@ontrack-tech-group/common/constants';
import { CloneAlertsDto } from '../dto';

export const cloneAlertBody = {
  type: CloneAlertsDto,
  examples: {
    example: {
      value: {
        clone_event_id: 1,
        current_event_id: 1,
        alertable_type: AlertableType.INCIDENT_TYPE,
      },
    },
  },
};
