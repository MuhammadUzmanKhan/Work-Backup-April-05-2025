import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../models';

export const OptionalAuthUser = createParamDecorator(
  async (data, req: ExecutionContext): Promise<User> => {
    const { headers } = req.switchToHttp().getRequest();
    const authorization: string = headers['authorization'];
    if (!authorization) return;

    const configService = new ConfigService();

    const user: User = <User>(
      new JwtService({ secret: configService.get('JWT_SECRET') }).decode(
        authorization.split('Bearer ')[1],
      )
    );
    return user;
  },
);
