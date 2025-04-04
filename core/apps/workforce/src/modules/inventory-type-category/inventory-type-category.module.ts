import { Module } from '@nestjs/common';
import { InventoryTypeCategoryService } from './inventory-type-category.service';
import { InventoryTypeCategoryController } from './inventory-type-category.controller';

@Module({
  controllers: [InventoryTypeCategoryController],
  providers: [InventoryTypeCategoryService],
})
export class InventoryTypeCategoryModule {}
