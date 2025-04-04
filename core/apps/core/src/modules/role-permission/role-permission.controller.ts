import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionService } from './role-permission.service';
import {
  CreatePermissionDto,
  CreateRoleDto,
  PermissionQueryParams,
  RoleQueryParams,
  ManagePermissionsDto,
  UpdateRoleDto,
  UpdatePermissionDto,
} from './dto';
import {
  createPermission,
  createRole,
  managePermission,
  updatePermission,
  updateRole,
} from './body';

@ApiTags('Roles Permissions')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('role-permission')
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @ApiOperation({
    summary: 'Create a Role',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_CREATE_ROLE)
  @ApiBody(createRole)
  @Post('/role')
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolePermissionService.createRole(createRoleDto);
  }

  @ApiOperation({
    summary: 'Create a Permission',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_CREATE_PERMISSION)
  @ApiBody(createPermission)
  @Post('/permission')
  createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolePermissionService.createPermission(createPermissionDto);
  }

  @ApiOperation({
    summary: 'Assign or Unassign Permissions against a Role',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_MANAGE_PERMISSIONS)
  @ApiBody(managePermission)
  @Post('/manage-permissions')
  managePermission(@Body() managePermissionsDto: ManagePermissionsDto) {
    return this.rolePermissionService.managePermission(managePermissionsDto);
  }

  @Get('/roles')
  @ApiOperation({
    summary: 'Get All Roles',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_VIEW_ROLES)
  getAllRoles(@Query() roleQueryParams: RoleQueryParams) {
    return this.rolePermissionService.getAllRoles(roleQueryParams);
  }

  @Get('/permissions')
  @ApiOperation({
    summary: 'Get All Permissions',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_VIEW_PERMISSIONS)
  getAllPermissions(@Query() permissionQueryParams: PermissionQueryParams) {
    return this.rolePermissionService.getAllPermissions(permissionQueryParams);
  }

  @Get('/:id/role')
  @ApiOperation({
    summary: 'Get Role By Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_VIEW_ROLES)
  getRoleById(@Param() pathParamIdDto: PathParamIdDto) {
    return this.rolePermissionService.getRoleById(pathParamIdDto.id);
  }

  @Get('/:id/permission')
  @ApiOperation({
    summary: 'Get Role By Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_VIEW_PERMISSIONS)
  getPermissionById(@Param() pathParamIdDto: PathParamIdDto) {
    return this.rolePermissionService.getPermissionById(pathParamIdDto.id);
  }

  @Get('/permission-modules')
  @ApiOperation({
    summary: 'Get All Permission Modules',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_VIEW_PERMISSION_MODULES)
  getAllPermissionsModules() {
    return this.rolePermissionService.getAllPermissionsModules();
  }

  @ApiOperation({ summary: 'Update the Role' })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_UPDATE_ROLE)
  @ApiBody(updateRole)
  @Put('/:id/role')
  updateRole(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolePermissionService.updateRole(
      pathParamIdDto.id,
      updateRoleDto,
    );
  }

  @ApiOperation({ summary: 'Update the Permission' })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.ROLE_PERMISSION_UPDATE_PERMISSION)
  @ApiBody(updatePermission)
  @Put('/:id/permission')
  updatePermission(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.rolePermissionService.updatePermission(
      pathParamIdDto.id,
      updatePermissionDto,
    );
  }
}
