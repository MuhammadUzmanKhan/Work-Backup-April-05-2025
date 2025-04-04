import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { UserService } from './user.service';
import { SendStaffText } from './dto/send-staff-text.dto';

@ApiTags('Users')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/:id')
  getUserById(@Param() param: PathParamIdDto) {
    return this.usersService.getUserById(param.id);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_SEND_STAFF_TEXT)
  @Post('/send-staff-text')
  sendStaffText(@Body() sendStaffText: SendStaffText) {
    return this.usersService.sendStaffText(sendStaffText);
  }
}
