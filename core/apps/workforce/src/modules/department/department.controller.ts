import { Response, Request } from 'express';
import {
  Body,
  Controller,
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
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
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
import { CloneDto } from '@Common/dto';
import { DepartmentService } from './department.service';
import {
  CreateDepartmentDto,
  GetDepartmentNamesByEventDto,
  DepartmentAssocitateOrDisassociateToEventDto,
  DisassociateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentsQueryDto,
  GetDepartmentByIdQueryDto,
  EventUserDepartmentDto,
} from './dto';
import { createDepartment } from './body';

@ApiTags('Departments')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_CREATE)
  @ApiBody(createDepartment)
  @Post('')
  createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @AuthUser() user: User,
  ) {
    return this.departmentService.createDepartment(createDepartmentDto, user);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_DISASSOCIATE_FROM_EVENT)
  @Post('/disassociate-from-event')
  disassciateDepartmentsFromEvent(
    @Body() disassociateDepartmentDto: DisassociateDepartmentDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.departmentService.disassociateDepartmentsFromEvent(
      disassociateDepartmentDto,
      user,
      req,
    );
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_ASSIGN_TO_EVENT)
  @Post('/assign-to-event')
  addExistingDepartments(
    @Body()
    existingDepartmentsDto: DepartmentAssocitateOrDisassociateToEventDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.departmentService.assignDepartmentsToEvent(
      existingDepartmentsDto,
      user,
      req,
    );
  }

  @ApiOperation({
    summary: 'Clone Event Department',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_CLONE)
  @Post('clone')
  cloneEventDepartment(
    @AuthUser() user: User,
    @Body() cloneEventDepartment: CloneDto,
  ) {
    return this.departmentService.cloneEventDepartment(
      cloneEventDepartment,
      user,
    );
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_VIEW_ALL)
  @Get('')
  getDepartments(
    @Query() departmentsQuery: DepartmentsQueryDto,
    @AuthUser() user: User,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.departmentService.getDepartments(
      departmentsQuery,
      user,
      req,
      res,
    );
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_NAMES)
  @Get('/department-names')
  findAllDivisionNamesByEvent(
    @Query() params: GetDepartmentNamesByEventDto,
    @AuthUser() user: User,
  ) {
    return this.departmentService.findAllDepartmentNamesByEvent(params, user);
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_VIEW)
  @Get('/:id/user-division-count')
  getDepartmentByEventWithUserDivision(
    @Param() eventId: PathParamIdDto,
    @Query() query: EventUserDepartmentDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    return this.departmentService.getDepartmentByEventWithUserDivision(
      eventId.id,
      query,
      res,
      req,
    );
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_VIEW)
  @Get('/:id')
  getDepartmentById(
    @Param() pathParamIdDto: PathParamIdDto,
    @Query() query: GetDepartmentByIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.departmentService.getDepartmentById(
      pathParamIdDto.id,
      user,
      query.event_id ?? 0,
    );
  }

  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DEPARTMENT_UPDATE)
  @Put('/:id')
  updateDepartment(
    @Param() param: PathParamIdDto,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @AuthUser() user: User,
    @Req() req: Request,
  ) {
    return this.departmentService.updateDepartment(
      param.id,
      updateDepartmentDto,
      user,
      req,
    );
  }
}
