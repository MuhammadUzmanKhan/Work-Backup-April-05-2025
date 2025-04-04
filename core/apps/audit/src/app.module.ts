import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryMiddleware } from '@ontrack-tech-group/common/interceptors';
import { DatabaseModule } from '@ontrack-tech-group/common/database';
import { AuthModule } from '@ontrack-tech-group/common/services';
import { NoteModule } from '@Modules/note/note.module';

import { VendorModule } from './modules/vendor/vendor.module';
import { ShiftModule } from './modules/shift/shift.module';
import { StaffModule } from './modules/staff/staff.module';
import { VendorPositionModule } from './modules/vendor-position/vendor-position.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    AuthModule,
    VendorModule,
    ShiftModule,
    StaffModule,
    VendorPositionModule,
    NoteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SentryMiddleware).forRoutes('*');
  }
}
