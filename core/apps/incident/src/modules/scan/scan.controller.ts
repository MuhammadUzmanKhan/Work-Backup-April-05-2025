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
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { ScanService } from './scan.service';
import {
  CreateIncidentUserScanDto,
  CreateScanByStaffAndEventIdDto,
  GetScanByStaffAndEventIdDto,
} from './dto';

@ApiTags('Scans')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('scans')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @ApiOperation({
    summary: 'Create a Scan',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_CREATE)
  @Post()
  createScanByStaffId(
    @Body() createScanDto: CreateScanByStaffAndEventIdDto,
    @AuthUser() user: User,
  ) {
    return this.scanService.createScanByStaffId(createScanDto, user);
  }

  @ApiOperation({
    summary: 'Create a Scan For Incident Dispatched Staff',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_CREATE)
  @Post('/incident-staff')
  createScanForIncidentStaff(
    @Body() createIncidentUserScanDto: CreateIncidentUserScanDto,
    @AuthUser() user: User,
  ) {
    return this.scanService.createScanForIncidentStaff(
      user,
      createIncidentUserScanDto,
    );
  }

  @ApiOperation({
    summary: 'Get Scan by Staff Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_VIEW)
  @Get()
  getScansByStaffId(
    @Query() getScanByStaffAndEventIdDto: GetScanByStaffAndEventIdDto,
  ) {
    return this.scanService.getScansByStaffId(getScanByStaffAndEventIdDto);
  }

  @ApiOperation({
    summary: 'Fetch all Scan Types',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_TYPES)
  @Get('/scan-types')
  getAllScanTypes() {
    return this.scanService.getAllScanTypes();
  }

  @ApiOperation({
    summary: 'Enable Scan',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.SCAN_ENABLE)
  @Put('/:id/enable')
  enableOrDisableScan(@Param() pathParamIdDto: PathParamIdDto) {
    return this.scanService.enableOrDisableScan(pathParamIdDto.id);
  }
}
