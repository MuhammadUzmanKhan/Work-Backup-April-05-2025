import { Module } from '@nestjs/common';
import { IntegrationsServiceClickup } from './clickup/clickup.service';
import { IntegrationsControllerClickup } from './clickup/clickup.controller';
import { IntegrationsServiceUpwork } from './upwork/upwork.service';
import { IntegrationsControllerUpwork } from './upwork/upwork.controller';
import { IntegrationsServiceHubspot } from './hubspot/hubspot.service';
import { IntegrationsControllerHubspot } from './hubspot/hubspot.controller';

@Module({
  providers: [IntegrationsServiceClickup, IntegrationsServiceUpwork, IntegrationsServiceHubspot],
  controllers: [IntegrationsControllerClickup, IntegrationsControllerUpwork, IntegrationsControllerHubspot],
  exports: [IntegrationsServiceClickup, IntegrationsServiceUpwork, IntegrationsServiceHubspot],
})
export class IntegrationsModule { }
