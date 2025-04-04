import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../../common/guards/jwt.strategy";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "../../common/guards/jwt.guard";
import { AuthController } from "./auth.controller";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserService } from "../user/user.service";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { BidService } from "../bids/bids.service";
import { ContactService } from "../contacts/contacts.service";
import { JobAccountService } from "../jobs/job-account-service";
import { IntegrationsServiceClickup } from "../integrations/clickup/clickup.service";
import { DealLogsService } from "../deal-logs/deal-logs.service";
import { LinkedinReferenceService } from "../linkedin-reference/linkedin-reference.service";
import { AccountService } from "../accounts/accounts.service";
import { JobService } from "../jobs/jobs.service";
import { TagService } from "../tags/tags.service";
import { NotificationsService } from "../notifications/notifications.service";
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
    IntegrationsServiceHubspot,
    AuthService,
    UserService,
    JwtStrategy,
    ConfigService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    BidService,
    ContactService,
    JobAccountService,
    IntegrationsServiceHubspot,
    IntegrationsServiceClickup,
    DealLogsService,
    LinkedinReferenceService,
    AccountService,
    JobService,
    TagService,
    NotificationsService,
  ],
  exports: [AuthService],
})
export class AuthModule { }
