import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTypeCategoryController } from './inventory-type-category.controller';
import { InventoryTypeCategoryService } from './inventory-type-category.service';

describe('InventoryTypeCategoryController', () => {
  let controller: InventoryTypeCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryTypeCategoryController],
      providers: [InventoryTypeCategoryService],
    }).compile();

    controller = module.get<InventoryTypeCategoryController>(
      InventoryTypeCategoryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
