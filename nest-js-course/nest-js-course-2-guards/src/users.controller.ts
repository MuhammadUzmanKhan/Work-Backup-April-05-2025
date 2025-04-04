import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.gurad';
import { CustomExceptionFilter } from './filter';
@Controller('users')
@UseFilters(CustomExceptionFilter)
// @UseGuards(AuthGuard)
export class UsersController {
  @Get()
  @Roles(['ADMINISTRATOR', 'OWNER'])
  @UseGuards(AuthGuard, RolesGuard)
  getUser() {
    return { username: 'uzman' };
  }
  @Get('/handle')
  handleException() {
    throw new CustomExceptionFilter();
  }
  // // Get/users
  // @Get()
  // getUser() {
  //   return { username: 'uzman' };
  // }
  // Get/users/test
  @Get('test')
  @UseGuards(AuthGuard)
  getUserTest() {
    return { test: 'Test' };
  }
}
