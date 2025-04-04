import { Response, Request } from 'express';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
  Res,
  Put,
  Param,
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
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import { ScanCountService } from './scan-count.service';
import {
  CreateScanCountDto,
  GetAllScanCounts,
  UpdateScanCountDto,
} from './dto';

@ApiTags('Scan Counts')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('scan-counts')
export class ScanCountController {
  constructor(private readonly scanCountService: ScanCountService) {}

  @ApiOperation({
    summary: 'Create a Scan Count',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_COUNT_CREATE)
  @Post()
  createScanCount(
    @Body() createScanCountDto: CreateScanCountDto,
    @AuthUser() user: User,
  ) {
    return this.scanCountService.createScanCount(createScanCountDto, user);
  }

  @ApiOperation({
    summary: 'Get all Scan Count for an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.SCAN_COUNT_VIEW,
    UserAccess.SCAN_COUNT_DOWNLOAD_CSV,
  )
  @Get()
  getAllScanCounts(
    @Query() getAllScanCounts: GetAllScanCounts,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.scanCountService.getAllScanCounts(getAllScanCounts, req, res);
  }

  @ApiOperation({
    summary: 'Get all Scan Count Days',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_COUNT_DAYS)
  @Get('/days')
  getAllScanCountsDays(@Query() eventIdDto: EventIdQueryDto) {
    return this.scanCountService.getAllScanCountsDays(eventIdDto.event_id);
  }

  @ApiOperation({
    summary: 'Update a Scan Count',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_COUNT_UPDATE)
  @Put('/:id')
  updateScanCount(
    @AuthUser() user: User,
    @Body() updateScanCountDto: UpdateScanCountDto,
    @Param() pathParamId: PathParamIdDto,
  ) {
    return this.scanCountService.updateScanCount(
      user,
      pathParamId.id,
      updateScanCountDto,
    );
  }
}
