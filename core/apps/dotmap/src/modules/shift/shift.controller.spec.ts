import { Test, TestingModule } from '@nestjs/testing';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';
import { GetAllShifts } from './dto';
import { DotMapShift, DotShift } from '@ontrack-tech-group/common/models';
import { userFixture } from '@ontrack-tech-group/common/fixtures';

// Mock the ShiftService
jest.mock('./shift.service');

describe('ShiftController', () => {
  let controller: ShiftController;
  let service: ShiftService;

  const mockUser = userFixture.create();
  const mockGetAllShifts = new GetAllShifts();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShiftController],
      providers: [
        {
          provide: ShiftService,
          useValue: {
            getAllShifts: jest.fn(),
            getAllShiftsRates: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ShiftController>(ShiftController);
    service = module.get<ShiftService>(ShiftService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllShifts', () => {
    it('should call shiftService.getAllShifts with correct parameters', async () => {
      const mokeResolvedValue = [
        {
          id: 1,
          name: 'Shift 1',
          start_date: new Date(),
          end_date: new Date(),
        },
      ] as DotMapShift[];
      const serviceSpy = jest
        .spyOn(service, 'getAllShifts')
        .mockResolvedValue(mokeResolvedValue);

      const result = await controller.getAllShifts(mockGetAllShifts, mockUser);

      expect(serviceSpy).toHaveBeenCalledWith(mockGetAllShifts, mockUser);
      expect(result).toEqual(mokeResolvedValue);
    });
  });

  describe('getAllShiftsRates', () => {
    it('should call shiftService.getAllShiftsRates with correct parameters', async () => {
      const serviceSpy = jest
        .spyOn(service, 'getAllShiftsRates')
        .mockResolvedValue([{ rate: 100 }] as DotShift[]);

      const result = await controller.getAllShiftsRates(
        mockGetAllShifts,
        mockUser,
      );

      expect(serviceSpy).toHaveBeenCalledWith(mockGetAllShifts, mockUser);
      expect(result).toEqual([{ rate: 100 }] as DotShift[]);
    });
  });
});
