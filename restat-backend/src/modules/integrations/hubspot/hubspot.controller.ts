import { Body, Controller, Delete, Get, Param, Post} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsServiceHubspot } from './hubspot.service';

import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { HubspotIntegrationDTO } from '../dto/hubspot-integration.dto';

@Controller('integrations/hubspot')
export class IntegrationsControllerHubspot {
    constructor(
        private readonly integrationService: IntegrationsServiceHubspot
    ) { }

    @ApiBearerAuth()
    @Get('/')
    public getHubspotIntegration(
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getHubspotIntegration(user.companyId)
    }

    @ApiBearerAuth()
    @Get('/hub_id')
    public getHubspotHubId(
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getHubspotHubId(user.companyId)
    }


    @ApiBearerAuth()
    @Get('/properties')
    public getProperties(
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getHubspotProperties(user.companyId)
    }

    @ApiBearerAuth()
    @Get('/:code')
    public getHubspotPipelines(
        @Param('code') code: string,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getHubspotPipelines(user, code)
    }


    @ApiBearerAuth()
    @Post('/integrate')
    public saveHubspotIntegration(
        @Body() body: HubspotIntegrationDTO,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.saveHubspotIntegration(user, body)
    }


    @ApiBearerAuth()
    @Delete('/integration')
    public deleteHubspotIntegration(
        @AuthUser() user: Users,
    ) {
        return this.integrationService.deleteHubspotIntegration(user)
    }


}
