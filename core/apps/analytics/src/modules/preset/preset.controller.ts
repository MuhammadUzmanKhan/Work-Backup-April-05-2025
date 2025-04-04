import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';

import { PresetService } from './preset.service';
import { CreatePresetDto } from './dto';
import { createPreset } from './body';

@ApiTags('Presets')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('preset')
export class PresetController {
  constructor(private readonly presetService: PresetService) {}

  @ApiOperation({
    summary: 'Create a preset',
  })
  @ApiBody(createPreset)
  @Post('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_ANALYTICS_CREATE)
  createPreset(
    @Body() createPresetDto: CreatePresetDto,
    @AuthUser() user: User,
  ) {
    return this.presetService.createPreset(createPresetDto, user);
  }
}
