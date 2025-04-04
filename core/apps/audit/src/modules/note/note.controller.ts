import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import { _UserAccess } from '@Common/constants';

import { CreateNoteDto } from './dto/create-note.dto';
import { NoteService } from './note.service';
import { createNote } from './body';

@ApiTags('Note')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('note')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @ApiOperation({
    summary: 'Create a new note entry',
  })
  @ApiBody(createNote)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(_UserAccess.NOTE_VIEW)
  @Post()
  createNote(@Body() createNoteDto: CreateNoteDto, @AuthUser() user: User) {
    return this.noteService.createNote(createNoteDto, user);
  }
}
