import { Module } from '@nestjs/common';

import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { VendorV2Controller } from './vendor.v2.controller';
import { VendorV2Service } from './vendor.v2.service';

@Module({
  controllers: [VendorController, VendorV2Controller],
  providers: [VendorService, VendorV2Service],
})
export class VendorModule {}
