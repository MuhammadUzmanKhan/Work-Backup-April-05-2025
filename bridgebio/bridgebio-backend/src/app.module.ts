import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { DatabaseModule } from '@common/database/database.module';
import { MedicinesModule } from './modules/medicine/medicine.module';
import { StrategyAndTreatmentModule } from './modules/strategy-and-treatment/strategy-and-treatment.module';

@Module({
    imports: [
        DatabaseModule,
        ConfigModule.forRoot({
            isGlobal: true
        }),
        AuthModule,
        UsersModule,
        MedicinesModule,
        StrategyAndTreatmentModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule { }
