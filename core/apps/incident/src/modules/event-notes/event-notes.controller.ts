import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Put,
  Param,
  Res,
  Req,
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
import { EventNoteService } from './event-notes.service';
import {
  CreateEventNoteDto,
  GetAllEventNotesDto,
  UpdateEventNoteDto,
} from './dto';

@ApiTags('Event Notes')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('event-notes')
export class EventNoteController {
  constructor(private readonly eventNoteService: EventNoteService) {}

  @ApiOperation({
    summary: 'Create an Event Note',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_NOTE_CREATE)
  @Post()
  createEventNotes(
    @Body() createEventNoteDto: CreateEventNoteDto,
    @AuthUser() user: User,
  ) {
    return this.eventNoteService.createNotes(user, createEventNoteDto);
  }

  @ApiOperation({
    summary: 'Get all Notes for an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_NOTE_VIEW)
  @Get()
  getAllEventNotes(
    @Query() getAllEventNotes: GetAllEventNotesDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.eventNoteService.getAllEventNotes(getAllEventNotes, req, res);
  }

  @ApiOperation({
    summary: 'Get all Notes pdf for an event',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_NOTE_VIEW)
  @Get('/pdf')
  getAllEventNotesPdf(
    @Query() getAllEventNotes: GetAllEventNotesDto,
    @Req() req: Request,
    @Res() res: Response,
    @AuthUser() user: User,
  ) {
    return this.eventNoteService.getAllEventNotesPdf(
      getAllEventNotes,
      req,
      res,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get all Event Note Days',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_NOTE_DAYS)
  @Get('/days')
  getAllEventNoteDays(@Query() eventIdDto: EventIdQueryDto) {
    return this.eventNoteService.getAllEventNoteDays(eventIdDto.event_id);
  }

  @ApiOperation({
    summary: 'Update an Event Note',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_NOTE_UPDATE)
  @Put('/:id')
  updateEventNote(
    @Body() updateEventNoteDto: UpdateEventNoteDto,
    @Param() pathParamId: PathParamIdDto,
  ) {
    return this.eventNoteService.updateEventNote(
      pathParamId.id,
      updateEventNoteDto,
    );
  }
}
