import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { v2 } from '@google-cloud/translate';
import {
  ChangeLogModule,
  PusherService,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { IncidentTypeManagement } from './type-management.service';
import { IncidentTypeManagementController } from './type-management.controller';

@Module({
  imports: [HttpModule, ConfigModule, ChangeLogModule],
  controllers: [IncidentTypeManagementController],
  providers: [
    IncidentTypeManagement,
    PusherService,
    {
      provide: 'TRANSLATE',
      useFactory: () => {
        return new v2.Translate({
          key: process.env.GOOGLE_TRANSLATE_KEY,
        });
      },
    },
    TranslateService,
  ],
  exports: [IncidentTypeManagement],
})
export class IncidentTypeManagementModule {}
