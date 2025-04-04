import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/:id')
  getUserById(@Param() pathParamIdDto: PathParamIdDto) {
    return this.usersService.getUserById(pathParamIdDto.id);
  }
}
