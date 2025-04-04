import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "src/common/decorators/public.meta";
import { NotificationsService } from "src/modules/notifications/notifications.service";
import { USER_NOT_FOUND, MAINTENANCE } from "../constants/exceptions";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private reflector: Reflector,
    private readonly notificationsService: NotificationsService
  ) {
    super();
  }

  isPublicRequest(context: ExecutionContext): boolean{
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublicRequest(context)) return true;

    if(await this.notificationsService.isMaintenanceModeOn()) throw new ServiceUnavailableException(MAINTENANCE);
    
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any) {  
    if (err || !user) throw err || new UnauthorizedException(USER_NOT_FOUND);
    return user;
  }

}