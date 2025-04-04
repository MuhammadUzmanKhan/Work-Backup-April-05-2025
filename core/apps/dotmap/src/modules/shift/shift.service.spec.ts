import { Test, TestingModule } from '@nestjs/testing';
import { Transaction } from 'sequelize';
import {
  DotMapShift,
  DotShift,
  DotMapDot,
} from '@ontrack-tech-group/common/models';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { ShiftsToCreateInterface } from '@Common/constants';
import { getAllShiftsHelper } from './helpers';
import { ShiftService } from './shift.service';
import { GetAllShifts } from './dto';

// Mock external dependencies
jest.mock('@ontrack-tech-group/common/helpers', () => ({
  withCompanyScope: jest.fn(),
}));

jest.mock('./helpers', () => ({
  getAllShiftsHelper: jest.fn(),
}));

jest.mock('@ontrack-tech-group/common/models', () => ({
  DotMapShift: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
  },
  DotShift: {
    findAll: jest.fn(),
  },
  DotMapDot: jest.fn(),
}));

describe('ShiftService', () => {
  let service: ShiftService;

  const mockUser = userFixture.create();
  const mockGetAllShifts = new GetAllShifts();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShiftService],
    }).compile();

    service = module.get<ShiftService>(ShiftService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllShifts', () => {
    it('should call DotMapShift.findAll with correct parameters', async () => {
      const mockShifts = [
        {
          id: 1,
          name: 'Shift 1',
          start_date: '2023-01-01',
          end_date: '2023-01-02',
        },
      ];

      (withCompanyScope as jest.Mock).mockResolvedValue(true);
      (DotMapShift.findAll as jest.Mock).mockResolvedValue(mockShifts);

      mockGetAllShifts.event_id = 123;
      mockGetAllShifts.vendor_id = 456;

      const result = await service.getAllShifts(mockGetAllShifts, mockUser);

      expect(withCompanyScope).toHaveBeenCalledWith(
        mockUser,
        mockGetAllShifts.event_id,
      );

      expect(DotMapShift.findAll).toHaveBeenCalledWith({
        where: { event_id: mockGetAllShifts.event_id },
        attributes: ['id', 'name', 'start_date', 'end_date'],
        include: [
          {
            model: DotMapDot,
            where: { vendor_id: mockGetAllShifts.vendor_id },
            attributes: [],
            through: { attributes: [] },
          },
        ],
        order: [['start_date', SortBy.ASC]],
      });

      expect(result).toEqual(mockShifts);
    });
  });

  describe('getAllShiftsRates', () => {
    it('should call DotShift.findAll with correct parameters', async () => {
      const mockRates = [{ rate: 100 }];

      (withCompanyScope as jest.Mock).mockResolvedValue(true);
      (DotShift.findAll as jest.Mock).mockResolvedValue(mockRates);

      mockGetAllShifts.event_id = 123;
      mockGetAllShifts.vendor_id = 456;

      const result = await service.getAllShiftsRates(
        mockGetAllShifts,
        mockUser,
      );

      expect(withCompanyScope).toHaveBeenCalledWith(
        mockUser,
        mockGetAllShifts.event_id,
      );

      expect(DotShift.findAll).toHaveBeenCalledWith({
        attributes: ['rate'],
        include: [
          {
            model: DotMapDot,
            where: {
              event_id: mockGetAllShifts.event_id,
              vendor_id: mockGetAllShifts.vendor_id,
            },
            attributes: [],
          },
        ],
        order: [['rate', SortBy.ASC]],
        group: [`"DotShift"."rate"`],
      });

      expect(result).toEqual(mockRates);
    });
  });

  describe('bulkShiftsCreate', () => {
    it('should create new shifts and return combined shifts', async () => {
      const shiftsToCreate: ShiftsToCreateInterface[] = [
        {
          event_id: 123,
          name: 'Shift 1',
          start_date: '2024-10-16T11:39:00.000Z',
          end_date: '2024-10-16T19:39:00.000Z',
          pos_id: 'pos-id-1',
        },
        {
          event_id: 123,
          name: 'Shift 2',
          start_date: '2024-10-15T04:39:00.000Z',
          end_date: '2024-10-15T15:39:00.000Z',
          pos_id: 'pos-id-2',
        },
      ];
      const transaction = {} as Transaction;

      const alreadyExistShifts = [
        {
          id: 60,
          name: 'Shift 1',
          start_date: new Date('2024-10-16T11:39:00.000Z'),
          end_date: new Date('2024-10-16T19:39:00.000Z'),
          event_id: 123,
        },
      ];

      // getAllShiftsHelper returns Shift 1, but Shift 2 does not exist
      (getAllShiftsHelper as jest.Mock).mockResolvedValue(alreadyExistShifts);

      // Shift 2 will be newly created
      const newShiftsCreated = [
        {
          id: 71,
          name: 'Shift 2',
          start_date: new Date('2024-10-15T04:39:00.000Z'),
          end_date: new Date('2024-10-15T15:39:00.000Z'),
          pos_id: 'pos-id-2',
          event_id: 123,
          get: jest.fn().mockReturnValue({
            id: 71,
            name: 'Shift 2',
            start_date: new Date('2024-10-15T04:39:00.000Z'),
            end_date: new Date('2024-10-15T15:39:00.000Z'),
            pos_id: 'pos-id-2',
            event_id: 123,
          }), // Mocking .get({ plain: true })
        },
      ];

      // Simulate bulk creation of Shift 2
      (DotMapShift.bulkCreate as jest.Mock).mockResolvedValue(newShiftsCreated);

      const result = await service.bulkShiftsCreate(
        shiftsToCreate,
        transaction,
      );

      expect(getAllShiftsHelper).toHaveBeenCalledWith(shiftsToCreate);
      expect(DotMapShift.bulkCreate).toHaveBeenCalledWith([shiftsToCreate[1]], {
        transaction,
      });

      // The result should include both the already existing Shift 1 and the newly created Shift 2
      expect(result).toEqual({
        'pos-id-1': [
          {
            id: 60,
            name: 'Shift 1',
            start_date: '2024-10-16T11:39:00.000Z',
            end_date: '2024-10-16T19:39:00.000Z',
            pos_id: 'pos-id-1',
            event_id: 123,
          },
        ],
        'pos-id-2': [
          {
            id: 71,
            name: 'Shift 2',
            start_date: '2024-10-15T04:39:00.000Z',
            end_date: '2024-10-15T15:39:00.000Z',
            pos_id: 'pos-id-2',
            event_id: 123,
          },
        ],
      });
    });
  });
});
