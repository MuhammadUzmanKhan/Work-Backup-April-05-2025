import { Module } from '@nestjs/common';

import { VendorPositionService } from './vendor-position.service';
import { VendorPositionController } from './vendor-position.controller';
import { VendorPositionV2Service } from './vendor-position.v2.service';
import { VendorPositionV2Controller } from './vendor-position.v2.controller';

@Module({
  controllers: [VendorPositionController, VendorPositionV2Controller],
  providers: [VendorPositionService, VendorPositionV2Service],
})
export class VendorPositionModule {}
