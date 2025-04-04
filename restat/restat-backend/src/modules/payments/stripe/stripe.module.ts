import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../payments.service';

@Module({
    controllers: [StripeController],
    providers: [StripeService, ConfigService, PaymentsService],
    exports: [StripeService],
})
export class StripeModule { }
