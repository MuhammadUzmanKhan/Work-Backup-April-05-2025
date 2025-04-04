import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ERRORS } from '../constants/responses';

@Injectable()
export class SuperAdminGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    if (!user.isAdmin) {
      throw new UnauthorizedException(
        ERRORS.USER_IS_NOT_ALLOWED_TO_ACCESS_THIS_RESOURCE,
      );
    }
    return user;
  }
}
