import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import {
  GetBudgetSummaryPdfDto,
  DeploymentPdfDto,
  UpdateVendorsDto,
  GetAllVendorsDto,
  BudgetSummaryDto,
} from './dto';

describe('VendorController', () => {
  let controller: VendorController;
  let vendorService: VendorService;

  const mockUser = userFixture.create();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorController],
      providers: [
        {
          provide: VendorService,
          useValue: {
            generateBudgetSummaryPdf: jest.fn(),
            generateDeploymentPdf: jest.fn(),
            getBudgetSummary: jest.fn(),
            updateVendor: jest.fn(),
            getAllVendors: jest.fn(),
            getAllVendorsWithDotCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VendorController>(VendorController);
    vendorService = module.get<VendorService>(VendorService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls after each test
  });

  describe('getBudgetSummaryPdf', () => {
    it('should call vendorService.generateBudgetSummaryPdf with correct parameters', async () => {
      const req = {} as Request;
      const res = {} as Response;
      const getBudgetSummaryPdfDto: GetBudgetSummaryPdfDto = {
        event_id: 123,
        filename: 'test',
      };

      await controller.getBudgetSummaryPdf(
        getBudgetSummaryPdfDto,
        mockUser,
        req,
        res,
      );

      expect(vendorService.generateBudgetSummaryPdf).toHaveBeenCalledWith(
        getBudgetSummaryPdfDto,
        mockUser,
        req,
        res,
      );
    });
  });

  describe('getDeploymentPdf', () => {
    it('should call vendorService.generateDeploymentPdf with correct parameters', async () => {
      const req = {} as Request;
      const res = {} as Response;
      const deploymentPdfDto: DeploymentPdfDto = {
        event_id: 123,
        filename: '',
        image_url: '',
      };

      await controller.getDeploymentPdf(deploymentPdfDto, mockUser, req, res);

      expect(vendorService.generateDeploymentPdf).toHaveBeenCalledWith(
        deploymentPdfDto,
        mockUser,
        req,
        res,
      );
    });
  });

  describe('getBudgetSummary', () => {
    it('should call vendorService.getBudgetSummary with correct event_id and user', async () => {
      const budgetSummaryDto: BudgetSummaryDto = {
        event_id: 123,
        dates: [new Date('2024-09-03')],
      };

      await controller.getBudgetSummary(budgetSummaryDto, mockUser);

      expect(vendorService.getBudgetSummary).toHaveBeenCalledWith(
        budgetSummaryDto,
        mockUser,
      );
    });
  });

  describe('updateVendor', () => {
    it('should call vendorService.updateVendor with correct parameters', async () => {
      const updateVendorsDto: UpdateVendorsDto = {
        vendors: [
          { id: 1, name: 'Vendor 1', color: 'red' },
          { id: 2, name: 'Vendor 2', color: 'blue' },
        ],
        company_id: 123,
        event_id: 456,
      };

      await controller.updateVendor(updateVendorsDto, mockUser);

      expect(vendorService.updateVendor).toHaveBeenCalledWith(
        updateVendorsDto,
        mockUser,
      );
    });
  });

  describe('getAllVendors', () => {
    it('should call vendorService.getAllVendors with correct parameters', async () => {
      const dto = new GetAllVendorsDto();
      const serviceSpy = jest
        .spyOn(vendorService, 'getAllVendors')
        .mockResolvedValue([]);

      await controller.getAllVendors(dto, mockUser);

      expect(serviceSpy).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('getAllVendorsWithDotCount', () => {
    it('should call vendorService.getAllVendorsWithDotCount with correct parameters', async () => {
      const dto = new EventIdQueryDto();

      await controller.getAllVendorsWithDotCount(dto, mockUser);

      expect(vendorService.getAllVendorsWithDotCount).toHaveBeenCalledWith(
        dto.event_id,
        mockUser,
      );
    });
  });
});
