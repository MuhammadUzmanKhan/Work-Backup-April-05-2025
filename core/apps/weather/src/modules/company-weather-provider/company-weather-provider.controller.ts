import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  CreateCompanyWeatherProviderDto,
  UpdateCompanyWeatherProviderDto,
} from './dto';
import { CompanyWeatherProviderService } from './company-weather-provider.service';
import {
  createCompanyWeatherProviderBody,
  updateCompanyWeatherProviderBody,
} from './body';

@ApiTags('Company Weather Providers')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('company_weather_providers')
export class CompanyWeatherProviderController {
  constructor(
    private readonly companyWeatherProviderService: CompanyWeatherProviderService,
  ) {}

  @ApiOperation({
    summary: 'Create a Company Weather Provider',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_WEATHER_PROVIDER_CREATE)
  @ApiBody(createCompanyWeatherProviderBody)
  @Post()
  createCompanyWeatherProvider(
    @Body() createCompanyWeatherProviderDto: CreateCompanyWeatherProviderDto,
  ) {
    return this.companyWeatherProviderService.createCompanyWeatherProvider(
      createCompanyWeatherProviderDto,
    );
  }

  @ApiOperation({
    summary: 'Update a Company Weather Provider',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_WEATHER_PROVIDER_UPDATE)
  @ApiBody(updateCompanyWeatherProviderBody)
  @Put('/:id')
  updateCompanyWeatherProvider(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateCompanyWeatherProviderDto: UpdateCompanyWeatherProviderDto,
  ) {
    return this.companyWeatherProviderService.updateCompanyWeatherProvider(
      pathParamIdDto.id,
      updateCompanyWeatherProviderDto,
    );
  }
}
