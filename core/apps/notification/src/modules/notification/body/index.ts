import { NotificationType } from '@ontrack-tech-group/common/constants';
import { CreateNotificationsDto } from '../dto';

export const CreateNotification = {
  type: CreateNotificationsDto,
  examples: {
    Example: {
      value: {
        message: 'Some Notification to Show',
        message_html:
          'Some Notification <strong>with highlight </strong> to Show',
        module: 'Task',
        module_id: 4076,
        company_id: 1,
        type: NotificationType.TASK_ASSIGNED,
      },
    },
  },
};
