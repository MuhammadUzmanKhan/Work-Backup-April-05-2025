import { Test, TestingModule } from '@nestjs/testing';

import { CatsService } from './cats.service';
import { ExternalService } from './external.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [catsController],
      providers: [
        CatsService,
        {
          provide: ExternalService,
          useValue: {
            fetchData: jest.fn().mockResolvedValue('Mocked External Cat'),
          },
        },
      ],
    }).compile();

    catsController = module.get<CatsController>(CatsController);
    catsService = module.get<CatsService>(CatsService);
  });

  describe('findAll', () => {
    it('should return an array of cats including external data', async () => {
      const result = ['Cat 1', 'Cat 2', 'Mocked External Cat'];
      jest.spyOn(catsService, 'findAll').mockResolvedValue(result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
