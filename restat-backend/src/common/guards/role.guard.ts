import {
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export const RoleGuard = (...roles: string[]) => {
  return class JwtRoleGuard extends AuthGuard("jwt") {
    constructor() {
      super();
    }

    canActivate(context: ExecutionContext) {
      return super.canActivate(context);
    }

    handleRequest(err: any, user: any) {
      if (err || !user) {
        throw err || new UnauthorizedException();
      }
      if (!roles.includes(user.role)) throw new UnauthorizedException();
      return user;
    }
  }

}


