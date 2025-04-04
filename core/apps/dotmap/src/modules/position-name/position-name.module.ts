import { Module } from '@nestjs/common';
import { PositionNameService } from './position-name.service';
import { PositionNameController } from './position-name.controller';

@Module({
  controllers: [PositionNameController],
  providers: [PositionNameService],
  exports: [PositionNameService],
})
export class PositionNameModule {}
