import { Op } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Event,
  Permission,
  RolePermission,
  User,
} from '@ontrack-tech-group/common/models';
import { ViewPermissionsQueryDto } from './dto';
import { eventActiveModulesAttributes } from '@Modules/event/helpers';
import { getQueryListParam } from '@ontrack-tech-group/common/helpers';
import {
  ERRORS,
  ROLES,
  RolesEnum,
  RolesNumberEnum,
} from '@ontrack-tech-group/common/constants';
import {
  PermissionModules,
  accessibleModules,
  excludeArray,
  generalRoleConditionsString,
  moduleRoleMapping,
  roleEventMapping,
  rolesConditions,
} from '@Common/constants';

@Injectable()
export class AppService {
  public healthCheck() {
    return { success: true };
  }

  async viewPermissions(
    viewPermissionQueryDto: ViewPermissionsQueryDto,
    user: User,
  ) {
    const { module } = viewPermissionQueryDto;
    const modules: any = getQueryListParam(module);
    const formattedTasks: Record<string, boolean> = {};

    const permissions = await Permission.findAll({
      where: this.getPermissionsWhere(modules),
      attributes: ['id', 'name'],
      include: [
        {
          model: RolePermission,
          where: { role_id: user['role'] },
          attributes: [],
        },
      ],
    });

    for (const permission of permissions) {
      formattedTasks[permission.name] = true;
    }

    return formattedTasks;
  }

  public async viewActiveEventRoles(event_id: number, user: User) {
    const uniqueRoles = new Set();
    const conditions = generalRoleConditionsString[user['role']];

    const event = await Event.findOne({
      where: { id: event_id },
      attributes: ['id', ...eventActiveModulesAttributes],
      raw: true,
    });
    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    // filtering active Event modules
    const activeEventModules = Object.keys(event).filter(
      (key) => event[key] === true,
    );

    // getting roles list by filter roles access to modules
    activeEventModules.forEach((module) => {
      const roles = accessibleModules[module];

      if (roles) {
        roles.forEach((role: string) => {
          if (this.shouldIncludeRole(role, event)) {
            uniqueRoles.add(role);
          }
        });
      }
    });

    const roles = Array.from(uniqueRoles);

    const sortedRoles = roles.sort();

    // if lower roles, exculde all upper roles
    if (!conditions) {
      return sortedRoles.filter(
        (role) => !excludeArray.includes(role as string),
      );
    } else {
      // if upper roles, exculde accordingly
      return sortedRoles.filter((role) => !conditions.includes(role as string));
    }
  }

  public async getModuleAccess(user: User) {
    const userRole =
      RolesEnum[RolesNumberEnum[user['role']] as keyof typeof RolesEnum];

    const accessibleModules = Object.keys(moduleRoleMapping).filter((module) =>
      moduleRoleMapping[module].includes(userRole),
    );

    return accessibleModules;
  }
  async viewRoles(user: User) {
    // Extract the conditions associated with the user's role
    const conditions = rolesConditions[user['role']];

    // Sort the list of all roles alphabetically
    const sortedRoles = ROLES.sort();

    // If the user has a lower role (no specific conditions), exclude all upper roles
    if (!conditions) {
      return sortedRoles.filter(
        (role) => !excludeArray.includes(role as string),
      );
    } else {
      // If the user has an upper role, exclude roles as specified by the conditions
      return sortedRoles.filter((role) => !conditions.includes(role as string));
    }
  }

  private shouldIncludeRole(role: string, event: Event): boolean {
    // Check each role group to determine if the role should be hidden based on the corresponding event future flag
    for (const [, { roles, eventProperty }] of Object.entries(
      roleEventMapping(event),
    )) {
      const isRoleMatched = roles.includes(role);
      const isEventFuture = event[eventProperty];

      if (isRoleMatched && !isEventFuture) {
        // If the role matches and the corresponding event future flag is false, hide the role
        return false;
      }
    }

    // If none of the conditions match, include the role
    return true;
  }

  private getPermissionsWhere = (modules: PermissionModules[]) => {
    const _where = {};

    if (modules?.length) {
      _where['name'] = {
        [Op.or]: modules.map((module) => ({
          [Op.iLike]: `%${module.toLowerCase()}%:%`,
        })),
      };
    }

    return _where;
  };
}
