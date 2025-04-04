import { Task, Event } from '@ontrack-tech-group/common/models';

export const assignTaskEmail = (
  task: Task,
  parentTaskName: string,
  event: Event,
  comment?: boolean,
) => {
  return {
    taskName: comment
      ? `${task.name}`
      : `${task.parent_id ? 'Sub Task' : 'Task'} ${task.name}${task.parent_id ? `Main Task Name: ${parentTaskName}` : ''}`,
    taskList: task['list_name'] || 'Private List',
    Event: event.name,
    Status: task.status,
    mapLocation: task.location
      ? `https://maps.google.com/?q=${task.location.latitude || ''},${task.location.longitude || ''}`
      : 'N/A',
  };
};
