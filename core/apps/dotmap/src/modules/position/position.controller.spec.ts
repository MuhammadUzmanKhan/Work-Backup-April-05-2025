import { Test, TestingModule } from '@nestjs/testing';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { NameCompanyDto } from '@Common/dto';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';

describe('PositionController', () => {
  let controller: PositionController;
  let service: PositionService;

  const mockUser = userFixture.create();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionController],
      providers: [
        {
          provide: PositionService,
          useValue: {
            getAllPositions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PositionController>(PositionController);
    service = module.get<PositionService>(PositionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllPositions', () => {
    it('should call positionService.getAllPositions with correct parameters', async () => {
      const nameCompanyDto = new NameCompanyDto();
      const serviceSpy = jest
        .spyOn(service, 'getAllPositions')
        .mockResolvedValue([]);

      await controller.getAllPositions(nameCompanyDto, mockUser);

      expect(serviceSpy).toHaveBeenCalledWith(nameCompanyDto, mockUser);
    });
  });
});
