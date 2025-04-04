import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import {
  BaseDeployment,
  Department,
  DotMapDot,
  DotMapShift,
  DotMapVendor,
  User,
} from '@ontrack-tech-group/common/models';
import {
  getCompanyScope,
  getEventForPdfs,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  PdfTypes,
  SocketTypesStatus,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { DateMultipleFilterDto } from '@ontrack-tech-group/common/dto';
import { commonEventCheckInclude } from '@Common/helpers';
import { SocketTypesModule } from '@Common/constants/enums';
import { DEFAULT_BLACK_COLOR } from '@Common/constants';
import {
  BudgetSummaryDto,
  DeploymentPdfDto,
  GetAllVendorsDto,
  GetBudgetSummaryPdfDto,
  UpdateVendorsDto,
} from './dto';
import {
  areAllVendorsExist,
  budgetSummaryhelper,
  formatCoverage,
  generatePdfHelper,
  sendBudgetSummarySocket,
  sendVendorSocketUpdates,
} from './helper';
import { getAllVendorsWhere } from './helper/where';

@Injectable()
export class VendorService {
  constructor(
    private pusherService: PusherService,
    private sequelize: Sequelize,
    private httpService: HttpService,
  ) {}

  async generateBudgetSummaryPdf(
    getBudgetSummaryPdfDto: GetBudgetSummaryPdfDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_id, filename } = getBudgetSummaryPdfDto;

    const [company_id] = await withCompanyScope(user, event_id);

    const summary = await budgetSummaryhelper(event_id);
    const event = await getEventForPdfs(event_id, this.sequelize);

    let userDepartment = {};

    const baseDeployment = await BaseDeployment.findOne({
      where: { event_id },
      attributes: ['id'],
      include: [
        {
          model: User,
          attributes: ['name', 'cell', 'country_code'],
          include: [
            {
              model: Department,
              attributes: ['name'],
              where: { company_id },
              required: false,
            },
          ],
        },
      ],
    });

    if (baseDeployment) {
      const { name, cell, country_code } = baseDeployment.user;
      const department = baseDeployment.user
        .department as unknown as Department[];
      userDepartment = {
        name,
        cell: country_code + cell,
        department: department.length ? `(${department[0].name})` : '',
      };
    }

    const shifts = (
      await DotMapShift.findAll({
        where: { event_id },
        attributes: ['start_date'],
      })
    ).map((shift) => shift.start_date);

    const coverage = formatCoverage(shifts);

    return await generatePdfHelper(
      {
        summary,
        event,
        userDepartment: userDepartment || { name: 'N/A', cell: 'N/A' },
        coverage,
        headerText: `Budget Summary - ${event.name}`,
      },
      req,
      res,
      this.httpService,
      filename,
      PdfTypes.DOTMAP_CONTRACT_ASSIGNMENT,
    );
  }

  async generateDeploymentPdf(
    deploymentPdfDto: DeploymentPdfDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { filename, image_url, event_id } = deploymentPdfDto;

    await withCompanyScope(user, event_id);

    const event = await getEventForPdfs(event_id, this.sequelize);

    const vendors = await DotMapVendor.findAll({
      attributes: ['id', 'name', 'color'],
      include: [
        {
          model: DotMapDot,
          where: { event_id },
          attributes: ['id', 'placed'],
        },
      ],
    });

    const formattedVendors = vendors.map(({ id, name, color, dots }) => ({
      id,
      name,
      color: color || DEFAULT_BLACK_COLOR,
      placed: dots.filter((dot) => dot.placed).length,
      total: dots.length,
    }));

    return await generatePdfHelper(
      {
        image_url,
        event,
        vendors: formattedVendors,
        headerText: `Deployment Map - ${event.name}`,
      },
      req,
      res,
      this.httpService,
      filename,
      PdfTypes.DOTMAP_DEPLOYMENT_MAP,
    );
  }

  async getAllVendors(getAllVendorsDto: GetAllVendorsDto, user: User) {
    const { company_id, event_id } = getAllVendorsDto;

    if (!event_id) {
      await getCompanyScope(user, company_id);
    } else {
      await withCompanyScope(user, event_id);
    }

    const vendors = await DotMapVendor.findAll({
      where: getAllVendorsWhere(getAllVendorsDto),
      attributes: ['id', 'name'],
      include: commonEventCheckInclude(event_id),
    });

    return vendors;
  }

  async getAllVendorsWithDotCount(event_id: number, user: User) {
    await withCompanyScope(user, event_id);

    const vendors = await DotMapVendor.findAll({
      attributes: [
        'id',
        'name',
        'color',
        [Sequelize.literal(`COUNT("dots"."id")::INTEGER`), 'dot_count'],
      ],
      include: commonEventCheckInclude(event_id),
      group: [`"DotMapVendor"."id"`],
    });

    const totalDots = vendors.reduce((total, vendor) => {
      vendor = vendor.toJSON();
      return total + vendor['dot_count'];
    }, 0);
    return { totalDots, vendors };
  }

  async getBudgetSummary(budgetSummaryDto: BudgetSummaryDto, user: User) {
    const { event_id, dates } = budgetSummaryDto;

    await withCompanyScope(user, event_id);

    return await budgetSummaryhelper(event_id, null, dates);
  }

  async updateVendor(updateVendorDto: UpdateVendorsDto, user: User) {
    const { vendors, company_id, event_id } = updateVendorDto;
    const updatedVendors = [];

    // checking if user has access to company
    await getCompanyScope(user, company_id);

    // checking if all vendors passed existing and then returning company id from one of the vendor.
    const existingVendors = await areAllVendorsExist(
      vendors.map((vendor) => vendor.id),
      company_id,
    );

    // Prepare maps for existing vendors by ID for quick lookup
    const existingVendorsMap = new Map(
      existingVendors.map((ev) => [ev.id, ev]),
    );

    // Separate vendors into those needing creation or update
    const toCreateVendors = [];
    const toUpdateVendors = [];

    vendors.forEach((vendor) => {
      const existingVendor = existingVendorsMap.get(vendor.id);

      if (existingVendor) {
        if (vendor.name !== existingVendor.name) {
          toCreateVendors.push(vendor);
        } else if (vendor.color !== existingVendor.color) {
          toUpdateVendors.push(vendor);
        }
      }
    });

    const transaction = await this.sequelize.transaction();

    try {
      // If the vendor’s name is updated, a new vendor will be created, and all existing data associated with the previous vendor
      if (toCreateVendors.length) {
        const createdVendors = await Promise.all(
          toCreateVendors.map(async ({ id, name, color }) => {
            const createdVendor = await DotMapVendor.create(
              {
                name,
                color,
                company_id,
              },
              { transaction },
            );

            // Update associated dots with the new vendor ID
            await DotMapDot.update(
              { vendor_id: createdVendor.id },
              { where: { vendor_id: id, event_id }, transaction },
            );

            return { id: createdVendor.id, name, color, oldVendorId: id };
          }),
        );

        updatedVendors.push(...createdVendors);
      }

      if (toUpdateVendors.length) {
        const updatedColors = await Promise.all(
          toUpdateVendors.map(async ({ id, color }) => {
            const [, updatedRows] = await DotMapVendor.update(
              { color },
              { where: { id, company_id }, returning: true, transaction },
            );

            if (updatedRows?.[0]) {
              const { id, name, color } = updatedRows[0];
              return { id, name, color };
            }

            return null;
          }),
        );

        updatedVendors.push(...updatedColors.filter(Boolean));
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    sendVendorSocketUpdates(
      { vendors: updatedVendors },
      company_id,
      SocketTypesStatus.UPDATE,
      SocketTypesModule.VENDOR,
      false,
      this.pusherService,
    );

    // right now its optional
    if (event_id) {
      sendBudgetSummarySocket(
        { ...(await budgetSummaryhelper(event_id, { useMaster: true })) },
        event_id,
        SocketTypesStatus.UPDATE,
        SocketTypesModule.SUMMARY,
        false,
        this.pusherService,
      );
    }

    return updatedVendors;
  }
}
