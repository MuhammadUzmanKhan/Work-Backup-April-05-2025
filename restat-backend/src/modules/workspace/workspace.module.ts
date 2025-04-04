import { Module } from "@nestjs/common";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceController } from "./workspace.controller";
import { ConfigService } from "@nestjs/config";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";

@Module({
  providers: [WorkspaceService, ConfigService, IntegrationsServiceHubspot],
  controllers: [WorkspaceController],
})
export class WorkspaceModule { }
