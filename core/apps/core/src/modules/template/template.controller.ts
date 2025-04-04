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
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolePermissions } from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { TemplateService } from './template.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { createTemplate } from './body';

@ApiTags('Templates')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TEMPLATE_CREATE)
  @ApiBody(createTemplate)
  @ApiOperation({
    summary: 'Create a new Template',
  })
  createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templateService.createTemplate(createTemplateDto);
  }

  @Get()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TEMPLATE_VIEW)
  @ApiOperation({
    summary: 'Get All Templates',
  })
  getAllTemplates() {
    return this.templateService.getAllTemplates();
  }

  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TEMPLATE_VIEW)
  @ApiOperation({
    summary: 'Get Template By Id',
  })
  getTemplateById(@Param() pathParamIdDto: PathParamIdDto) {
    return this.templateService.getTemplateById(pathParamIdDto.id);
  }

  @Put('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TEMPLATE_UPDATE)
  @ApiOperation({ summary: 'Update the Template' })
  @ApiBody(createTemplate)
  updateTemplate(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templateService.updateTemplate(
      pathParamIdDto.id,
      updateTemplateDto,
    );
  }

  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.TEMPLATE_DELETE)
  @ApiOperation({ summary: 'Delete the Template' })
  deleteTemplate(@Param() pathParamIdDto: PathParamIdDto) {
    return this.templateService.deleteTemplate(pathParamIdDto.id);
  }
}
