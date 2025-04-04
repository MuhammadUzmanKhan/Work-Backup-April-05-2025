import { Op } from 'sequelize';
import { NotFoundException } from '@nestjs/common';
import { Permission, Role } from '@ontrack-tech-group/common/models';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { ManagePermissionsDto, PermissionQueryParams } from '../dto';

export const permissionsWhereQuery = (
  permissionQueryParams: PermissionQueryParams,
) => {
  const { module, keyword } = permissionQueryParams;
  const _where = {};

  if (module) {
    _where['name'] = {
      [Op.iLike]: `${module.toLowerCase()}:%`,
    };
  }

  if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { description: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  return _where;
};

export const rolesWhereQuery = (keyword: string) => {
  const _where = {};

  if (keyword) {
    _where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
      { description: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
    ];
  }

  return _where;
};

export const modifyPermissionsValidation = async (
  managePermissionsDto: ManagePermissionsDto,
) => {
  const { role_id, permission_ids } = managePermissionsDto;

  // checking this role exist or not
  const role = await Role.findByPk(role_id, { attributes: ['id'] });
  if (!role) throw new NotFoundException(RESPONSES.notFound('Role'));

  // checking all permissions are exist or not
  const allPermissions = await Permission.findAll({
    where: {
      id: {
        [Op.in]: permission_ids,
      },
    },
    attributes: ['id'],
  });

  const allPermissionIds = allPermissions.map(({ id }) => id);

  if (allPermissionIds.length !== permission_ids.length)
    throw new NotFoundException(RESPONSES.notFound('Some of Permissions'));
};
