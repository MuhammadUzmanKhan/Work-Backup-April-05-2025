import { Module } from '@nestjs/common';
import { AuthService as SuperAuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/common/guards/jwt.strategy';
import { AuthService } from 'src/modules/auth/auth.service';
import { IntegrationsServiceHubspot } from 'src/modules/integrations/hubspot/hubspot.service';

@Module({
    imports: [
        PassportModule.register({
            defaultStrategy: "jwt",
        }),
        JwtModule.registerAsync({
            useFactory: (configService: ConfigService) => ({
                secret: configService.get("JWT_SECRET"),
                signOptions: {},
            }),
            imports: [ConfigModule],
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        SuperAuthService,
        JwtStrategy,
        ConfigService,
        AuthService,
        IntegrationsServiceHubspot,
    ],
    exports: [SuperAuthService]
})

export class SuperAuthModule { }
