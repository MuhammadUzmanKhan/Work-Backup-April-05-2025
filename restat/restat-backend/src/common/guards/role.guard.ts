import {
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { INVALID_ROLE, USER_NOT_FOUND } from "../constants/exceptions";

export const RoleGuard = (...roles: string[]) => {
  return class JwtRoleGuard extends AuthGuard("jwt") {
    constructor() {
      super();
    }

    canActivate(context: ExecutionContext) {
      return super.canActivate(context);
    }

    handleRequest(err: any, user: any) {
      if (err || !user) throw err || new UnauthorizedException(USER_NOT_FOUND);
      if (!roles.includes(user.role)) throw new UnauthorizedException(INVALID_ROLE);      
      return user;
    }
  }

}


