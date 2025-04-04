import { PermissionType } from '@Common/constants';
import {
  CreatePermissionDto,
  CreateRoleDto,
  ManagePermissionsDto,
  UpdatePermissionDto,
  UpdateRoleDto,
} from '../dto';

export const createRole = {
  type: CreateRoleDto,
  examples: {
    Example: {
      value: {
        name: 'Role Name',
        description: 'Description of a specific Role',
      },
    },
  },
};

export const createPermission = {
  type: CreatePermissionDto,
  examples: {
    Example: {
      value: {
        name: 'Permission Name',
        type: PermissionType,
        description: 'Description of a specific Role',
      },
    },
  },
};

export const managePermission = {
  type: ManagePermissionsDto,
  examples: {
    Example: {
      value: {
        permission_ids: [1, 2, 3],
        role_id: 1,
      },
    },
  },
};

export const updateRole = {
  type: UpdateRoleDto,
  examples: {
    Example: {
      value: {
        description: 'Description of a specific Role',
      },
    },
  },
};

export const updatePermission = {
  type: UpdatePermissionDto,
  examples: {
    Example: {
      value: {
        type: PermissionType,
        description: 'Description of a specific Role',
      },
    },
  },
};
