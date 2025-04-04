import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTypeController } from './inventory-type.controller';
import { InventoryTypeService } from './inventory-type.service';

describe('InventoryTypeController', () => {
  let controller: InventoryTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryTypeController],
      providers: [InventoryTypeService],
    }).compile();

    controller = module.get<InventoryTypeController>(InventoryTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
