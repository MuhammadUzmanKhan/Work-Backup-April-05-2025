import { Observable, of } from 'rxjs';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
import { MessagePattern } from '@nestjs/microservices';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { AuthUser } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  MessageGroupableType,
} from '@ontrack-tech-group/common/constants';
import { decryptData } from '@ontrack-tech-group/common/helpers';
import { MessageGroupService } from './message-group.service';
import {
  CreateMessageGroupDto,
  GetMessageGroupsByEventDto,
  CreateCustomMessageGroupDto,
  AddUserToMessageGroupDto,
  UpdateMessageGroupDto,
  GetMessageGroupUser,
} from './dto';

@ApiTags('Message Group')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('message-group')
export class MessageGroupController {
  constructor(private readonly messageGroupService: MessageGroupService) {}

  @Post('')
  createMessageGroup(
    @Body() createMessageGroupDto: CreateMessageGroupDto,
    @AuthUser() user: User,
  ) {
    return this.messageGroupService.createMessageGroup(
      createMessageGroupDto,
      user,
    );
  }

  @Post('/custom-message-group')
  createCustomMessageGroup(
    @Body() createCustomMessageGroupDto: CreateCustomMessageGroupDto,
    @AuthUser() user: User,
  ) {
    return this.messageGroupService.createCustomMessageGroup(
      createCustomMessageGroupDto,
      user,
    );
  }

  @Post('/add-user')
  addUserToGroup(@Body() addUserToMessageGroupDto: AddUserToMessageGroupDto) {
    return this.messageGroupService.addUserToGroup(addUserToMessageGroupDto);
  }

  @Get()
  getMessageGroupsByEvent(
    @Query() getMessageGroupsByEventDto: GetMessageGroupsByEventDto,
    @AuthUser() user: User,
  ) {
    return this.messageGroupService.getMessageGroupsByEvent(
      getMessageGroupsByEventDto,
      user,
    );
  }

  @Get('/:id/get-users')
  getMessageGroupUser(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() getMessageGroupUser: GetMessageGroupUser,
  ) {
    return this.messageGroupService.getMessageGroupUser(
      pathParamIdDto.id,
      getMessageGroupUser,
    );
  }

  @Put('/:id/pin')
  pinCompany(@Param() pathParamIdDto: PathParamIdDto, @AuthUser() user: User) {
    return this.messageGroupService.pinMessageGroup(pathParamIdDto.id, user);
  }

  @Put('/:id')
  updateMessageGroup(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() updateMessageGroupDto: UpdateMessageGroupDto,
  ) {
    return this.messageGroupService.updateMessageGroup(
      pathParamIdDto.id,
      updateMessageGroupDto,
    );
  }

  @Delete('/:id')
  deleteMessageGroup(@Param() pathParamIdDto: PathParamIdDto) {
    return this.messageGroupService.deleteMessageGroup(pathParamIdDto.id);
  }

  @MessagePattern('testing-micro')
  async myMethod(data: string): Promise<Observable<any>> {
    const decryptedData = decryptData(data) as unknown as {
      eventId: number;
      user: User;
    };

    try {
      const messageGroup =
        await this.messageGroupService.getMessageGroupsByEvent(
          {
            event_id: decryptedData.eventId,
            group_type: MessageGroupableType.EVENT,
          },
          decryptedData.user,
        );
      return of(messageGroup);
    } catch (error) {
      return of(error.response);
    }
  }
}
