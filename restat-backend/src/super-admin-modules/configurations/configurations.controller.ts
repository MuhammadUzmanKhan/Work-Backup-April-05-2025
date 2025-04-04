import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.meta';
import { SuperAdminGuard } from 'src/common/guards/super-admin.guard';
import { ConfigurationsService } from './configurations.service';
import { ConfigurationDto } from './dto/configuration.dto';

@Controller('configurations')
export class ConfigurationsController {

    constructor(private readonly configurationsService: ConfigurationsService) { }

    @Public()
    @Get('global-configuration')
    public getGlobalConfiguration() {
        return this.configurationsService.getGlobalConfiguration()
    }

    @Public()
    @UseGuards(SuperAdminGuard)
    @Put('/:id')
    public updateConfiguration(
        @Body() configurationDto: ConfigurationDto,
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.configurationsService.updateConfiguration(id, configurationDto)
    }

}
