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
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { createCad, updateCad } from '@Modules/cads/body';
import { CreateCadDto, UpdateCadDto } from './dto';
import { CadService } from './cad.service';

@ApiTags('Cad')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('cad')
export class CadController {
  constructor(private readonly cadService: CadService) {}

  @ApiOperation({
    summary: 'Create a Cad',
  })
  @ApiBody(createCad)
  @Post('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_CREATE)
  createCad(@Body() createCadDto: CreateCadDto, @AuthUser() user: User) {
    return this.cadService.createCad(user, createCadDto);
  }

  @ApiOperation({
    summary: 'Get a CAD by ID',
  })
  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_VIEW)
  async getCadById(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.cadService.getCadById(pathParamIdDto.id, user);
  }

  @ApiOperation({ summary: 'Get all CADs for an Event' })
  @Get('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_VIEW)
  async getAllCads(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.cadService.getAllCads(eventIdQueryDto.event_id, user);
  }

  @ApiOperation({ summary: 'Update CAD details' })
  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @ApiBody(updateCad)
  @RolePermissions(UserAccess.CAD_UPDATE)
  async updateCad(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateCadDto: UpdateCadDto,
    @AuthUser() user: User,
  ) {
    return this.cadService.updateCad(pathParamIdDto.id, updateCadDto, user);
  }

  @ApiOperation({ summary: 'Update CAD Acitve' })
  @Put('/:id/active')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_UPDATE)
  async updateCadActive(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.cadService.updateCadActive(pathParamIdDto.id, user);
  }

  @ApiOperation({ summary: 'Delete CAD by ID' })
  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  async deleteCad(
    @Param() pathParamIdDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.cadService.deleteCad(pathParamIdDto.id, user);
  }
}
