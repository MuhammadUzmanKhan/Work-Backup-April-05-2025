import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
dotenv.config();

@Module({
  imports: [],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
