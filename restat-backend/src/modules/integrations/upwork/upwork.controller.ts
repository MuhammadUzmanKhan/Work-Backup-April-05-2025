import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { IntegrationsServiceUpwork } from './upwork.service';

@Controller('integrations/upwork')
export class IntegrationsControllerUpwork {
    constructor(private readonly integrationService: IntegrationsServiceUpwork) { }

    @ApiBearerAuth()
    @Get('/:code')
    public getClickupWorkspaces(
        @AuthUser() user: Users,
        @Param('code') code: string,
    ) {
        return this.integrationService.saveUpworkAccessToken(user, code)
    }

   
}
