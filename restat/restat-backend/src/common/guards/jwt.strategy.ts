import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "src/modules/auth/auth.service";
import { LoginTimeoutException } from "../helpers";
import { INVALID_SESSION, USER_NOT_FOUND } from "../constants/exceptions";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: new ConfigService().get<string>("JWT_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: string) {

    const session = await this.authService.isSessionValid(payload)
    if (!session) throw new LoginTimeoutException(INVALID_SESSION);

    const user = await this.authService.getUserObject(session?.userId)
    if (!user) throw new NotFoundException(USER_NOT_FOUND);

    await this.authService.updateLastActivityDate(user)

    await this.authService.checkUserSubscription(user.id, req.url)

    const filteredUser = user.toJSON();
    return filteredUser;
  }
}