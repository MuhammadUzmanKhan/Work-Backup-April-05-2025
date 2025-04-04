import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { User } from '@ontrack-tech-group/common/models';
import { AuthUser } from '@ontrack-tech-group/common/decorators';
import { TwilioSettingsService } from './twilio-settings.service';
import {
  AddTwilioConfigurationsDto,
  AddTwilioNumberDto,
  GetLinkedEventsDto,
  LinkEventTwilioNumberDto,
  UpdateTwilioConfigurationsDto,
  UpdateTwilioNumberDto,
} from './dto';
import {
  AddTwilioConfigurations,
  AddTwilioNumber,
  LinkEventTwilioNumber,
  UpdateTwilioConfigurations,
  UpdateTwilioNumber,
} from './body';

@ApiTags('Twilio Settings')
@ApiBearerAuth()
@Controller('twilio-settings')
export class TwilioSettingsController {
  constructor(private readonly twilioSettingsService: TwilioSettingsService) {}

  @ApiOperation({
    summary: 'Add new twilio configurations for company',
  })
  @ApiBody(AddTwilioConfigurations)
  @Post()
  addTwilioConfigurations(
    @Body() addTwilioConfigurationsDto: AddTwilioConfigurationsDto,
    @AuthUser() user: User,
  ) {
    return this.twilioSettingsService.addTwilioConfigurations(
      addTwilioConfigurationsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Add Twilio phone number',
  })
  @ApiBody(AddTwilioNumber)
  @Post('/add-phone-number')
  addTwilioNumber(
    @Body() addTwilioNumber: AddTwilioNumberDto,
    @AuthUser() user: User,
  ) {
    return this.twilioSettingsService.addTwilioNumber(addTwilioNumber, user);
  }

  @ApiOperation({
    summary: 'Link event to twilio number',
  })
  @ApiBody(LinkEventTwilioNumber)
  @Post('/link-event')
  linkEventToTwilioNumber(
    @Body() linkEventTwilioNumberDto: LinkEventTwilioNumberDto,
    @AuthUser() user: User,
  ) {
    return this.twilioSettingsService.linkEventToTwilioNumber(
      linkEventTwilioNumberDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Events Linked to Twilio Number',
  })
  @Get('/linked-events')
  getLinkedEventsByTwilioNumbers(
    @Query() getLinkedEventsDto: GetLinkedEventsDto,
    @AuthUser() user: User,
  ) {
    return this.twilioSettingsService.getLinkedEventsByTwilioNumbers(
      getLinkedEventsDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Company Twilio Settings with Phone Numbers',
  })
  @Get('/:id')
  getTwillioSettings(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.twilioSettingsService.getTwillioSettings(
      pathParamIdDto.id,
      user,
    );
  }

  @ApiOperation({ summary: 'Update Twilio Configurations' })
  @ApiBody(UpdateTwilioConfigurations)
  @Put('/:id')
  updateTwilioSettings(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTwilioConfigurationsDto: UpdateTwilioConfigurationsDto,
    @AuthUser() user: User,
  ) {
    return this.twilioSettingsService.updateTwilioSettings(
      pathParamIdDto.id,
      updateTwilioConfigurationsDto,
      user,
    );
  }

  @ApiOperation({ summary: 'Update Twilio Number' })
  @ApiBody(UpdateTwilioNumber)
  @Put('/:id/phone-number')
  updateTwilioNumber(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTwilioNumberDto: UpdateTwilioNumberDto,
    @AuthUser() user: User,
  ) {
    return this.twilioSettingsService.updateTwilioNumber(
      pathParamIdDto.id,
      updateTwilioNumberDto,
      user,
    );
  }

  @Delete('/unlink-event/:id')
  @ApiOperation({
    summary: 'Unlink event to twilio number',
  })
  unlinkEventToTwilioNumber(@Param() pathParamIdDto: PathParamIdDto) {
    return this.twilioSettingsService.unlinkEventToTwilioNumber(
      pathParamIdDto.id,
    );
  }
}
