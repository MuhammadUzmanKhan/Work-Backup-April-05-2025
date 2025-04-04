import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Put,
  Param,
  Delete,
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
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { User } from '@ontrack-tech-group/common/models';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { LiveVideoService } from './live-video.service';
import {
  CreateLiveVideoDto,
  GenerateTokenDto,
  GetAllLiveVideosDto,
  UpdateLiveVideoDto,
} from './dto';
import { createLiveVideoBody, generateToken } from './body';

@ApiTags('Live Video')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('live-videos')
export class LiveVideoController {
  constructor(private readonly liveVideoService: LiveVideoService) {}

  @ApiOperation({
    summary: 'Create a Live Video',
  })
  @ApiBody(createLiveVideoBody)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.LIVE_VIDEO_CREATE)
  @Post()
  createLiveVideo(
    @Body() createLiveVideoDto: CreateLiveVideoDto,
    @AuthUser() user: User,
  ) {
    return this.liveVideoService.createLiveVideo(createLiveVideoDto, user);
  }

  @ApiOperation({
    summary: 'Generate Agora Token for Live Video',
  })
  @ApiBody(generateToken)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.LIVE_VIDEO_GENERATE_TOKEN)
  @Post('/generate-token')
  generateToken(@Body() generateTokenDto: GenerateTokenDto) {
    return this.liveVideoService.generateToken(generateTokenDto);
  }

  @ApiOperation({
    summary: 'Get all Live Videos for an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.LIVE_VIDEO_VIEW_ALL)
  @Get()
  getAllLiveVideos(@Query() getAllLiveVideosDto: GetAllLiveVideosDto) {
    return this.liveVideoService.getAllLiveVideos(getAllLiveVideosDto);
  }

  @ApiOperation({
    summary: 'Get a Live Videos for an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.LIVE_VIDEO_VIEW)
  @Get('/:id')
  getLiveVideoById(
    @Param() liveVideoId: PathParamIdDto,
    @Query() eventIdDto: EventIdQueryDto,
  ) {
    return this.liveVideoService.getLiveVideoById(
      liveVideoId.id,
      eventIdDto.event_id,
    );
  }

  @ApiOperation({
    summary: 'Update a Live Video',
  })
  @Put('/:id')
  updateLiveVideo(
    @Param() pathParamId: PathParamIdDto,
    @Body() updateLiveVideoDto: UpdateLiveVideoDto,
    @AuthUser() user: User,
  ) {
    return this.liveVideoService.updateLiveVideo(
      pathParamId.id,
      updateLiveVideoDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Destroy Live Video',
  })
  @Delete('/:id')
  deleteLiveVideo(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.liveVideoService.deleteLiveVideo(pathParamIdDto.id, user);
  }
}
