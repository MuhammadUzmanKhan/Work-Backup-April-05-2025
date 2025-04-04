import { Test, TestingModule } from '@nestjs/testing';
import { InventoryZoneService } from './inventory-zone.service';

describe('InventoryZoneService', () => {
  let service: InventoryZoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryZoneService],
    }).compile();

    service = module.get<InventoryZoneService>(InventoryZoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
