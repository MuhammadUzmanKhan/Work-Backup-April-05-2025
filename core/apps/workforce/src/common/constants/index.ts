import { RolesNumberEnum } from '@ontrack-tech-group/common/constants';
export * from './enum';
export * from './responses';

export const workforceRoleConditions = {
  [RolesNumberEnum.OPERATIONS_MANAGER]: [0, 28, 26, 27, 2, 32, 33],
  [RolesNumberEnum.ADMIN]: [0, 28, 26, 27, 2, 32, 33],
  [RolesNumberEnum.REGIONAL_ADMIN]: [0, 28, 26, 27, 2, 32, 33],
  [RolesNumberEnum.REGIONAL_MANAGER]: [0, 28, 26, 2, 27, 32, 33],
  [RolesNumberEnum.GLOBAL_MANAGER]: [0, 28, 26, 2, 27, 32, 33],
  [RolesNumberEnum.GLOBAL_ADMIN]: [0, 28, 2, 26, 27, 32, 33],
  [RolesNumberEnum.ONTRACK_MANAGER]: [0, 2, 28, 26, 27, 32, 33],
  [RolesNumberEnum.SUPER_ADMIN]: [0, 2, 28, 26, 27, 32, 33],
};
