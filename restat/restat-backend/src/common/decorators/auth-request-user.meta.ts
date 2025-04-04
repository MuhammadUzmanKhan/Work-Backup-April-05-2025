import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Users } from "src/common/models/users.model";

export const AuthUser = createParamDecorator(
  (_data, req: ExecutionContext): Users => {
    return req.switchToHttp().getRequest().user;
  }
);
