import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserSessions, Users } from 'src/common/models';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { id: string, session: { sessionToken: string } }) {
    const user = await Users.findByPk(payload.id, {
      include: {
        model: UserSessions,
      }
    });

    if (!user) throw new UnauthorizedException();   
    const _user = user.toJSON();
    delete _user["password"];
    return _user;
  }
}
