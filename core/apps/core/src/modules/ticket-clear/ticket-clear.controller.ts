import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { Public, RolePermissions } from '@ontrack-tech-group/common/decorators';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { EventIdPathDto } from '@Modules/event/dto';
import { TicketClearService } from './ticket-clear.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@ApiTags('Ticket Clear')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('ticket-clear')
export class TicketClearController {
  constructor(private readonly ticketClearService: TicketClearService) {}

  @Post('')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TICKET_CLEAR_CREATE)
  createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.ticketClearService.createTemplate(createTemplateDto);
  }

  @Public()
  @Get('/:identifier')
  getTemplateByEventId(@Param('identifier') identifier: string) {
    return this.ticketClearService.getTemplateByEventId(identifier);
  }

  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TICKET_CLEAR_UPDATE)
  updateTemplate(
    @Param() eventIdPathDto: EventIdPathDto,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.ticketClearService.updateTemplate(
      eventIdPathDto.id,
      updateTemplateDto,
    );
  }

  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TICKET_CLEAR_DELETE)
  deleteTemplate(@Param() pathParamIdDto: PathParamIdDto) {
    return this.ticketClearService.deleteTemplate(pathParamIdDto.id);
  }
}
