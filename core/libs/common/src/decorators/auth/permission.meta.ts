import { SetMetadata } from '@nestjs/common';

export const RolePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
