import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTypeService } from './inventory-type.service';

describe('InventoryTypeService', () => {
  let service: InventoryTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryTypeService],
    }).compile();

    service = module.get<InventoryTypeService>(InventoryTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
