import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from "nestjs-rollbar";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./common/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/user/user.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";
import { InvitationsModule } from './modules/invitation/invitation.module';
import FirebaseService from "./common/firebase/firebase.service";
import { ThemesModule } from "./modules/themes/themes.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { BidsModule } from "./modules/bids/bids.module";
import { AccountModule } from "./modules/accounts/accounts.module";
import { TagModule } from "./modules/tags/tags.module";
import { PortfoliosModule } from "./modules/portfolios/portfolios.module";
import { ProfileModule } from "./modules/profiles/profile.module";
import { IndustryModule } from "./modules/industries/industry.module";
import { LinkedinAccountModule } from "./modules/linkedin-accounts/linkedin-accounts.module";
import { MongoExportModule } from "./modules/mongo-export/mongo-export.module";
import { ErrorModule } from "./modules/errors/error.module";
import { JobModule } from "./modules/jobs/jobs.module";
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { UpdateBidsScriptModule } from "./modules/scripts/update-bids-script.module";
import { MailModule } from "./modules/mail/mail.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { StripeModule } from "./modules/payments/stripe/stripe.module";
import { DealLogsModule } from './modules/deal-logs/deal-logs.module';
import { SuperAuthModule } from "./super-admin-modules/auth/auth.module";
import { ConfigurationsModule } from "./super-admin-modules/configurations/configurations.module";
import { CommentsModule } from './modules/comments/comments.module';
import { ContactModule } from './modules/contacts/contacts.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ContactExperienceModule } from './modules/contact-experience/contact-experience.module';
import { LinkedinReferenceModule } from './modules/linkedin-reference/linkedin-reference.module';
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ExtensionReleasesModule } from "./modules/extension-releases/extension-releases.module";
import { UpworkApisModule } from './modules/upwork-apis/upwork-apis.module';
import { OnboardingCenterModule } from './modules/onboarding-center/onboarding-center.module';
import { PaymentsModule } from './modules/payments/payments.module';
@Module({
  imports: [
    AuthModule,
    ScheduleModule.forRoot(),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isLocal = configService.get('APP_MODE') === 'local';
        return {
          enabled: !isLocal, // Disable Rollbar in local mode
          accessToken: isLocal ? undefined : configService.get('ROLLBAR_TOKEN'), // Avoid setting an invalid token
          environment: configService.get('APP_MODE') ?? 'unset',
          captureUncaught: !isLocal,
          captureUnhandledRejections: !isLocal,
        };
      },
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,
      limit: 5000,
    }]),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get("COMPANIES_MONGO_DB_URL")
      }),
      inject: [ConfigService]
    }),
    UsersModule,
    DatabaseModule,
    WorkspaceModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    InvitationsModule,
    ThemesModule,
    CategoriesModule,
    BidsModule,
    JobModule,
    AccountModule,
    TagModule,
    PortfoliosModule,
    ProfileModule,
    IndustryModule,
    LinkedinAccountModule,
    MongoExportModule,
    ErrorModule,
    IntegrationsModule,
    UpdateBidsScriptModule,
    MailModule,
    SettingsModule,
    StripeModule,
    DealLogsModule,
    SuperAuthModule,
    ConfigurationsModule,
    CommentsModule,
    ContactModule,
    CompaniesModule,
    ContactExperienceModule,
    LinkedinReferenceModule,
    NotificationsModule,
    ExtensionReleasesModule,
    UpworkApisModule,
    OnboardingCenterModule,
    PaymentsModule
  ],
  controllers: [AppController],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
    AppService],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    FirebaseService.initializeApp();
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(async (_req: any, _res: any, next: any) => {
        if (this.configService.get("APP_MODE") === "local")
          await new Promise((res) => setTimeout(res, 200));
        next();
      })
      .forRoutes("*");
  }
}
