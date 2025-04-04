import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { User } from '@ontrack-tech-group/common/models';
import { WeatherProviderService } from './weather-provider.service';
import {
  CreateWeatherProviderDto,
  GetAllWeatherProviderDto,
  UpdateWeatherProviderDto,
} from './dto';
import { createWeatherProviderBody, updateWeatherProviderBody } from './body';

@ApiTags('Weather Providers')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('weather_providers')
export class WeatherProviderController {
  constructor(
    private readonly weatherProviderService: WeatherProviderService,
  ) {}

  @ApiOperation({
    summary: 'Create a Weather Provider',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.WEATHER_PROVIDER_CREATE)
  @ApiBody(createWeatherProviderBody)
  @Post()
  createWeatherProvider(
    @Body() createWeatherProviderDto: CreateWeatherProviderDto,
    @AuthUser() user: User,
  ) {
    return this.weatherProviderService.createWeatherProvider(
      createWeatherProviderDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Request a Weather Provider',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.WEATHER_PROVIDER_REQUEST)
  @ApiBody(updateWeatherProviderBody)
  @Post('request')
  requestWeatherProvider(
    @Body() createWeatherProviderDto: CreateWeatherProviderDto,
    @AuthUser() user: User,
  ) {
    return this.weatherProviderService.createWeatherProvider(
      createWeatherProviderDto,
      user,
      true,
    );
  }

  @ApiOperation({
    summary: 'Get All Weather Provider',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.WEATHER_PROVIDER_VIEW)
  @Get()
  getAllWeatherProviders(
    @Query() getAllWeatherProviderDto: GetAllWeatherProviderDto,
  ) {
    return this.weatherProviderService.getAllWeatherProviders(
      getAllWeatherProviderDto,
    );
  }

  @ApiOperation({
    summary: 'Update a Weather Provider',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.WEATHER_PROVIDER_UPDATE)
  @Put('/:id')
  updateWeatherProvider(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateWeatherProviderDto: UpdateWeatherProviderDto,
  ) {
    return this.weatherProviderService.updateWeatherProvider(
      pathParamIdDto.id,
      updateWeatherProviderDto,
    );
  }
}
