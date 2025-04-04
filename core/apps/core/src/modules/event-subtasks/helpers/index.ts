import {
  formatDate,
  throwCatchError,
} from '@ontrack-tech-group/common/helpers';
import { NotificationData } from '@Common/constants';

export const scheduleNotification = async (schedulerData: NotificationData) => {
  const {
    event_id,
    company_id,
    event,
    module,
    type,
    subject,
    message,
    message_html,
    queueService,
  } = schedulerData;

  const startDate = formatDate(event.public_start_date);
  const endDate = formatDate(event.public_end_date);

  const eventDates = `${startDate} - ${endDate}`;

  try {
    const messageBody = `
            Message: ${message}.
            ${eventDates}
            Event Name: ${event.name}
            Company: ${event['company_name']},
            `;

    const emailBody = {
      message,
      name: event.name,
      company: event['company_name'],
      eventDates,
    };

    const notificationData = {
      messageBody,
      emailBody,
      subject,
      event_id,
      company_id,
      type,
      module,
      message,
      message_html,
    };

    queueService.sendEventPlanNotification(notificationData);
  } catch (err) {
    console.log('🚀 ~ err:', err);
    throwCatchError(err);
  }
};
