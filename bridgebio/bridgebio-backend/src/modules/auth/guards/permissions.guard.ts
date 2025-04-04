import { Permissions } from '@common/types';
import { CanActivate, ExecutionContext } from '@nestjs/common';

export const PermissionsGuard = (...permissions: Permissions[]) => {
    return class _PermissionsGuard implements CanActivate {
        constructor() { }
        public canActivate(
            context: ExecutionContext,
        ): boolean {
            const user = context.switchToHttp().getRequest().user;
            const hasRequiredPermissions = user.permissions[Permissions.SUPER_ADMIN] || permissions.reduce((acc, key) => acc || user.permissions[key], false);

            return hasRequiredPermissions;
        }
    };
};
