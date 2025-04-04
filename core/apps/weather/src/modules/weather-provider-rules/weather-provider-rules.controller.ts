import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { WeatherProviderRulesService } from './weather-provider-rules.service';
import {
  CreateWeatherProviderRulesDto,
  UpdateWeatherProviderRulesDto,
} from './dto';

@ApiTags('Weather Providers Rules')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('weather-provider-rules')
export class WeatherProviderRulesController {
  constructor(
    private readonly weatherProviderRulesService: WeatherProviderRulesService,
  ) {}

  @ApiOperation({
    summary: 'Create a Weather Provider Rule',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.WEATHER_PROVIDER_RULES_CREATE)
  @Post()
  createWeatherProviderRules(
    @Body() createWeatherProviderRulesDto: CreateWeatherProviderRulesDto,
  ) {
    return this.weatherProviderRulesService.createWeatherProviderRule(
      createWeatherProviderRulesDto,
    );
  }

  @ApiOperation({
    summary: 'Get a Weather Provider Rule',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.WEATHER_PROVIDER_RULES_VIEW)
  @Get('/:id')
  getWeatherProviderRuleById(@Param() pathParamIdDto: PathParamIdDto) {
    return this.weatherProviderRulesService.getWeatherRulesById(
      pathParamIdDto.id,
    );
  }

  @ApiOperation({
    summary: 'Update a Weather Provider Rule',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.WEATHER_PROVIDER_RULES_UPDATE)
  @Put('/:id')
  updateWeatherProviderRule(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateWeatherProviderRulesDto: UpdateWeatherProviderRulesDto,
  ) {
    return this.weatherProviderRulesService.updateWeatherProviderRule(
      pathParamIdDto.id,
      updateWeatherProviderRulesDto,
    );
  }
}
