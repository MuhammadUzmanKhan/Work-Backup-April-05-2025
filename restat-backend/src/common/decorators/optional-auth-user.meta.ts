import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Users } from "src/common/models/users.model";

export const OptionalAuthUser = createParamDecorator(
  async (_data, req: ExecutionContext): Promise<Users> => {
    const { headers } = req.switchToHttp().getRequest();
    const authorization: string = headers["authorization"];
    if (!authorization) return;

    const configService = new ConfigService();

    const user: Users = <Users>(
      new JwtService({ secret: configService.get("JWT_SECRET") }).decode(
        authorization.split("Bearer ")[1]
      )
    );
    return user;
  }
);
