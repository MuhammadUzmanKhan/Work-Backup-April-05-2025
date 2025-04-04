import { Request, Response } from 'express';
import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { IncidentFormService } from './incident-form.service';
import { IncidentFormByIdDto } from './dto';

@ApiTags('Incident Form')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('incident-form')
export class IncidentFormController {
  constructor(private readonly incidentFormService: IncidentFormService) {}

  @ApiOperation({
    summary: 'Fetch Incident Form By Id',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.INCIDENT_FORM_VIEW)
  @Get('/:id')
  getIncidentFormById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() incidentFormByIdDto: IncidentFormByIdDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.incidentFormService.getIncidentFormById(
      pathParamIdDto.id,
      incidentFormByIdDto,
      user,
      req,
      res,
    );
  }
}
