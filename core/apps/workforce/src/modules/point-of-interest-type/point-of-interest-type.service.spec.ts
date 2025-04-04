import { Test, TestingModule } from '@nestjs/testing';
import { PointOfInterestTypeService } from './point-of-interest-type.service';

describe('PointOfInterestTypeService', () => {
  let service: PointOfInterestTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointOfInterestTypeService],
    }).compile();

    service = module.get<PointOfInterestTypeService>(
      PointOfInterestTypeService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
