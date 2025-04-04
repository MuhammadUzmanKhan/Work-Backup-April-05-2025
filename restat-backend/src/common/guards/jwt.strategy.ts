import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { HttpException, Injectable } from "@nestjs/common";
import { Users } from "src/common/models/users.model";
import { ConfigService } from "@nestjs/config";
import { Sessions } from "../models/sessions.model";

export class LoginTimeoutException extends HttpException {
  constructor(message: string) {
    super(message, 440); // 440 status code
  }
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: new ConfigService().get("JWT_SECRET"),
    });
  }

  async validate(payload: string) {
    try {
      const session = await Sessions.findOne({
        where: {
          id: payload
        }
      });
      if (!session?.id) {
        throw new LoginTimeoutException('Invalid session.');
      }
      const user = await Users.findOne({
        where: { id: session.userId },
      });
      const filteredUser = user.toJSON();
      delete filteredUser['password'];
      return filteredUser;
    } catch (error) {
      if(error instanceof HttpException) throw error
      throw new LoginTimeoutException('User not found.');
    }
  }
}
