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
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PresetMessageService } from './preset-message.service';
import {
  CreatePresetMessageDto,
  UpdatePresetMessageDto,
  GetPresetMessageDto,
} from './dto';
import { User } from '@ontrack-tech-group/common/models';
import { CloneDto } from '@Common/dto';
import { clonePresetMessaging } from './body';

@ApiTags('Preset Messages')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('preset-messages')
export class PresetMessageController {
  constructor(private readonly presetMessageService: PresetMessageService) {}

  @ApiOperation({
    summary: 'Create a Preset Message',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_MESSAGE_CREATE)
  @Post()
  createPresetMessage(@Body() createPresetMessageDto: CreatePresetMessageDto) {
    return this.presetMessageService.createPresetMessage(
      createPresetMessageDto,
    );
  }

  @ApiOperation({
    summary: 'Clone Preset Messaging',
  })
  @Post('/clone')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_MESSAGE_CLONE)
  @ApiBody(clonePresetMessaging)
  clonePresetMessaging(
    @AuthUser() user: User,
    @Body() clonePresetMessagingDto: CloneDto,
  ) {
    return this.presetMessageService.clonePresetMessaging(
      user,
      clonePresetMessagingDto,
    );
  }

  @ApiOperation({
    summary: 'Fetch all Preset Messages',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_MESSAGE_VIEW_ALL)
  @Get()
  getAllPresetMessages(@Query() getPresetMessageDto: GetPresetMessageDto) {
    return this.presetMessageService.getAllPresetMessages(getPresetMessageDto);
  }

  @ApiOperation({
    summary: 'Get a Preset Message by Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_MESSAGE_VIEW)
  @Get('/:id')
  getPresetMessageById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.presetMessageService.getPresetMessageById(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Update a Preset Message',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_MESSAGE_UPDATE)
  @Put('/:id')
  updatePresetMessage(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updatePresetMessageDto: UpdatePresetMessageDto,
  ) {
    return this.presetMessageService.updatePresetMessage(
      pathParamIdDto.id,
      updatePresetMessageDto,
    );
  }

  @ApiOperation({
    summary: 'Destroy a Preset Message',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.PRESET_MESSAGE_DELETE)
  @Delete('/:id')
  deletePresetMessage(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() eventIdQueryDto: EventIdQueryDto,
  ) {
    return this.presetMessageService.deletePresetMessage(
      pathParamIdDto.id,
      eventIdQueryDto.event_id,
    );
  }
}
