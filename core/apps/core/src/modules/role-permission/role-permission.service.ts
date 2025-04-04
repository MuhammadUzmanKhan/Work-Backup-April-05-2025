import { Op, Sequelize } from 'sequelize';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Permission,
  PermissionModule,
  Role,
  RolePermission,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  Options,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSizeWithDefault,
} from '@ontrack-tech-group/common/helpers';
import {
  CreatePermissionDto,
  CreateRoleDto,
  ManagePermissionsDto,
  PermissionQueryParams,
  RoleQueryParams,
  UpdatePermissionDto,
  UpdateRoleDto,
} from './dto';
import {
  modifyPermissionsValidation,
  permissionsWhereQuery,
  rolesWhereQuery,
} from './helpers';

@Injectable()
export class RolePermissionService {
  constructor(private readonly configService: ConfigService) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;

    const isRoleExist = await Role.findOne({
      where: {
        name: {
          [Op.iLike]: name,
        },
      },
    });
    if (isRoleExist)
      throw new ConflictException(RESPONSES.alreadyExist('Role'));

    const createdRole = await Role.create({ ...createRoleDto });

    return await this.getRoleById(createdRole.id, { useMaster: true });
  }

  async createPermission(createPermissionDto: CreatePermissionDto) {
    const { name } = createPermissionDto;

    const isPermissionExist = await Permission.findOne({
      where: {
        name: {
          [Op.iLike]: name,
        },
      },
    });
    if (isPermissionExist)
      throw new ConflictException(RESPONSES.alreadyExist('Permission'));

    const createdPermission = await Permission.create({
      ...createPermissionDto,
    });

    return await this.getPermissionById(createdPermission.id, {
      useMaster: true,
    });
  }

  async managePermission(managePermissionsDto: ManagePermissionsDto) {
    const { role_id, permission_ids } = managePermissionsDto;

    throw new NotImplementedException(
      ERRORS.REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT,
    );
    // Role & All permissions must exist validation here
    await modifyPermissionsValidation(managePermissionsDto);

    const allAssignedPermissions = await RolePermission.findAll({
      where: { role_id },
      attributes: ['permission_id'],
    });

    const allAssignedPermissionIds = allAssignedPermissions.map(
      ({ permission_id }) => permission_id,
    );

    const permissionsToAssign = permission_ids.filter(
      (id) => !allAssignedPermissionIds.includes(id),
    );
    const permissionsToUnassign = allAssignedPermissionIds.filter(
      (id) => !permission_ids.includes(id),
    );

    if (permissionsToAssign.length) {
      // Perform assignments using bulkCreate
      const permissionAssignments = permissionsToAssign.map((permissionId) => ({
        role_id,
        permission_id: permissionId,
      }));

      await RolePermission.bulkCreate(permissionAssignments);
    }

    if (permissionsToUnassign.length) {
      // Perform unassignments using a single destroy call
      await RolePermission.destroy({
        where: {
          role_id,
          permission_id: permissionsToUnassign,
        },
      });
    }

    return await this.getRoleById(role_id, { useMaster: true });
  }

  async getAllRoles(roleQueryParams: RoleQueryParams) {
    const { page, page_size, sort_column, order, keyword } = roleQueryParams;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    const roles = await Role.findAndCountAll({
      where: rolesWhereQuery(keyword),
      attributes: [
        'id',
        'name',
        'description',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "roles_permissions"
            WHERE "roles_permissions"."role_id" = "Role"."id"
          )`),
          'permission_count',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(DISTINCT "user_id")::INTEGER FROM "users_companies_roles"
            WHERE "users_companies_roles"."role_id" = "Role"."id"
          )`),
          'user_count',
        ],
      ],
      limit: _page_size,
      offset: _page_size * _page,
      order: [[sort_column || 'name', order || SortBy.ASC]],
    });

    const { rows, count } = roles;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getAllPermissions(permissionQueryParams: PermissionQueryParams) {
    const { page, page_size, sort_column, order, role_id, self_assigned } =
      permissionQueryParams;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    const permissions = await Permission.findAndCountAll({
      where: permissionsWhereQuery(permissionQueryParams),
      attributes: [
        'id',
        'name',
        'type',
        'description',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "roles_permissions"
            WHERE "roles_permissions"."permission_id" = "Permission"."id"
          )`),
          'role_count',
        ],
        role_id >= 0
          ? [
              Sequelize.literal(`EXISTS (
                SELECT 1 FROM "roles_permissions"
                WHERE "roles_permissions"."permission_id" = "Permission"."id"
                  AND "roles_permissions"."role_id" = ${role_id}
              )`),
              'is_assigned',
            ]
          : [Sequelize.literal(`false`), 'is_assigned'],
        [
          Sequelize.fn(
            'INITCAP',
            Sequelize.fn(
              'REPLACE',
              Sequelize.fn(
                'SPLIT_PART',
                Sequelize.col('"Permission"."name"'),
                ':',
                1,
              ),
              '_',
              ' ',
            ),
          ),
          'module',
        ],
      ],
      include:
        role_id >= 0 && self_assigned
          ? [
              {
                model: RolePermission,
                where: { role_id },
                attributes: [],
              },
            ]
          : [],
      limit: _page_size,
      offset: _page_size * _page,
      order:
        role_id >= 0
          ? [
              [Sequelize.literal('"is_assigned"'), 'DESC'], // Sort by 'is_assigned' in descending order (true first)]
              [sort_column || 'name', order || SortBy.ASC],
            ]
          : [[sort_column || 'name', order || SortBy.ASC]],
      subQuery: false,
    });

    const { rows, count } = permissions;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getRoleById(id: number, options?: Options) {
    const role = await Role.findByPk(id, {
      attributes: [
        'id',
        'name',
        'description',
        [
          Sequelize.literal(`(
          SELECT COUNT(*)::INTEGER FROM "roles_permissions"
          WHERE "roles_permissions"."role_id" = "Role"."id"
        )`),
          'permission_count',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(DISTINCT "user_id")::INTEGER FROM "users_companies_roles"
            WHERE "users_companies_roles"."role_id" = "Role"."id"
          )`),
          'user_count',
        ],
      ],
      ...options,
    });
    if (!role) throw new NotFoundException(RESPONSES.notFound('Role'));

    return role;
  }

  async getPermissionById(id: number, options?: Options) {
    const permission = await Permission.findByPk(id, {
      attributes: [
        'id',
        'name',
        'type',
        'description',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "roles_permissions"
            WHERE "roles_permissions"."permission_id" = "Permission"."id"
          )`),
          'role_count',
        ],
      ],
      ...options,
    });
    if (!permission)
      throw new NotFoundException(RESPONSES.notFound('Permission'));

    return permission;
  }

  async getAllPermissionsModules() {
    return await PermissionModule.findAll({
      attributes: ['id', 'name'],
      order: [['name', SortBy.ASC]],
    });
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    const { description } = updateRoleDto;

    const role = await Role.findOne({ where: { id } });
    if (!role) throw new NotFoundException(RESPONSES.notFound('Role'));

    await role.update({ description });

    return await this.getRoleById(role.id, { useMaster: true });
  }

  async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto) {
    const { description } = updatePermissionDto;

    const permission = await Permission.findOne({ where: { id } });
    if (!permission)
      throw new NotFoundException(RESPONSES.notFound('Permission'));

    await permission.update({ description });

    return await this.getPermissionById(permission.id, { useMaster: true });
  }
}
