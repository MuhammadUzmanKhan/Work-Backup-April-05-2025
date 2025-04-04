import { Module } from '@nestjs/common';
import { ExtensionReleasesController } from './extension-releases.controller';
import { ExtensionReleasesService } from './extension-releases.service';

@Module({
  controllers: [ExtensionReleasesController],
  providers: [ExtensionReleasesService],
  exports: [ExtensionReleasesService],
})
export class ExtensionReleasesModule { }
