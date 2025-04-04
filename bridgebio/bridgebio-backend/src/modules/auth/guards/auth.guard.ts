import { IS_OKTA_USER } from '@common/decorators/okta.decorator';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { Users } from '@common/models/users.model';
import { oktaVerifier } from '@common/services';
import { Permissions } from '@common/types';
import {
    BadRequestException,
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtClaims } from '@okta/jwt-verifier';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly reflector: Reflector,
        private readonly configService: ConfigService,
    ) { }

    public async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        try {
            const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
                context.getHandler(),
                context.getClass()
            ]);
            const isOktaUser = this.reflector.getAllAndOverride<boolean>(IS_OKTA_USER, [
                context.getHandler(),
                context.getClass()
            ]);

            if (isPublic) {
                return true;
            }

            const request = context.switchToHttp().getRequest();
            const token = this.extractTokenFromHeader(request);

            if (!token) {
                throw new UnauthorizedException();
            }

            if (isOktaUser) {
                try {
                    const oktaData = await oktaVerifier(this.configService)
                        .verifyIdToken(token, this.configService.get('OKTA_CLIENT_ID')!);
                    const oktaUser = await this.getOktaUserFromDatabase(oktaData.claims);

                    if (oktaData.claims) {
                        request.user = oktaUser;
                        return true;
                    }
                } catch (oktaError) { }
            }

            try {
                const payload = await this.jwtService.verifyAsync(token, { secret: this.configService.get('JWT_SECRET') });
                const user = await this.getUserFromDatabase(payload);

                if (!user) return false;

                request.user = user;
            } catch (error) {
                throw new UnauthorizedException('Invalid token');
            }

            return true;
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authHeader = request.headers['authorization'];

        if (!authHeader) {
            return undefined;
        }

        const [type, token] = authHeader.split(' ');

        return type === 'Bearer' ? token : undefined;
    }

    private async getUserFromDatabase(id: string) {
        try {
            const user = await Users.findByPk(id);
            const _user = user.toJSON();
            delete _user['password'];

            return _user;
        } catch (error) {
            throw new UnauthorizedException('User not found!');
        }
    }

    private async getOktaUserFromDatabase(oktaClaims: JwtClaims) {
        try {
            const existingUser = await Users.findOne({ where: { email: oktaClaims.email } });

            if (existingUser && existingUser.permissions.isSetByAdmin) return existingUser;

            const permissions = Object.values(Permissions).reduce((acc, permission) => {
                acc[permission] = permission === oktaClaims.roles;
                return acc;
            }, { isSetByAdmin: false } as unknown as Record<Permissions, boolean>);

            if (existingUser) {
                const currentPermissions = Object.values(Permissions).reduce((acc, permission) => {
                    acc[permission] = existingUser.permissions[permission] || false;
                    return acc;
                }, {} as Record<Permissions, boolean>);

                if (JSON.stringify(currentPermissions) !== JSON.stringify(permissions)) {
                    existingUser.permissions = {
                        ...permissions,
                        isSetByAdmin: false
                    };
                    await existingUser.save();
                }

                return existingUser;
            }

            return await Users.create({
                name: oktaClaims.name as string,
                email: oktaClaims.email as string,
                permissions: {
                    ...permissions,
                    isSetByAdmin: false
                },
                isOktaUser: true
            });
        } catch (error) {
            throw new BadRequestException('Unable to find or create user in database!');
        }
    }
}