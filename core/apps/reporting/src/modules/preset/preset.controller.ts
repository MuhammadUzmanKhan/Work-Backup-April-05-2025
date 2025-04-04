import {
  Body,
  Controller,
  Delete,
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
import { MessagePattern } from '@nestjs/microservices';
import { Observable, of } from 'rxjs';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { PresetService } from './preset.service';
import { createPreset, updatePreset } from './body';
import { CreatePresetDto, UpdatePresetDto, GetAllPresetDto } from './dto';

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
  @RolePermissions(UserAccess.PRESET_CREATE)
  createPreset(
    @Body() createPresetDto: CreatePresetDto,
    @AuthUser() user: User,
  ) {
    return this.presetService.createPreset(createPresetDto, user);
  }

  @ApiOperation({
    summary: 'Send an email of csv or pdf',
  })
  @Post('/email')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_SEND_EMAIL)
  sendEmail(@Body() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.presetService.sendEmail(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Get all presets',
  })
  @Get('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_VIEW)
  getAllPresets(
    @Query() getAllPresetDto: GetAllPresetDto,
    @AuthUser() user: User,
  ) {
    return this.presetService.getAllPresets(getAllPresetDto, user);
  }

  @ApiOperation({
    summary: 'Get all presets name',
  })
  @Get('/names')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_VIEW)
  getAllPresetNames(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.presetService.getAllPresetNames(eventIdQueryDto.event_id, user);
  }

  @ApiOperation({
    summary: 'Get a preset',
  })
  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_VIEW)
  getPresetById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.presetService.getPresetById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Pin/Unpin a preset',
  })
  @Put('/:id/pin')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_PIN)
  pinPreset(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.presetService.pinPreset(pathParamIdDto.id, user);
  }

  @ApiOperation({
    summary: 'Update a preset',
  })
  @ApiBody(updatePreset)
  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_UPDATE)
  updatePreset(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updatePresetDto: UpdatePresetDto,
    @AuthUser() user: User,
  ) {
    return this.presetService.updatePreset(
      pathParamIdDto.id,
      updatePresetDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Delete a preset',
  })
  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_DELETE)
  deletePreset(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.presetService.deletePreset(pathParamIdDto.id, user);
  }

  @MessagePattern('event-compelete')
  async sendOrScheduleEmail(data: any): Promise<Observable<any>> {
    // This try catch should not be deleted.
    try {
      const body = decryptData(data.body) as any;

      const event = await this.presetService.sendOrScheduleEmail(body);

      return of(event);
    } catch (error) {
      console.log(
        '🚀 ~ PresetController ~ sendOrScheduleEmail ~ error:',
        error,
      );
      return of(error.response);
    }
  }
}
