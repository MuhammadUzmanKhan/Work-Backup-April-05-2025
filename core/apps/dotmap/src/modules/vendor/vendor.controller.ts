import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { COMPANY_ID_API_HEADER } from '@ontrack-tech-group/common/constants';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { UserAccess } from '@Common/constants';
import { VendorService } from './vendor.service';
import {
  BudgetSummaryDto,
  DeploymentPdfDto,
  GetAllVendorsDto,
  GetBudgetSummaryPdfDto,
  UpdateVendorsDto,
} from './dto';
import {
  downloadBudgetSummaryPdf,
  downloadDeploymentPdf,
  updateVendors,
} from './body';

@ApiTags('Vendor')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @ApiOperation({
    summary: 'To get budget summary pdf',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.VENDOR_BUDGET_SUMMARY_PDF)
  @ApiBody(downloadBudgetSummaryPdf)
  @Post('/summary-pdf')
  getBudgetSummaryPdf(
    @Body() getBudgetSummaryPdfDto: GetBudgetSummaryPdfDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.vendorService.generateBudgetSummaryPdf(
      getBudgetSummaryPdfDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: 'To download pdf of dots deployment',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.DOT_DEPLOYMENT_PDF)
  @ApiBody(downloadDeploymentPdf)
  @Post('/deployment-pdf')
  getDeploymentPdf(
    @Body() deploymentPdfDto: DeploymentPdfDto,
    @AuthUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.vendorService.generateDeploymentPdf(
      deploymentPdfDto,
      user,
      req,
      res,
    );
  }

  @ApiOperation({ summary: 'To get list of all vendors against a company' })
  @Get('/')
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.VENDOR_VIEW_ALL)
  getAllVendors(
    @Query() getAllVendorsDto: GetAllVendorsDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.getAllVendors(getAllVendorsDto, user);
  }

  @ApiOperation({
    summary: 'To get list of all vendors against an event with dot counts',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.VENDOR_VIEW_ALL)
  @Get('/dot-count')
  getAllVendorsWithDotCount(
    @Query() eventIdQueryDto: EventIdQueryDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.getAllVendorsWithDotCount(
      eventIdQueryDto.event_id,
      user,
    );
  }

  @ApiOperation({
    summary: 'To get budget summary for each vendor in a list',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.VENDOR_BUDGET_SUMMARY)
  @Get('/budget-summary')
  getBudgetSummary(
    @Query() budgetSummaryDto: BudgetSummaryDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.getBudgetSummary(budgetSummaryDto, user);
  }
  @ApiOperation({
    summary: 'To update a Vendor against an event',
  })
  @ApiBody(updateVendors)
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.VENDOR_UPDATE)
  @Put('/')
  updateVendor(
    @Body() updateVendorsDto: UpdateVendorsDto,
    @AuthUser() user: User,
  ) {
    return this.vendorService.updateVendor(updateVendorsDto, user);
  }
}
