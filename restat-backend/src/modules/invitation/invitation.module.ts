import { Module } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { ConfigService } from '@nestjs/config';
import { SendgridModule } from 'src/common/sendgrid/sendgrid.module';
import { IntegrationsServiceHubspot } from '../integrations/hubspot/hubspot.service';

@Module({
  imports: [SendgridModule],
  providers: [InvitationService, ConfigService, IntegrationsServiceHubspot],
  controllers: [InvitationController]
})
export class InvitationsModule { }
