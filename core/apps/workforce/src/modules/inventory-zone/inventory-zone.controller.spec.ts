import { Test, TestingModule } from '@nestjs/testing';
import { InventoryZoneController } from './inventory-zone.controller';
import { InventoryZoneService } from './inventory-zone.service';

describe('InventoryZoneController', () => {
  let controller: InventoryZoneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryZoneController],
      providers: [InventoryZoneService],
    }).compile();

    controller = module.get<InventoryZoneController>(InventoryZoneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
