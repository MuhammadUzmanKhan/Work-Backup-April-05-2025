import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { StripeSubscriptionService } from './stripe-subscriptions.service';
import { CreateCustomerDto } from './dto/createCustomer.dto';
import { CreateSubscriptionDto } from './dto/createSubscription.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ROLES } from 'src/common/constants/roles';

@Controller('stripe')
export class StripeSubscriptionController {
  constructor(private readonly stripeSubscriptionService: StripeSubscriptionService) {}
  
  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  @Post('create-customer')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.stripeSubscriptionService.createCustomer(createCustomerDto);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  @Post('create-subscription')
  async createSubscription(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.stripeSubscriptionService.createSubscription(createSubscriptionDto);
  }
}
