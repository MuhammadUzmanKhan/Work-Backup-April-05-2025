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
import { ResolvedIncidentNoteService } from './resolved-incident-note.service';
import {
  CreateResolvedIncidentNoteDto,
  UpdateResolvedIncidentNoteDto,
} from './dto';
import { createResolvedIncidentNote, updateResolvedIncidentNote } from './body';

@ApiTags('Resolved Incident Note')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('resolved-incident-note')
export class ResolvedIncidentNoteController {
  constructor(
    private readonly resolvedIncidentNoteService: ResolvedIncidentNoteService,
  ) {}

  @ApiOperation({
    summary: 'Create a Resolved Incident Note',
  })
  @ApiBody(createResolvedIncidentNote)
  @Post()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.RESOLVED_INCIDENT_NOTE_CREATE)
  createResolvedIncidentNote(
    @Body() createResolvedIncidentNoteDto: CreateResolvedIncidentNoteDto,
    @AuthUser() user: User,
  ) {
    return this.resolvedIncidentNoteService.createResolvedIncidentNote(
      createResolvedIncidentNoteDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Resolved Incident Note by Id',
  })
  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.RESOLVED_INCIDENT_NOTE_VIEW)
  getResolvedIncidentNoteById(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.resolvedIncidentNoteService.getResolvedIncidentNoteById(
      pathParamIdDto.id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update a Resolved Incident Note',
  })
  @ApiBody(updateResolvedIncidentNote)
  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.RESOLVED_INCIDENT_NOTE_UPDATE)
  updateResolvedIncidentNote(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateResolvedIncidentNoteDto: UpdateResolvedIncidentNoteDto,
    @AuthUser() user: User,
  ) {
    return this.resolvedIncidentNoteService.updateResolvedIncidentNote(
      pathParamIdDto.id,
      updateResolvedIncidentNoteDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Destroy Resolved Incident Note',
  })
  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.RESOLVED_INCIDENT_NOTE_DELETE)
  deleteResolvedIncidentNote(
    @Query() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.resolvedIncidentNoteService.deleteResolvedIncidentNote(
      pathParamIdDto.id,
      user,
    );
  }
}
