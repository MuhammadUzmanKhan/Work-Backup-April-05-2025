import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@ontrack-tech-group/common/models';
import {
  EventIdQueryDto,
  PathParamIdDto,
} from '@ontrack-tech-group/common/dto';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import {
  RESPONSES,
  SortBy,
  StatusFilter,
} from '@ontrack-tech-group/common/constants';
import { ReportingFrequency } from '@Common/constants';
import { PresetController } from './preset.controller';
import { PresetService } from './preset.service';
import { CreatePresetDto, GetAllPresetDto, UpdatePresetDto } from './dto';

describe('PresetController', () => {
  let controller: PresetController;
  let service: PresetService;

  const mockUser: User = userFixture.create();

  const mockPresetService = {
    createPreset: jest.fn(),
    sendEmail: jest.fn(),
    getAllPresets: jest.fn(),
    getAllPresetNames: jest.fn(),
    getPresetById: jest.fn(),
    pinPreset: jest.fn(),
    updatePreset: jest.fn(),
    deletePreset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresetController],
      providers: [
        {
          provide: PresetService,
          useValue: mockPresetService,
        },
      ],
    }).compile();

    controller = module.get<PresetController>(PresetController);
    service = module.get<PresetService>(PresetService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPreset', () => {
    it('should call PresetService.createPreset with the correct parameters', async () => {
      const dto: CreatePresetDto = {
        name: 'Test Preset',
        event_id: 1,
        email: 'test@example.com',
        frequency: ReportingFrequency.EVERY_DAY,
        pdf: true,
        csv: false,
        buffer: 0,
        export_time: '12:00:00',
        filters: {
          date: {
            start_date: '2024-01-01T00:00:00.000Z',
            end_date: '2024-01-31T00:00:00.000Z',
          },
          status: [StatusFilter.OPEN],
        },
      };

      const result = { id: 1, ...dto };
      jest.spyOn(service, 'createPreset').mockResolvedValue(result);

      expect(await controller.createPreset(dto, mockUser)).toEqual(result);
      expect(service.createPreset).toHaveBeenCalledWith(dto, mockUser);
    });
  });

  describe('sendEmail', () => {
    it('should call PresetService.sendEmail with the correct parameters', async () => {
      const dto: PathParamIdDto = { id: 1 };
      jest.spyOn(service, 'sendEmail').mockResolvedValue('Email sent');

      expect(await controller.sendEmail(dto, mockUser)).toEqual('Email sent');
      expect(service.sendEmail).toHaveBeenCalledWith(dto.id, mockUser);
    });
  });

  describe('getAllPresets', () => {
    it('should call PresetService.getAllPresets with the correct parameters', async () => {
      const query: GetAllPresetDto = {
        event_id: 1,
        keyword: 'name',
        order: SortBy.ASC,
      };
      const result = [{ id: 1, name: 'Test Preset' }];
      jest.spyOn(service, 'getAllPresets').mockResolvedValue(result);

      expect(await controller.getAllPresets(query, mockUser)).toEqual(result);
      expect(service.getAllPresets).toHaveBeenCalledWith(query, mockUser);
    });
  });

  describe('getPresetById', () => {
    it('should call PresetService.getPresetById with the correct parameters', async () => {
      const dto: PathParamIdDto = { id: 1 };
      const query: EventIdQueryDto = { event_id: 1 };
      const result = { id: 1, name: 'Test Preset' };
      jest.spyOn(service, 'getPresetById').mockResolvedValue(result);

      expect(await controller.getPresetById(dto, query, mockUser)).toEqual(
        result,
      );
      expect(service.getPresetById).toHaveBeenCalledWith(
        dto.id,
        query.event_id,
        mockUser,
      );
    });
  });

  describe('updatePreset', () => {
    it('should call PresetService.updatePreset with the correct parameters', async () => {
      const dto: UpdatePresetDto = { name: 'Updated Preset' };
      const param: PathParamIdDto = { id: 1 };
      const result = { id: 1, ...dto };
      jest.spyOn(service, 'updatePreset').mockResolvedValue(result);

      expect(await controller.updatePreset(param, dto, mockUser)).toEqual(
        result,
      );
      expect(service.updatePreset).toHaveBeenCalledWith(
        param.id,
        dto,
        mockUser,
      );
    });
  });

  describe('deletePreset', () => {
    it('should call PresetService.deletePreset with the correct parameters', async () => {
      const dto: PathParamIdDto = { id: 1 };
      const result = { message: RESPONSES.destroyedSuccessfully('Preset') };
      jest.spyOn(service, 'deletePreset').mockResolvedValue(result);

      expect(await controller.deletePreset(dto, mockUser)).toEqual(result);
      expect(service.deletePreset).toHaveBeenCalledWith(dto.id, mockUser);
    });
  });
});
