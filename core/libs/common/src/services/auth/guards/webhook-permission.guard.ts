import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookPermission implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const xApiKey = request.headers['x-api-key'];
    const xApiSecret = request.headers['x-api-secret'];

    if (
      xApiKey === this.configService.get('API_AUTHENTICATION_KEY') &&
      xApiSecret === this.configService.get('API_AUTHENTICATION_SECRET')
    ) {
      return true;
    }

    return false;
  }
}
