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
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { CompanyIdQueryDto } from '@Common/dto';
import { CadTypeService } from './cad-type.service';
import { CreateUpdateCadTypeDto } from './dto';
import { createCadType, updateCadType } from './body';

@ApiTags('Cad Types')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('cad-types')
export class CadTypeController {
  constructor(private readonly cadTypeService: CadTypeService) {}

  @ApiOperation({
    summary: 'Create a Cad Type',
  })
  @ApiBody(createCadType)
  @Post('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_TYPE_CREATE)
  createCadType(@Body() createCadTypeDto: CreateUpdateCadTypeDto) {
    return this.cadTypeService.createCadType(createCadTypeDto);
  }

  @ApiOperation({
    summary: 'Get CAD Type by ID',
  })
  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_TYPE_VIEW)
  async getCadTypeById(@Param() pathParamIdDto: PathParamIdDto) {
    return this.cadTypeService.getCadTypeById(pathParamIdDto.id);
  }

  @ApiOperation({
    summary: 'Get All CAD Type by company ID',
  })
  @Get('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_TYPE_VIEW)
  async getAllCadType(@Query() companyIdQueryDto: CompanyIdQueryDto) {
    return this.cadTypeService.getAllCadType(companyIdQueryDto.company_id);
  }

  @ApiOperation({ summary: 'Update CAD Type' })
  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @ApiBody(updateCadType)
  @RolePermissions(UserAccess.CAD_TYPE_UPDATE)
  async updateCadType(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateCadTypeDto: CreateUpdateCadTypeDto,
  ) {
    return this.cadTypeService.updateCadType(
      pathParamIdDto.id,
      updateCadTypeDto,
    );
  }

  @ApiOperation({ summary: 'Delete CAD Type by ID' })
  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.CAD_TYPE_DELETE)
  async deleteCadType(@Param() pathParamIdDto: PathParamIdDto) {
    return this.cadTypeService.deleteCadType(pathParamIdDto.id);
  }
}
