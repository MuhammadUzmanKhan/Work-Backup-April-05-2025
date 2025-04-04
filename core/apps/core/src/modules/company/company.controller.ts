import { Response, Request } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PaginationDto, PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { DashboardDropdownsQueryDto } from '@Common/dto';
import { CompanyService } from './company.service';
import {
  CompanySubcompanyFilterDto,
  CreateCompanyDto,
  CreateSubcompanyDto,
  SubcompaniesWithEvents,
  UpdateCompanyDto,
  GetCompanyByIdDto,
  GetAllSubcompaniesByCompanyIdDto,
  SubcompaniesWithEventsAndCategory,
} from './dto';
import { createCompany, updateCompany } from './body';

@ApiTags('Companies')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companiesService: CompanyService) {}

  @Post()
  @ApiBody(createCompany)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_CREATE)
  createCompany(
    @Body() createCompanyDto: CreateCompanyDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.createCompany(createCompanyDto, user);
  }

  @Post('/subcompany')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_CREATE)
  createSubcompany(
    @Body() createSubcompanyDto: CreateSubcompanyDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.createSubcompany(createSubcompanyDto, user);
  }

  @Get('/parents-only')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW_PARENTS)
  findAllParentsOnly(
    @Query() dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.findAllParentCompaniesOnly(
      dashboardDropdownsQueryDto,
      user,
    );
  }

  @Get('/subcompanies-only')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW_CHILDS)
  findAllSubcompaniesOnly(
    @Query() dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.findAllSubcompaniesOnly(
      dashboardDropdownsQueryDto,
      user,
    );
  }

  @Get('/:id/subcompanies')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW_CHILDS_BY_COMPANY_ID)
  findAllSubcompaniesByCompanyId(
    @Param()
    getAllSubcompaniesByCompanyIdDto: GetAllSubcompaniesByCompanyIdDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.findAllSubcompaniesByCompanyId(
      getAllSubcompaniesByCompanyIdDto.id,
      user,
    );
  }

  @ApiOperation({
    summary: 'Get Company Category by ID',
  })
  @Get('/:id/category')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW_ALL)
  getCompanyCategory(
    @Param()
    pathParamDto: PathParamIdDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.getCompanyCategory(pathParamDto.id, user);
  }

  @Get('/global-company-scope-ids')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW_CHILDS_BY_COMPANY_ID)
  findGlobalCompanyScopeIds(
    @Query() dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.findGlobalCompanyScopeIds(
      dashboardDropdownsQueryDto,
      user,
    );
  }

  @Get('/subcompanies')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW_CHILDS_WITH_EVENTS)
  findAllChildCompaniesWithEvents(
    @Query() params: SubcompaniesWithEventsAndCategory,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.companiesService.findAllChildCompaniesWithEvents(
      params,
      user,
      req,
      res,
    );
  }

  @Get('/subcompany-events')
  findAllEventsOfsubcompany(
    @Query() params: SubcompaniesWithEvents,
    @AuthUser() user: User,
  ) {
    return this.companiesService.findAllEventsOfsubcompany(params, user);
  }

  @Get('/company-names')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_NAMES)
  allCompanyNames(@AuthUser() user: User) {
    return this.companiesService.allCompanyNames(user);
  }

  @Get('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW_ALL)
  findAllCompanies(
    @Query() params: CompanySubcompanyFilterDto,
    @Res() res: Response,
    @Req() req: Request,
    @AuthUser() user: User,
  ) {
    return this.companiesService.findAllCompanies(params, req, res, user);
  }

  @ApiOperation({
    summary: 'Fetch changelogs of a Company',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_CHANGE_LOG)
  @Get('/:id/change-logs')
  getCompanyChangelogs(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() paginationDto: PaginationDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.getCompanyChangelogs(
      pathParamIdDto.id,
      paginationDto,
      user,
    );
  }

  @Get('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_VIEW)
  public async getCompanyById(
    @Query() params: GetCompanyByIdDto,
    @Param('id') id: string,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.companiesService.getCompanyById(+id, user, params, req);
  }

  @Put('/:id')
  @ApiBody(updateCompany)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_UPDATE)
  updateCompany(
    @Param() pathParamIdDto: PathParamIdDto,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @AuthUser() user: User,
  ) {
    return this.companiesService.updateCompany(
      pathParamIdDto.id,
      updateCompanyDto,
      user,
    );
  }

  @Put('/:id/pin')
  @ApiBearerAuth()
  public async pinCompany(@Param('id') id: string, @AuthUser() user: User) {
    return this.companiesService.pinCompany(+id, user);
  }

  @Delete('/:id')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMPANY_ARCHIVE)
  deleteCompany(@Param('id') id: string) {
    return this.companiesService.deleteCompany(+id);
  }
}
