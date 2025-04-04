import { Body, Controller, Param, Post, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  RolePermissions,
  AuthUser,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { UserAccess } from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { QueueService } from '@Modules/queue/queue.service';
import { EventService } from '@Modules/event/event.service';
import { cloneEvent, importEvent } from '@Modules/event/body';
import { CloneEventDto, ImportEventDto } from '@Modules/event/dto';

@Controller('event')
@ApiBearerAuth()
@ApiTags('Event')
export class EventController {
  constructor(
    private readonly queueService: QueueService,
    private readonly eventService: EventService,
  ) {}

  /**
   * This method creates a clone of an event.
   *
   * 1. It first attempts to create the event without using a transaction.
   * 2. If the event is successfully created, it returns the newly created event in the response.
   * 3. After the successful creation, it runs all associated tasks in the background using BULL as a queue.
   * 4. If all associations are successfully created, a success message is emitted via a socket.
   * 5. If any association creation fails, a failure message is emitted via the socket.
   */
  @Post('/:id/clone')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_CLONE_EVENT)
  @ApiBody(cloneEvent)
  @ApiOperation({
    summary: `Clone Event With all it's Associations`,
  })
  async cloneEvent(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() cloneEventDto: CloneEventDto,
    @AuthUser() user: User,
  ) {
    return await this.eventService.cloneEvent(
      pathParamIdDto.id,
      cloneEventDto,
      user,
    );
  }

  /**
   * This method imports all data from one event to another event. also delete previous data as well.
   *
   * 1. It first attempts to delete all previous records for the selected the event.
   * 2. After the successful deletion, it runs all associated tasks in the background using BULL as a queue.
   * 3. If all associations are successfully created, a success message is emitted via a socket.
   * 4. If any association creation fails, a failure message is emitted via the socket.
   */
  @Post('/:id/import')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.EVENT_IMPORT)
  @ApiBody(importEvent)
  @ApiOperation({
    summary: `delete all data of event with param "id" and Import all data of other Event With all it's Associations into event with params "id"`,
  })
  async importEvent(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() importEventDto: ImportEventDto,
    @AuthUser() user: User,
  ) {
    return await this.eventService.importEvent(
      pathParamIdDto.id,
      importEventDto,
      user,
    );
  }

  /**
   * This method returns all active queue processes related to event cloning.
   *
   * It responds to the endpoint "/api/event/<event id>/clone/active".
   */
  @Get('/active')
  @ApiOperation({
    summary: `get active and ongoing processes for Event cloning`,
  })
  async getActiveJobs() {
    return await this.queueService.getActiveProccesses();
  }
}
