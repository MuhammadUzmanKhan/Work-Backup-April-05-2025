import { Module } from '@nestjs/common';
import { StripeSubscriptionController } from './stripe-subscriptions.controller';
import { StripeSubscriptionService } from './stripe-subscriptions.service';
import { ConfigService } from '@nestjs/config';

@Module({
    controllers: [StripeSubscriptionController],
    providers: [StripeSubscriptionService, ConfigService]
})
export class StripeSubscriptionModule { }
