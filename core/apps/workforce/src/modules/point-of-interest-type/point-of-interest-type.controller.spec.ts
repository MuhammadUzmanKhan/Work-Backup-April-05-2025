import { Test, TestingModule } from '@nestjs/testing';
import { PointOfInterestTypeController } from './point-of-interest-type.controller';
import { PointOfInterestTypeService } from './point-of-interest-type.service';

describe('PointOfInterestTypeController', () => {
  let controller: PointOfInterestTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointOfInterestTypeController],
      providers: [PointOfInterestTypeService],
    }).compile();

    controller = module.get<PointOfInterestTypeController>(
      PointOfInterestTypeController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
