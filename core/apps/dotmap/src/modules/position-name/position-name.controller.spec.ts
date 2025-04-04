import { Test, TestingModule } from '@nestjs/testing';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { NameCompanyDto } from '@Common/dto';
import { PositionNameController } from './position-name.controller';
import { PositionNameService } from './position-name.service';

describe('PositionNameController', () => {
  let controller: PositionNameController;
  let service: PositionNameService;

  const mockUser = userFixture.create();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionNameController],
      providers: [
        {
          provide: PositionNameService,
          useValue: {
            getAllPositionNames: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PositionNameController>(PositionNameController);
    service = module.get<PositionNameService>(PositionNameService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllPositionNames', () => {
    it('should call positionNameService.getAllPositionNames with correct parameters', async () => {
      const nameCompanyDto = new NameCompanyDto();
      const serviceSpy = jest
        .spyOn(service, 'getAllPositionNames')
        .mockResolvedValue([]);

      await controller.getAllPositionNames(nameCompanyDto, mockUser);

      expect(serviceSpy).toHaveBeenCalledWith(nameCompanyDto, mockUser);
    });
  });
});
