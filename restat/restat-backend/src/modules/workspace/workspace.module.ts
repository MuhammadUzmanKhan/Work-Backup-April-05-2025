import { Module } from "@nestjs/common";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceController } from "./workspace.controller";
import { ConfigService } from "@nestjs/config";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { StripeService } from "../payments/stripe/stripe.service";
import { PaymentsService } from "../payments/payments.service";

@Module({
  providers: [WorkspaceService, ConfigService, IntegrationsServiceHubspot, StripeService, PaymentsService],
  controllers: [WorkspaceController],
})
export class WorkspaceModule { }
