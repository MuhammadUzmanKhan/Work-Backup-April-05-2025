import { Controller, Put, Param, Body, UseGuards, Post } from '@nestjs/common';
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
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { EventContactService } from './event-contact.service';
import { CreateEventContactDto, UpdateEventContactDto } from './dto';

@ApiTags('Event Contacts')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('event-contact')
export class EventContactController {
  constructor(private readonly eventContactService: EventContactService) {}

  @ApiOperation({
    summary: 'Create an Event Contact',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CONTACT_CREATE)
  @Post('')
  createEventContact(
    @AuthUser() user: User,
    @Body() createEventContactDto: CreateEventContactDto,
  ) {
    return this.eventContactService.createEventContact(
      createEventContactDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Update an Event Contact',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CONTACT_UPDATE)
  @Put('/:id')
  updateEventContact(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateEventContact: UpdateEventContactDto,
  ) {
    return this.eventContactService.updateEventContact(
      pathParamIdDto.id,
      updateEventContact,
    );
  }
}
