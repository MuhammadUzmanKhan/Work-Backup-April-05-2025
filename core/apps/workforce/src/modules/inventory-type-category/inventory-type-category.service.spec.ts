import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTypeCategoryService } from './inventory-type-category.service';

describe('InventoryTypeCategoryService', () => {
  let service: InventoryTypeCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryTypeCategoryService],
    }).compile();

    service = module.get<InventoryTypeCategoryService>(
      InventoryTypeCategoryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
