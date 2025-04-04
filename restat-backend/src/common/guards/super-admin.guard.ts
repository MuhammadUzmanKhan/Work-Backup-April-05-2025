import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ROLES } from '../constants/roles';

@Injectable()
export class SuperAdminGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    if (user.role !== ROLES.SUPER_ADMIN) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
