import { Test, TestingModule } from '@nestjs/testing';
import { DotController } from './dot.controller';
import { DotService } from './dot.service';
import {
  UploadDotsDto,
  CloneDotDto,
  GetDotsByEventDto,
  UpdateDotDto,
  BulkDotsDeleteDto,
} from './dto';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { DotsGroupBy } from '@Common/constants/enums';
import { dotMapDotFixture } from './dot.fixture';

describe('DotController', () => {
  let controller: DotController;
  let dotService: DotService;

  const mockUser = userFixture.create();

  const mockDot = dotMapDotFixture();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DotController],
      providers: [
        {
          provide: DotService,
          useValue: {
            uploadDots: jest.fn(),
            cloneDot: jest.fn(),
            getAllDotsByEvent: jest.fn(),
            checkIfAnyDotExist: jest.fn(),
            updateDot: jest.fn(),
            deleteBulkDot: jest.fn(),
            deleteDot: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DotController>(DotController);
    dotService = module.get<DotService>(DotService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  describe('uploadDots', () => {
    it('should call dotService.uploadDots with correct parameters', async () => {
      const uploadDotsDto: UploadDotsDto = {
        event_id: 123,
        base_deployment: true,
        dots: [
          {
            pos_id: '',
            vendor: '',
            position: '',
            position_name: '',
            area: '',
            priority: true,
            shifts: [
              {
                start_date: '',
                end_date: '',
                rate: 20,
                quantity: 2,
              },
              {
                start_date: '',
                end_date: '',
                rate: 30,
                quantity: 1,
              },
            ],
          },
        ],
        url: '',
        file_name: '',
      };
      await controller.uploadDots(uploadDotsDto, mockUser);

      expect(dotService.uploadDots).toHaveBeenCalledWith(
        uploadDotsDto,
        mockUser,
      );
    });
  });

  describe('cloneDot', () => {
    it('should call dotService.cloneDot with correct parameters', async () => {
      const cloneDotDto: CloneDotDto = {
        event_id: 123,
        dot_ids: [1],
        quantity: 2,
      };

      await controller.cloneDot(cloneDotDto, mockUser);

      expect(dotService.cloneDot).toHaveBeenCalledWith(cloneDotDto, mockUser);
    });
  });

  describe('getAllDotsByEvent', () => {
    it('should call dotService.getAllDotsByEvent with correct parameters', async () => {
      const getDotsByEventDto: GetDotsByEventDto = {
        event_id: 123,
        group_by: DotsGroupBy.AREA,
        dates: [new Date('2024-09-03')],
      };

      await controller.getAllDotsByEvent(getDotsByEventDto, mockUser);

      expect(dotService.getAllDotsByEvent).toHaveBeenCalledWith(
        getDotsByEventDto,
        mockUser,
      );
    });
  });

  describe('checkIfAnyDotExist', () => {
    it('should call dotService.checkIfAnyDotExist with correct event_id', async () => {
      const eventIdQueryDto: EventIdQueryDto = { event_id: 123 };

      await controller.checkIfAnyDotExist(eventIdQueryDto);

      expect(dotService.checkIfAnyDotExist).toHaveBeenCalledWith(123);
    });
  });

  describe('updateDot', () => {
    it('should call dotService.updateDot with correct parameters', async () => {
      const pathParamIdDto: PathParamIdDto = { id: 1 };
      const updateDotDto: UpdateDotDto = {
        ...mockDot,
        location: {
          latitude: mockDot.location.lat,
          longitude: mockDot.location.lng,
        },
        position_name: '',
        shifts: [
          {
            dot_shift_id: 261,
            rate: 10,
            shift_id: 61,
            staff: 4,
          },
          {
            rate: 60,
            shift_id: 59,
            staff: 2,
          },
        ],
      };

      await controller.updateDot(pathParamIdDto, updateDotDto, mockUser);

      expect(dotService.updateDot).toHaveBeenCalledWith(
        1,
        updateDotDto,
        mockUser,
      );
    });
  });

  describe('deleteBulkDot', () => {
    it('should call dotService.deleteBulkDot with correct parameters', async () => {
      const bulkDotsDeleteDto: BulkDotsDeleteDto = {
        event_id: 123,
        dot_ids: [1, 2],
      };

      await controller.deleteBulkDot(bulkDotsDeleteDto, mockUser);

      expect(dotService.deleteBulkDot).toHaveBeenCalledWith(
        bulkDotsDeleteDto,
        mockUser,
      );
    });
  });

  describe('deleteDot', () => {
    it('should call dotService.deleteDot with correct parameters', async () => {
      const pathParamIdDto: PathParamIdDto = { id: 1 };
      const eventIdQueryDto: EventIdQueryDto = { event_id: 123 };

      await controller.deleteDot(pathParamIdDto, eventIdQueryDto, mockUser);

      expect(dotService.deleteDot).toHaveBeenCalledWith(1, 123, mockUser);
    });
  });
});
