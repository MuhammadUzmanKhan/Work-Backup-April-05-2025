import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SendgridWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.query['token'];

    if (token !== this.configService.get('SENDGRID_AUTHENTICATION_TOKEN')) {
      throw new ForbiddenException();
    }

    return true;
  }
}
