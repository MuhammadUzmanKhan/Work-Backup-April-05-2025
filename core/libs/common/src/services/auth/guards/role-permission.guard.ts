import { Op } from 'sequelize';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getUserRoleFromCompanyId } from '../../../helpers';
import { RolesNumberEnum } from '../../../constants';
import { Permission, RolePermission } from '../../../models';

@Injectable()
export class RolePermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async matchRolesAndPermission(permissions: string[], userRole: number) {
    if (RolesNumberEnum.SUPER_ADMIN === userRole) return true;

    const userPermission = await RolePermission.findAll({
      attributes: [],
      where: { role_id: userRole },
      include: [
        {
          model: Permission,
          where: {
            name: { [Op.in]: permissions },
          },
        },
      ],
    });

    if (userPermission?.length) return true;
    return false;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );
    if (!permissions) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // getting selected role of that user
    const { role } = await getUserRoleFromCompanyId(user);

    return await this.matchRolesAndPermission(permissions, role);
  }
}
