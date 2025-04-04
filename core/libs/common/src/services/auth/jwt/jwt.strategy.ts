import { Sequelize } from 'sequelize';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserCompanyRole } from '../../../models';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: new ConfigService().get('JWT_SECRET'),
    });
  }

  async validate(payload: { id: number }) {
    const user = await User.findOne({
      where: { id: payload.id },
      attributes: [
        'id',
        'name',
        'email',
        'demo_user',
        'blocked_at',
        'language_code',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 0
            )
          `),
          'is_super_admin',
        ],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 26
            )
          `),
          'is_global_admin',
        ],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 27
            )
          `),
          'is_global_manager',
        ],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 28
            )
          `),
          'is_ontrack_manager',
        ],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 1
            )
          `),
          'is_admin',
        ],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 32
            )
          `),
          'is_regional_manager',
        ],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 33
            )
          `),
          'is_regional_admin',
        ],
      ],
      include: [
        {
          model: UserCompanyRole,
          attributes: ['company_id', 'role_id', 'category'],
        },
      ],
      order: [
        [
          { model: UserCompanyRole, as: 'users_companies_roles' },
          'created_at',
          'DESC',
        ],
      ],
    });

    // if user is blocked, we are sending exception that user is blocked
    if (!user) throw new UnauthorizedException();

    if (user.blocked_at) throw new ForbiddenException('USER_BLOCKED');

    const _user = user.toJSON();

    return _user;
  }
}
