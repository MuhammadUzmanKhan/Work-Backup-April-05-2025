import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import { Op, QueryTypes } from 'sequelize';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DotMapDot, DotShift } from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  checkIfDuplicateExist,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { ShiftService } from '@Modules/shift/shift.service';
import { areaFixture } from '@Modules/area/area.fixture';
import { positionFixture } from '@Modules/position/position.fixture';
import { positionNameFixture } from '@Modules/position-name/position-name.fixture';
import { dotMapVendorFixture } from '@Modules/vendor/vendor.fixture';
import {
  getVendorsListByEvent,
  sendBudgetSummarySocket,
} from '@Modules/vendor/helper';
import { getArrayInChunks } from '@Common/helpers';
import { DotsGroupBy } from '@Common/constants/enums';
import { DotService } from './dot.service';
import { dotMapDotFixture } from './dot.fixture';
import {
  commonExcludeAttributes,
  commonGroupBy,
  commonIncludeAttributes,
  commonIncludes,
  dotsResponseForClone,
  getAllDotsWhere,
  newBulkDots,
  sendDotsSocketUpdates,
  sendPriorityMissingCountUpdates,
} from './helpers';
import { CloneDotDto, GetDotsByEventDto, UploadDotsDto } from './dto';

jest.mock('@ontrack-tech-group/common/helpers', () => ({
  throwCatchError: jest.fn(),
  checkIfDuplicateExist: jest.fn(),
  withCompanyScope: jest.fn(),
}));

jest.mock('@ontrack-tech-group/common/models', () => ({
  DotMapDot: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
  },
  BaseDeployment: {
    create: jest.fn(),
  },
  DotMapVendor: {
    findAll: jest.fn(),
  },
}));

jest.mock('./helpers', () => ({
  getCreatedAssociations: jest.fn(),
  sendDotsSocketUpdates: jest.fn(),
  sendPriorityMissingCountUpdates: jest.fn(),
  newBulkDots: jest.fn(),
  dotsResponseForClone: jest.fn(),
  getAllDotsWhere: jest.fn(),
  bulkCreateDotsHelper: jest.fn(),
}));

jest.mock('@Common/helpers', () => ({
  getArrayInChunks: jest.fn(),
  calculateTotalShiftHours: jest.fn(),
}));

jest.mock('@Modules/vendor/helper', () => ({
  sendBudgetSummarySocket: jest.fn(),
  budgetSummaryhelper: jest.fn(),
  getVendorsListByEvent: jest.fn(),
}));

describe('DotService', () => {
  let dotService: DotService;
  let pusherService: PusherService;
  let sequelize: Sequelize;

  const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn(),
  };

  const mockUser = userFixture.create();
  const mockArea = areaFixture();
  const mockPosition = positionFixture();
  const mockPositionName = positionNameFixture();
  const mockVendor = dotMapVendorFixture();

  const mockDot1 = dotMapDotFixture();
  const mockDot2 = dotMapDotFixture();

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mockValue'),
  };

  const mockPusherService = {
    trigger: jest.fn(),
  };

  const mockShiftService = {
    bulkShiftsCreate: jest.fn(),
    getAllShifts: jest.fn(),
    getAllShiftsRates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DotService,
        {
          provide: Sequelize,
          useValue: {
            transaction: jest.fn().mockResolvedValue(mockTransaction),
            query: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ShiftService,
          useValue: mockShiftService,
        },
        {
          provide: PusherService,
          useValue: mockPusherService,
        },
      ],
    }).compile();

    dotService = module.get<DotService>(DotService);
    pusherService = module.get<PusherService>(PusherService);
    sequelize = module.get<Sequelize>(Sequelize);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadDots', () => {
    it('should throw BadRequestException if duplicate pos_id exists', async () => {
      const uploadDotsDto: UploadDotsDto = {
        event_id: 123,
        base_deployment: true,
        dots: [
          {
            pos_id: 'POS-001',
            vendor: 'Vendor 1',
            area: 'Area 1',
            position_name: 'Position Name 1',
            position: 'Position 1',
            priority: true,
            shifts: [
              {
                start_date: '2024-10-16T11:39:00Z',
                end_date: '2024-10-16T19:39:00Z',
                rate: 100,
                quantity: 5,
              },
            ],
          },
        ],
        url: 'http://example.com/file.csv',
        file_name: 'file.csv',
      };

      (checkIfDuplicateExist as jest.Mock).mockReturnValue(true);

      await expect(
        dotService.uploadDots(uploadDotsDto, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if pos_ids already exist in database', async () => {
      const uploadDotsDto: UploadDotsDto = {
        event_id: 123,
        base_deployment: true,
        dots: [
          {
            pos_id: 'POS-001',
            vendor: 'Vendor 1',
            area: 'Area 1',
            position_name: 'Position Name 1',
            position: 'Position 1',
            priority: true,
            shifts: [
              {
                start_date: '2024-10-16T11:39:00Z',
                end_date: '2024-10-16T19:39:00Z',
                rate: 100,
                quantity: 5,
              },
            ],
          },
        ],
        url: 'http://example.com/file.csv',
        file_name: 'file.csv',
      };

      (checkIfDuplicateExist as jest.Mock).mockReturnValue(false);
      (DotMapDot.findAll as jest.Mock).mockResolvedValue([
        { pos_id: 'POS-001', event_id: 123 },
      ]);

      await expect(
        dotService.uploadDots(uploadDotsDto, mockUser),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new dots and commit transaction', async () => {
      const uploadDotsDto: UploadDotsDto = {
        event_id: 123,
        base_deployment: true,
        dots: [
          {
            pos_id: 'POS-001',
            vendor: 'Vendor 1',
            area: 'Area 1',
            position_name: 'Position Name 1',
            position: 'Position 1',
            priority: true,
            shifts: [
              {
                start_date: '2024-10-16T11:39:00Z',
                end_date: '2024-10-16T19:39:00Z',
                rate: 100,
                quantity: 5,
              },
            ],
          },
        ],
        url: 'http://example.com/file.csv',
        file_name: 'file.csv',
      };

      const mockAssociations = {
        allAreas: [mockArea],
        allPositionNames: [mockPositionName],
        allPositions: [mockPosition],
        allShifts: {
          'POS-001': [{ id: 1, rate: 100, quantity: 5 }],
        },
        allVendors: [mockVendor],
      };

      (checkIfDuplicateExist as jest.Mock).mockReturnValue(false);
      (DotMapDot.findAll as jest.Mock).mockResolvedValue([]);
      (getVendorsListByEvent as jest.Mock).mockResolvedValue([]);

      await dotService.uploadDots(uploadDotsDto, mockUser);

      expect(DotMapDot.bulkCreate).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(getVendorsListByEvent).toHaveBeenCalled();
    });
  });

  describe('cloneDot', () => {
    it('should clone dots successfully and send updates', async () => {
      const cloneDotDto: CloneDotDto = {
        dot_ids: [mockDot1.id, mockDot2.id],
        event_id: 123,
        quantity: 3,
      };

      const dots = [
        {
          ...mockDot1,
          toJSON: jest.fn().mockReturnValue({
            ...mockDot1,
          }),
        },
        {
          ...mockDot2,
          toJSON: jest.fn().mockReturnValue({
            ...mockDot2,
          }),
        },
      ];

      const clonedDots = [
        { ...mockDot1, pos_id: 'POS-101' },
        { ...mockDot2, pos_id: 'POS-102' },
      ];

      const bulkCreatedDots = [
        { ...mockDot1, id: 101, pos_id: 'POS-101' },
        { ...mockDot2, id: 102, pos_id: 'POS-102' },
      ];

      // Mock the methods
      (DotMapDot.findAll as jest.Mock).mockResolvedValue(dots);
      (newBulkDots as jest.Mock).mockResolvedValue(clonedDots);
      (DotMapDot.bulkCreate as jest.Mock).mockResolvedValue(bulkCreatedDots);
      (dotsResponseForClone as jest.Mock).mockResolvedValue(bulkCreatedDots);
      (getArrayInChunks as jest.Mock).mockReturnValue([bulkCreatedDots]);

      await dotService.cloneDot(cloneDotDto, mockUser);

      // Expectations
      expect(withCompanyScope).toHaveBeenCalledWith(
        mockUser,
        cloneDotDto.event_id,
      );

      expect(DotMapDot.findAll).toHaveBeenCalledWith({
        where: {
          id: { [Op.in]: cloneDotDto.dot_ids },
          event_id: cloneDotDto.event_id,
        },
        attributes: {
          exclude: [
            'id',
            'location',
            'updated_at',
            'created_at',
            'placed',
            'missing',
          ],
        },
        include: [
          {
            model: DotShift,
            attributes: {
              exclude: ['id', 'dot_id', 'created_at', 'updated_at'],
            },
            required: false,
          },
        ],
      });

      expect(newBulkDots).toHaveBeenCalledWith(
        dots.map((dot) => dot.toJSON()),
        cloneDotDto.quantity,
      );

      expect(DotMapDot.bulkCreate).toHaveBeenCalledWith(clonedDots, {
        include: [{ association: 'dot_shifts' }],
      });

      expect(getArrayInChunks).toHaveBeenCalledWith(bulkCreatedDots, 4);

      expect(sendDotsSocketUpdates).toHaveBeenCalled();

      expect(sendBudgetSummarySocket).toHaveBeenCalled();

      expect(sendPriorityMissingCountUpdates).toHaveBeenCalledWith(
        cloneDotDto.event_id,
        pusherService,
      );
    });

    it('should throw NotFoundException if some dots are missing', async () => {
      const cloneDotDto: CloneDotDto = {
        dot_ids: [1, 2],
        event_id: 123,
        quantity: 3,
      };

      const dots = [
        {
          id: 1,
          toJSON: jest.fn().mockReturnValue({
            id: 1,
            pos_id: 'POS-001',
            shifts: [],
          }),
        },
      ];

      // Mock findAll to return only 1 dot, though we asked for 2 (dot_ids [1, 2])
      (DotMapDot.findAll as jest.Mock).mockResolvedValue(dots);

      // Expect the service to throw a NotFoundException
      await expect(dotService.cloneDot(cloneDotDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );

      expect(withCompanyScope).toHaveBeenCalledWith(
        mockUser,
        cloneDotDto.event_id,
      );

      expect(DotMapDot.findAll).toHaveBeenCalledWith({
        where: {
          id: { [Op.in]: cloneDotDto.dot_ids },
          event_id: cloneDotDto.event_id,
        },
        attributes: {
          exclude: [
            'id',
            'location',
            'updated_at',
            'created_at',
            'placed',
            'missing',
          ],
        },
        include: [
          {
            model: DotShift,
            attributes: {
              exclude: ['id', 'dot_id', 'created_at', 'updated_at'],
            },
            required: false,
          },
        ],
      });
    });
  });

  describe('getAllDotsByEvent', () => {
    it('should return empty array grouped by area with timezone', async () => {
      const getDotsByEventDto: GetDotsByEventDto = {
        event_id: 123,
        group_by: DotsGroupBy.AREA,
        dates: [new Date('2024-09-03')],
      };

      const dots = [
        { get: jest.fn().mockReturnValue(mockDot1) },
        { get: jest.fn().mockReturnValue(mockDot2) },
      ];

      const mockGroupedData = [{ result: [{ vendors: [] }] }];
      const mockTimezone = 'UTC';

      // Mock withCompanyScope
      (withCompanyScope as jest.Mock).mockResolvedValue([1, 1, mockTimezone]);

      // Mock DotMapDot.findAll
      (DotMapDot.findAll as jest.Mock).mockResolvedValue(dots);

      // Mock Sequelize.query
      (sequelize.query as jest.Mock).mockResolvedValue(mockGroupedData);

      // Mock getAllDotsWhere
      (getAllDotsWhere as jest.Mock).mockReturnValue({
        event_id: getDotsByEventDto.event_id,
      });

      const result = await dotService.getAllDotsByEvent(
        getDotsByEventDto,
        mockUser,
      );

      // Expectations
      expect(withCompanyScope).toHaveBeenCalledWith(
        mockUser,
        getDotsByEventDto.event_id,
      );

      expect(DotMapDot.findAll).toHaveBeenCalledWith({
        where: { event_id: getDotsByEventDto.event_id },
        attributes: {
          exclude: commonExcludeAttributes,
          include: commonIncludeAttributes,
        },
        include: commonIncludes,
        group: commonGroupBy,
      });

      expect(sequelize.query).toHaveBeenCalledWith(
        `SELECT getFormattedDotsByArea(:jsonInput::jsonb) AS result`,
        {
          replacements: {
            jsonInput: JSON.stringify([mockDot1, mockDot2]),
          },
          type: QueryTypes.SELECT,
        },
      );

      expect(result).toEqual({
        vendors: [{ vendors: [] }],
        timezone: mockTimezone,
      });
    });

    it('should return dots grouped by position with timezone', async () => {
      const getDotsByEventDto: GetDotsByEventDto = {
        event_id: 123,
        group_by: DotsGroupBy.POSITION,
        dates: [new Date('2024-09-03')],
      };

      const dots = [
        { get: jest.fn().mockReturnValue(mockDot1) },
        { get: jest.fn().mockReturnValue(mockDot2) },
      ];

      const mockGroupedData = [{ result: [{ vendors: [] }] }];
      const mockTimezone = 'UTC';

      // Mock withCompanyScope
      (withCompanyScope as jest.Mock).mockResolvedValue([1, 1, mockTimezone]);

      // Mock DotMapDot.findAll
      (DotMapDot.findAll as jest.Mock).mockResolvedValue(dots);

      // Mock Sequelize.query
      (sequelize.query as jest.Mock).mockResolvedValue(mockGroupedData);

      // Mock getAllDotsWhere
      (getAllDotsWhere as jest.Mock).mockReturnValue({
        event_id: getDotsByEventDto.event_id,
      });

      const result = await dotService.getAllDotsByEvent(
        getDotsByEventDto,
        mockUser,
      );

      // Expectations
      expect(withCompanyScope).toHaveBeenCalledWith(
        mockUser,
        getDotsByEventDto.event_id,
      );

      expect(DotMapDot.findAll).toHaveBeenCalledWith({
        where: { event_id: getDotsByEventDto.event_id },
        attributes: {
          exclude: commonExcludeAttributes,
          include: commonIncludeAttributes,
        },
        include: commonIncludes,
        group: commonGroupBy,
      });

      expect(sequelize.query).toHaveBeenCalledWith(
        `SELECT getFormattedDotsByPosition(:jsonInput::jsonb) AS result`,
        {
          replacements: {
            jsonInput: JSON.stringify([mockDot1, mockDot2]),
          },
          type: QueryTypes.SELECT,
        },
      );

      expect(result).toEqual({
        vendors: [{ vendors: [] }],
        timezone: mockTimezone,
      });
    });

    it('should return dots grouped by area with timezone', async () => {
      const getDotsByEventDto: GetDotsByEventDto = {
        event_id: 123,
        group_by: DotsGroupBy.AREA,
        dates: [new Date('2024-09-03')],
      };

      const mockResponseData = [
        {
          id: 2,
          name: 'IIIS',
          areas: [
            {
              id: 3,
              name: 'Gate 1',
              positions: [
                {
                  id: 8,
                  name: 'Guard',
                  dots: [
                    {
                      id: 43,
                      pos_id: 'MMM-0002',
                      vendor: { id: 2, name: 'IIIS', color: '#27b5f2' },
                      avg_rate: 38,
                      total_rate: 190,
                      total_staff: 5,
                      dot_shifts: [
                        {
                          id: 60,
                          name: '8/23 Friday 5:00 PM',
                          rate: 50,
                          staff: 2,
                          start_date: '2024-08-23T12:00:00.000Z',
                          end_date: '2024-08-23T19:00:00.000Z',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          color: '#27b5f2',
        },
      ];

      const dots = [
        { get: jest.fn().mockReturnValue(mockDot1) },
        { get: jest.fn().mockReturnValue(mockDot2) },
      ];

      const mockGroupedData = [{ result: [{ vendors: mockResponseData }] }];
      const mockTimezone = 'UTC';

      // Mock withCompanyScope
      (withCompanyScope as jest.Mock).mockResolvedValue([1, 1, mockTimezone]);

      // Mock DotMapDot.findAll
      (DotMapDot.findAll as jest.Mock).mockResolvedValue(dots);

      // Mock Sequelize.query
      (sequelize.query as jest.Mock).mockResolvedValue(mockGroupedData);

      // Mock getAllDotsWhere
      (getAllDotsWhere as jest.Mock).mockReturnValue({
        event_id: getDotsByEventDto.event_id,
      });

      const result = await dotService.getAllDotsByEvent(
        getDotsByEventDto,
        mockUser,
      );

      // Expectations
      expect(withCompanyScope).toHaveBeenCalledWith(
        mockUser,
        getDotsByEventDto.event_id,
      );

      expect(DotMapDot.findAll).toHaveBeenCalledWith({
        where: { event_id: getDotsByEventDto.event_id },
        attributes: {
          exclude: commonExcludeAttributes,
          include: commonIncludeAttributes,
        },
        include: commonIncludes,
        group: commonGroupBy,
      });

      expect(sequelize.query).toHaveBeenCalledWith(
        `SELECT getFormattedDotsByArea(:jsonInput::jsonb) AS result`,
        {
          replacements: {
            jsonInput: JSON.stringify([mockDot1, mockDot2]),
          },
          type: QueryTypes.SELECT,
        },
      );

      expect(result).toEqual({
        vendors: [{ vendors: mockResponseData }],
        timezone: mockTimezone,
      });
    });
  });
});
