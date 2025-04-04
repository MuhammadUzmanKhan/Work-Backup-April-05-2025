import { Task, User } from '@ontrack-tech-group/common/models';
import { notUpperRole } from '@ontrack-tech-group/common/constants';

export const getUserIdsFollowingDivisionLockChecksForTask = (
  usersData: User[],
  task: Task,
): {
  userIdsToSend: number[];
  userIdsToRemoveTask: number[];
} => {
  const userIdsToSend = [];
  const userIdsToRemoveTask = [];

  for (const user of usersData) {
    if (notUpperRole(user['role'])) {
      // Check if task list is not division locked, or user is the creator
      const isTaskListUnlocked = !task['is_division_locked'];

      const isCreatedByUser = task.task_list?.created_by === user.id;

      const isUserInIncidentDivision =
        task.incident_division_id &&
        (user.incident_divisions as unknown as number[]).includes(
          task.incident_division_id,
        );

      const isSubtaskAssigned = task.subtasks?.some((subtask) =>
        subtask.users?.some((subtaskUser) => subtaskUser.id === user.id),
      );

      const isTaskAssigned = task.users.some(
        (assignedUser) => assignedUser.id === user.id,
      );

      if (
        isTaskListUnlocked ||
        isCreatedByUser ||
        isUserInIncidentDivision ||
        isSubtaskAssigned ||
        isTaskAssigned
      ) {
        userIdsToSend.push(user.id);
      } else {
        userIdsToRemoveTask.push(user.id);
      }
    } else {
      userIdsToSend.push(user.id);
    }
  }

  return {
    userIdsToSend,
    userIdsToRemoveTask,
  };
};
