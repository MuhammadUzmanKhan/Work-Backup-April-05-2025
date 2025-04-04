import { User } from '../models';
import { RolesNumberEnum } from './enums';

/**
 * It will check if the user's role is one of the lower roles or opertation manager
 * @param role as number
 * @returns true or false
 */
export const isLowerRoleIncludingOperationManager = (role: number) =>
  role !== RolesNumberEnum.LEGAL_ADMIN &&
  role !== RolesNumberEnum.ADMIN &&
  role !== RolesNumberEnum.GLOBAL_ADMIN &&
  role !== RolesNumberEnum.GLOBAL_MANAGER &&
  role !== RolesNumberEnum.REGIONAL_MANAGER &&
  role !== RolesNumberEnum.REGIONAL_ADMIN &&
  role !== RolesNumberEnum.SUPER_ADMIN &&
  role !== RolesNumberEnum.ONTRACK_MANAGER;

/**
 * It will check if the user's role is one of the lower roles with restricted visibility of incidents
 * @param role as number
 * @returns true or false
 */
export const isWithRestrictedVisibility = (role: number) =>
  role === RolesNumberEnum.WORKFORCE_MANAGER ||
  role === RolesNumberEnum.CAMERA_VENDOR ||
  role === RolesNumberEnum.CAMPING_MANAGER ||
  role === RolesNumberEnum.CAMPING_DISPATCHER ||
  role === RolesNumberEnum.CAMPING_ADMIN ||
  role === RolesNumberEnum.SERVICE_MANAGER ||
  role === RolesNumberEnum.SERVICE_DISPATCHER;

// who have acces to company
// who have acces to company
export const adminLevelRoles = [
  RolesNumberEnum.ADMIN,
  RolesNumberEnum.OPERATIONS_MANAGER,
];

// who have acces to companies and their sub-companies
export const managerLevelRoles = [
  RolesNumberEnum.GLOBAL_ADMIN,
  RolesNumberEnum.GLOBAL_MANAGER,
  RolesNumberEnum.REGIONAL_MANAGER,
  RolesNumberEnum.REGIONAL_ADMIN,
];

// who have acces to companies and their sub-companies
export const highLevelRoles = [
  RolesNumberEnum.SUPER_ADMIN,
  RolesNumberEnum.ONTRACK_MANAGER,
];

export const isOntrackRole = (role: number) =>
  role === RolesNumberEnum.SUPER_ADMIN ||
  role === RolesNumberEnum.ONTRACK_MANAGER;

export const notOntrackRole = (role: number) =>
  role !== RolesNumberEnum.SUPER_ADMIN &&
  role !== RolesNumberEnum.ONTRACK_MANAGER;

export const isGlobalRole = (role: number) =>
  role === RolesNumberEnum.GLOBAL_ADMIN ||
  role === RolesNumberEnum.GLOBAL_MANAGER ||
  role === RolesNumberEnum.REGIONAL_MANAGER ||
  role === RolesNumberEnum.REGIONAL_ADMIN;

export const notGlobalRole = (role: number) =>
  role !== RolesNumberEnum.GLOBAL_ADMIN &&
  role !== RolesNumberEnum.GLOBAL_MANAGER &&
  role !== RolesNumberEnum.REGIONAL_MANAGER &&
  role !== RolesNumberEnum.REGIONAL_ADMIN;

export const isAdminLevelRole = (role: number) =>
  role === RolesNumberEnum.ADMIN || role === RolesNumberEnum.OPERATIONS_MANAGER;

export const notAdminLevelRole = (role: number) =>
  role !== RolesNumberEnum.ADMIN && role !== RolesNumberEnum.OPERATIONS_MANAGER;

export const isUpperRole = (role: number) =>
  role === RolesNumberEnum.SUPER_ADMIN ||
  role === RolesNumberEnum.ONTRACK_MANAGER ||
  role === RolesNumberEnum.GLOBAL_ADMIN ||
  role === RolesNumberEnum.GLOBAL_MANAGER ||
  role === RolesNumberEnum.REGIONAL_MANAGER ||
  role === RolesNumberEnum.REGIONAL_ADMIN ||
  role === RolesNumberEnum.ADMIN ||
  role === RolesNumberEnum.TASK_ADMIN ||
  role === RolesNumberEnum.DOTMAP_ADMIN;

export const notUpperRole = (role: number) =>
  role !== RolesNumberEnum.SUPER_ADMIN &&
  role !== RolesNumberEnum.ONTRACK_MANAGER &&
  role !== RolesNumberEnum.GLOBAL_ADMIN &&
  role !== RolesNumberEnum.GLOBAL_MANAGER &&
  role !== RolesNumberEnum.REGIONAL_MANAGER &&
  role !== RolesNumberEnum.REGIONAL_ADMIN &&
  role !== RolesNumberEnum.ADMIN &&
  role !== RolesNumberEnum.TASK_ADMIN &&
  role !== RolesNumberEnum.DOTMAP_ADMIN;

// This enum has been created to ensure that within the Incident module, only the roles defined in this enum can delete the images they have uploaded.
// They are restricted from removing images uploaded by others.
export const restrictedDeleteImageRolesIncidentModule = (role: number) =>
  role === RolesNumberEnum.INCIDENT_MANAGER ||
  role === RolesNumberEnum.INCIDENT_DISPATCHER ||
  role === RolesNumberEnum.REGIONAL_MANAGER ||
  role === RolesNumberEnum.CAMPING_ADMIN ||
  role === RolesNumberEnum.CAMPING_MANAGER ||
  role === RolesNumberEnum.CAMPING_DISPATCHER ||
  role === RolesNumberEnum.WORKFORCE_MANAGER ||
  role === RolesNumberEnum.SERVICE_MANAGER ||
  role === RolesNumberEnum.SERVICE_DISPATCHER;

// This enum has been created to ensure that within the Task module, only the roles defined in this enum can delete the images they have uploaded.
// They are restricted from removing images uploaded by others.
export const restrictedDeleteImageRoleTaskModule = (role: number) =>
  role === RolesNumberEnum.INCIDENT_MANAGER ||
  role === RolesNumberEnum.INCIDENT_DISPATCHER ||
  role === RolesNumberEnum.WORKFORCE_MANAGER ||
  role === RolesNumberEnum.CAMPING_MANAGER;

export const isUserHaveGlobalRole = (user: User) =>
  user['is_global_admin'] ||
  user['is_global_manager'] ||
  user['is_regional_manager'] ||
  user['is_regional_admin'];

export const isUserHaveOntrackRole = (user: User) =>
  user['is_super_admin'] || user['is_ontrack_manager'];

export const notUserHaveOntrackRole = (user: User) =>
  !user['is_super_admin'] && !user['is_ontrack_manager'];
