import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import { UserAccess } from '@ontrack-tech-group/common/constants';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_VIEW)
  @Get('/:id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(+id);
  }
}
