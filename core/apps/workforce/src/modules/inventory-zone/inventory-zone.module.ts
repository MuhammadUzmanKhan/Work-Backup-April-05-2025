import { Module } from '@nestjs/common';
import { InventoryZoneService } from './inventory-zone.service';
import { InventoryZoneController } from './inventory-zone.controller';

@Module({
  controllers: [InventoryZoneController],
  providers: [InventoryZoneService],
})
export class InventoryZoneModule {}
