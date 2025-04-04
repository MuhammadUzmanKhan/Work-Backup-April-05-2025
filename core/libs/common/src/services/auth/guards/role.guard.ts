import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getUserRoleFromCompanyId } from '../../../helpers';
import { ROLES } from '../../../constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  matchRoles(roles: string[], userRole: number) {
    return roles.some((role) => role === ROLES[userRole]);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // getting selected role of that user
    const { role } = await getUserRoleFromCompanyId(user);

    return this.matchRoles(roles, role);
  }
}
