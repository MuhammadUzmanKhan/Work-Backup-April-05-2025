import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ClickupDTO } from '../dto/clickup.dto';
import { IntegrationsServiceClickup } from './clickup.service';
import { ClickUpIntegrationDTO } from '../dto/clickup-integrate.dto';
import { ClickUpFieldsDTO } from '../dto/clickup-fields-mapping-dto';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { UpworkProfileDTO } from '../dto/clickup-upwork-profiles-dto';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ROLES } from 'src/common/constants/roles';

@Controller('integrations/clickup')
export class IntegrationsControllerClickup {
    constructor(private readonly integrationService: IntegrationsServiceClickup) { }

    @ApiBearerAuth()
    @Get('/')
    public getClickupIntegrationData(
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getClickUpIntegrations(user.companyId)
    }

    @ApiBearerAuth()
    @Get('/profile')
    public getClickupProfileInfo(
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getClickUpProfileInfo(user.id)
    }

    @ApiBearerAuth()
    @Get('/:code')
    public getClickupWorkspaces(
        @Param() param: ClickupDTO,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getClickUpWorkspaces(user, param)
    }

    @ApiBearerAuth()
    @Get('/spaces/:workspaceId')
    public getClickupSpaces(
        @Param('workspaceId') workspaceId: string,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getClickUpSpaces(user.companyId, workspaceId)
    }

    @ApiBearerAuth()
    @Get('/workspaces/:workspaceId/shared')
    public getClickupSharedHierarchy(
        @Param('workspaceId') workspaceId: string,
        @AuthUser() user: Users,

    ) {
        return this.integrationService.getClickUpSharedHierarchy(user.companyId, workspaceId)
    }

    @ApiBearerAuth()
    @Get('/spaces/:spaceId/folders')
    public getClickupFolders(
        @Param('spaceId') spaceId: string,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getClickUpFolders(user.companyId, spaceId)
    }


    @ApiBearerAuth()
    @Get('/spaces/:spaceId/foldersless')
    public getClickupFolderlessList(
        @Param('spaceId') spaceId: string,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getClickUpFolderlessList(user.companyId, spaceId)
    }

    @ApiBearerAuth()
    @Get('/list/:listId/fields')
    public getClickupFields(
        @Param('listId') listId: string,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.getClickUpFields(user.companyId, listId)
    }

    @ApiBearerAuth()
    @Post('/integrate')
    public saveClickUpIntegration(
        @Body() body: ClickUpIntegrationDTO,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.saveClickUpIntegration(user, body)
    }

    @ApiBearerAuth()
    @Delete('/integration')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
    public deleteClickUpIntegration(
        @AuthUser() user: Users,
    ) {
        return this.integrationService.deleteClickUpIntegration(user)
    }

    @ApiBearerAuth()
    @Post('/profile')
    public saveClickupProfileInfo(
        @Body('code') code: string,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.saveClickUpProfileInfo(user.id, code)
    }

    @ApiBearerAuth()
    @Post('/fields')
    public saveClickUpFieldsMapping(
        @Body() body: ClickUpFieldsDTO,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.saveClickUpFields(user.companyId, body)
    }

    @ApiBearerAuth()
    @Post('/fields/upwork-profiles')
    public saveClickupUpworkProfiles(
        @Body() body: UpworkProfileDTO,
        @AuthUser() user: Users,
    ) {
        return this.integrationService.saveClickupUpworkProfiles(user.companyId, body)
    }



}
