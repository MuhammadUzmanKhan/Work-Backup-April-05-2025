import { forwardRef, Module } from '@nestjs/common';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';
import { DatabaseModule } from 'src/common/database/database.module';

@Module({
  imports: [forwardRef(() => DatabaseModule)],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
  exports: [ConfigurationsService]
})
export class ConfigurationsModule { }
