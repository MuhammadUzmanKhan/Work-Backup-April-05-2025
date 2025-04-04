import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IncidentFormService } from './incident-form.service';
import { IncidentFormController } from './incident-form.controller';

@Module({
  imports: [HttpModule],
  controllers: [IncidentFormController],
  providers: [IncidentFormService],
})
export class IncidentFormModule {}
