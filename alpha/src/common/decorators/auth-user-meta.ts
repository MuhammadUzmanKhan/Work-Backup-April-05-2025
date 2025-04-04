import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Users } from '../models/user.model';

export const AuthUser = createParamDecorator(
  (data, req: ExecutionContext): Users => {
    return req.switchToHttp().getRequest().user;
  },
);
