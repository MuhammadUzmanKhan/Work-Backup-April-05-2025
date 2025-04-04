import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthUserWithoutRole = createParamDecorator(
  (data, req: ExecutionContext) => {
    const user = req.switchToHttp().getRequest().user;

    return user;
  },
);
