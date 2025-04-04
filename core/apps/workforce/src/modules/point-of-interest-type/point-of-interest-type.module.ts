import { Module } from '@nestjs/common';
import { PointOfInterestTypeService } from './point-of-interest-type.service';
import { PointOfInterestTypeController } from './point-of-interest-type.controller';

@Module({
  controllers: [PointOfInterestTypeController],
  providers: [PointOfInterestTypeService],
})
export class PointOfInterestTypeModule {}
