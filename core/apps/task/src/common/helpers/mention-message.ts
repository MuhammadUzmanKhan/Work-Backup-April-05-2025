import { Task, Event, User } from '@ontrack-tech-group/common/models';
import { getDateOrTimeInTimeZone } from '@ontrack-tech-group/common/helpers';

export const mentionTaskMessage = (task: Task, event: Event, user: User) => {
  const { date, time } = getDateOrTimeInTimeZone(
    task.createdAt,
    event.time_zone,
  );

  return `
Message: ${user.name} mentioned you in a Task Comment.
${date} - ${time}

Task Name: ${task.name}
Task List: ${task['list_name'] || 'Private List'}
Event: ${event.name}
Status: ${task.status}
Map Location: ${task.location ? `https://maps.google.com/?q=${task.location?.latitude || ''},${task.location?.longitude || ''}` : 'N/A'}
Task Detail: https://ontrack.co/task-details?event_id=${event.id}&task_id=${task.id}
`;
};
