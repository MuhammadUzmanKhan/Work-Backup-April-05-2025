import { Test, TestingModule } from '@nestjs/testing';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { NameCompanyDto } from '@Common/dto';
import { AreaController } from './area.controller';
import { AreaService } from './area.service';

describe('AreaController', () => {
  let controller: AreaController;
  let service: AreaService;

  const mockUser = userFixture.create();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaController],
      providers: [
        {
          provide: AreaService,
          useValue: {
            getAllAreas: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AreaController>(AreaController);
    service = module.get<AreaService>(AreaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllAreas', () => {
    it('should call areaService.getAllAreas with correct parameters', async () => {
      const nameCompanyDto = new NameCompanyDto();
      const serviceSpy = jest
        .spyOn(service, 'getAllAreas')
        .mockResolvedValue([]);

      await controller.getAllAreas(nameCompanyDto, mockUser);

      expect(serviceSpy).toHaveBeenCalledWith(nameCompanyDto, mockUser);
    });
  });
});
