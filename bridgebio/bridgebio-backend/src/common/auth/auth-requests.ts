import { createParamDecorator, ExecutionContext } from "@nestjs/common";
export const AuthUser = createParamDecorator(
    (_data, req: ExecutionContext) => {
        return req.switchToHttp().getRequest().user;
    }
);