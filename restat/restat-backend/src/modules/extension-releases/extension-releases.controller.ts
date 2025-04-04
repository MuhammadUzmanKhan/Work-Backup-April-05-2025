import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ExtensionReleasesService } from './extension-releases.service';
import { ROLES } from 'src/common/constants/roles';
import { RoleGuard } from 'src/common/guards/role.guard';
import { CreateExtensionReleaseDto } from './dto/create-extension-releases.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.meta';

@Controller('extension-releases')
export class ExtensionReleasesController {
    constructor(private readonly extensionReleasesService: ExtensionReleasesService) { }

    @ApiBearerAuth()
    @Get('/')
    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    public getAllExtensionReleases() {
        return this.extensionReleasesService.getAllExtensionReleases();
    }

    @Public()
    @Get('/latest')
    public getLatestExtensionRelease() {
        return this.extensionReleasesService.getLatestExtensionReleases();
    }

    @ApiBearerAuth()
    @Post('/')
    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    public createExtensionRelease(
        @Body() createExtensionReleaseDto: CreateExtensionReleaseDto
    ) {
        return this.extensionReleasesService.createExtensionRelease(createExtensionReleaseDto);
    }

    @ApiBearerAuth()
    @Put('/:id')
    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    public updateExtensionRelease(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean
    ) {
        return this.extensionReleasesService.toggelctivateRelease({
            id,
            isActive,
        });
    }

    @ApiBearerAuth()
    @Delete('/:id')
    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    public deleteExtensionRelease(
        @Param('id') id: string
    ) {
        return this.extensionReleasesService.deleteExtensionRelease(id);
    }
}
