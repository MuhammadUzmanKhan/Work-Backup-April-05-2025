import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
} from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';

import { KafkaService } from './kafka.service';
import { UserLocationDto } from './dto';
import { createUserLocation } from './body';

@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  @ApiOperation({
    summary: 'Create user location',
  })
  @ApiBody(createUserLocation)
  @Post('/user-location')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_CREATE_LOCATION)
  createUserLocation(
    @Body() createUserLocationDto: UserLocationDto,
    @AuthUser() user: User,
  ) {
    return this.kafkaService.createUserLocation(createUserLocationDto, user);
  }
}
