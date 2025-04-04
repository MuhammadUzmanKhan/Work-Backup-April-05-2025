import { getHumanizeTitleCaseEnum } from '@ontrack-tech-group/common/helpers';
import {
  IncidentStatusDashboardType,
  Priority,
} from '@ontrack-tech-group/common/constants';
import { IncidentByPriorityAndStatus } from '@Common/constants/interfaces';

export const formatIncidentsByPriority = (
  incidentsByPriority: IncidentByPriorityAndStatus[],
) => {
  const countsByStatusAndPriority = {};

  incidentsByPriority.forEach((incident: IncidentByPriorityAndStatus) => {
    const { status, priority, count } = incident;

    // It checks if particular status count is already added in object. if not then initialize it with 0.
    if (!countsByStatusAndPriority[status]) {
      countsByStatusAndPriority[status] = {};
      countsByStatusAndPriority[status]['totalCount'] = 0;
    }

    // It added count to that status and if already added count then added to that.
    countsByStatusAndPriority[status][priority] =
      (countsByStatusAndPriority[status][priority] || 0) + count;
    countsByStatusAndPriority[status]['totalCount'] += count;
  });

  const allStatuses = getHumanizeTitleCaseEnum(IncidentStatusDashboardType);

  const allPriorities = getHumanizeTitleCaseEnum(Priority);

  // This loop covers if any status with any priority is not exist in the object then add it with 0 in object.
  allStatuses.forEach((status) => {
    if (!countsByStatusAndPriority[status]) {
      countsByStatusAndPriority[status] = {};
      countsByStatusAndPriority[status]['totalCount'] = 0;
    }
    allPriorities.forEach((priority) => {
      if (!countsByStatusAndPriority[status][priority]) {
        countsByStatusAndPriority[status][priority] = 0;
        countsByStatusAndPriority[status]['totalCount'] += 0;
      }
    });
  });

  return countsByStatusAndPriority;
};

/**
 * This function formats seconds to hr:min:sec format i.e 10:20:30
 * @param seconds
 * @returns
 */
export const formatTime = (seconds: number) => {
  if (seconds === undefined || seconds === null) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);

  return `${hours}:${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
};
