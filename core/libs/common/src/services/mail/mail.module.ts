import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => {
        return {
          transport: {
            host: config.get('C_SMTP_ADDRESS'),
            port: config.get('C_SMTP_PORT'),
            auth: {
              user: config.get('C_SENDGRID_USERNAME'),
              pass: config.get('C_SENDGRID_PASSWORD'),
            },
          },
          defaults: {
            from: config.get('C_SMTP_FROM_EMAIL'),
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
      imports: [ConfigModule.forRoot()],
    }),
    ConfigModule,
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
