import { Task, Event } from '@ontrack-tech-group/common/models';
import { getDateOrTimeInTimeZone } from '@ontrack-tech-group/common/helpers';

export const assignTaskMessage = (
  task: Task,
  parentTaskName: string,
  event: Event,
) => {
  const { date, time } = getDateOrTimeInTimeZone(
    task.createdAt,
    event.time_zone,
  );

  return `
NEW ${task.parent_id ? 'SUB TASK' : 'TASK'} ASSIGNED
${date} - ${time}

${task.parent_id ? 'Sub Task' : 'Task'} Name: ${task.name}${task.parent_id ? `\nMain Task Name: ${parentTaskName}` : ''}
Task List: ${task['list_name'] || 'Private List'}
Event: ${event.name}
Status: ${task.status}
Map Location: ${task.location ? `https://maps.google.com/?q=${task.location?.latitude || ''},${task.location?.longitude || ''}` : 'N/A'}
Task Detail: https://ontrack.co/task-details?event_id=${event.id}&task_id=${task.id}
`;
};
