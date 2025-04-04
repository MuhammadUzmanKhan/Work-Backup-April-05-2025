import { PusherService } from '@ontrack-tech-group/common/services';
import { Task } from '@ontrack-tech-group/common/models';
import {
  PusherChannels,
  PusherEvents,
  SocketTypesStatus,
} from '@ontrack-tech-group/common/constants';
import {
  getUserIdsFromUserSpecificChannel,
  getUsersData,
  sendBatchesWithDelay,
} from '@ontrack-tech-group/common/helpers';
import { TaskStatus } from '@Common/constants';
import { getUserIdsFollowingDivisionLockChecksForTask } from './division-lock';

export const sendTaskUpdate = async (
  task: Task,
  isNew: boolean,
  type: SocketTypesStatus,
  pusherService: PusherService,
) => {
  // Extract task data and remove subtask-related details
  const taskData = (task.get && task.get({ plain: true })) || task;
  const { subtasks, subtask_assignees, subtaskCount, ...filteredTaskData } =
    taskData;

  let totalSubtasks = 0;
  let completedSubtasks = 0;
  const taskId = task.parent_id
    ? task.parent_id.toString()
    : task.id.toString();

  // Only calculate subtask counts if this is a main task (i.e., it does not have a parent_id)
  if (!taskData.parent_id && Array.isArray(taskData.subtasks)) {
    totalSubtasks = taskData.subtasks.length;
    completedSubtasks = taskData.subtasks.filter(
      (subtask) => subtask.status === TaskStatus.COMPLETED,
    ).length;
  }

  // Prepare the socket data with explicit subtask count properties
  const socketData = {
    ...filteredTaskData,
    isNew,
    type,
    subtaskCount: totalSubtasks,
    completedSubtaskCount: completedSubtasks,
  };

  const event_id = task.event_id;

  // Check if this is a standalone/private task
  if (task.task_list_id === null) {
    // Only send data to the task creator's channel
    if (task.created_by) {
      try {
        await pusherService.sendDataUpdates(
          `${PusherChannels.PRESENCE_TASKS_CHANNEL_V1}-${event_id}-user-${task.created_by}`,
          [PusherEvents.TASK, taskId],
          socketData,
        );
      } catch (err) {
        console.log(err);
      }
    }
  } else {
    const divisionLockService = taskData['is_division_locked'];

    if (divisionLockService) {
      // Fetch user channels based on event_id
      const channels = await pusherService.getChannelListWithPrefix(
        `${PusherChannels.PRESENCE_TASKS_CHANNEL_V1}-${event_id}-user`,
      );
      const userIds = getUserIdsFromUserSpecificChannel(channels);

      // Fetch user data for division lock checks
      const usersData = await getUsersData(userIds, task.event.company_id);

      // Get user IDs to send the task update or to remove the task
      const { userIdsToSend, userIdsToRemoveTask } =
        getUserIdsFollowingDivisionLockChecksForTask(usersData, task);

      // Create channel lists for users to send task data and to remove task data
      const channelsToSendTask = userIdsToSend.map(
        (userId) =>
          `${PusherChannels.PRESENCE_TASKS_CHANNEL_V1}-${event_id}-user-${userId}`,
      );

      const channelsToRemoveTask = userIdsToRemoveTask.map(
        (userId) =>
          `${PusherChannels.PRESENCE_TASKS_CHANNEL_V1}-${event_id}-user-${userId}`,
      );

      // Send task data to users
      sendBatchesWithDelay(
        pusherService.pusher,
        channelsToSendTask,
        [PusherEvents.TASK, taskId],
        socketData,
      );

      // Send removal notification for restricted users
      sendBatchesWithDelay(
        pusherService.pusher,
        channelsToRemoveTask,
        [PusherEvents.TASK, taskId],
        {
          ...(task && { id: task.id }),
          isHidden: true,
        },
      );
    } else {
      // Send updates to a general channel if division lock checks are not required
      try {
        pusherService.sendDataUpdates(
          `${PusherChannels.TASKS_CHANNEL_V1}-${event_id}`,
          [PusherEvents.TASK, taskId],
          socketData,
        );
      } catch (err) {
        console.log(err);
      }
    }
  }
};
