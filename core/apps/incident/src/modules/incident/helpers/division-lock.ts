import {
  isLowerRoleIncludingOperationManager,
  isWithRestrictedVisibility,
} from '@ontrack-tech-group/common/constants';
import { Incident, User } from '@ontrack-tech-group/common/models';

/**
 *
 * @param usersData Array of user object having user id, role (id), list of user's incident divisions
 * @param incident Created or updated Incident for which we need to send update in socket
 * @returns It will check if user belongs to lower role or not. And then further if it belongs to simple division lock functionality or restricted functionality or no restriction at all.
 */
export const getUserIdsFollowingDivisionLockChecks = (
  usersData: (User & { role: number })[],
  incident: Incident,
): {
  userIdsToSendWithEdit: number[];
  userIdsToSendWithoutEdit: number[];
  userIdsToRemoveIncident: number[];
} => {
  const userIdsToSendWithEdit = [];
  const userIdsToSendWithoutEdit = [];
  const userIdsToRemoveIncident = [];

  for (const user of usersData) {
    // check if user belongs to lower role
    const isLowerRole = isLowerRoleIncludingOperationManager(user['role']);

    if (isLowerRole) {
      // this boolean is used to check if we need to send incident to lower roles user or not based on 2 diff conditions.
      let isNeedToSend = false;

      const isCreatedByUser = incident.created_by === user.id;

      const isUserDispatched = incident.users.some((usr) => usr.id === user.id);

      // check if users division is one of the assigned division of incident
      const isUserInIncidentDivisions = incident.incident_divisions.some(
        ({ id }) =>
          (user.incident_divisions as unknown as number[]).includes(id),
      );

      // if incident have any division or not
      const hasIncidentDivisions = incident.incident_divisions.length;

      // if user belongs to not only lower role but also within restricted roles.
      const isRestrictedRole = isWithRestrictedVisibility(user['role']);

      // For roles with restricted visibility (only logged or dispatched incidents)
      if (
        (isRestrictedRole && (isCreatedByUser || isUserDispatched)) ||
        (!isRestrictedRole &&
          (isCreatedByUser ||
            isUserInIncidentDivisions ||
            !hasIncidentDivisions ||
            isUserDispatched))
      ) {
        isNeedToSend = true;
      }

      if (isNeedToSend) {
        if (
          isUserInIncidentDivisions ||
          !hasIncidentDivisions ||
          isUserDispatched
        ) {
          // user belongs to those which should have edit access of the incident
          userIdsToSendWithEdit.push(user.id);
        } else {
          // user belongs to those which should have only read/view access of the incident
          userIdsToSendWithoutEdit.push(user.id);
        }
      } else {
        userIdsToRemoveIncident.push(user.id);
      }
    } else {
      // For higher roles, simply push the user
      userIdsToSendWithEdit.push(user.id);
    }
  }

  return {
    userIdsToSendWithEdit,
    userIdsToSendWithoutEdit,
    userIdsToRemoveIncident,
  };
};
