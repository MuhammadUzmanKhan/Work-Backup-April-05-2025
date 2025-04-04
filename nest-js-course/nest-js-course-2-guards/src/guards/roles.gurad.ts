import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Roles } from 'src/decorators/roles.decorator';

const fakeUser = {
  username: 'uzman',
  roles: ['ADMINISTRATOR', 'OWNER', 'MODERATOR', 'GUEST'],
};
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('inside user RolesGuard guard');
    // const request = context.switchToHttp().getRequest();
    // request.user.roles;
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    console.log(requiredRoles);
    if (
      requiredRoles.every((requiredRoles) =>
        fakeUser.roles.includes(requiredRoles),
      )
    ) {
      console.log('User has every required role!');
      return true;
    }
    return false;
  }
}
