import { Controller, Post, Body, UseGuards, Req, Put } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreateCustomerDto } from './dto/createCustomer.dto';
import { CreateSubscriptionDto } from './dto/createSubscription.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ROLES } from 'src/common/constants/roles';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { Request } from 'express';
import { Public } from 'src/common/decorators/public.meta';
import { updatePaymentMethodDto } from './dto/updatePaymentMethod.dto';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) { }

  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.OWNER))
  @Post('customers')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.stripeService.createCustomer(createCustomerDto);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.OWNER))
  @Put('payment-method')
  async updatePaymentMethod(
    @AuthUser() user: Users,
    @Body() updatePaymentMethodDto: updatePaymentMethodDto
  ) {
    return this.stripeService.updatePaymentMethod(user, updatePaymentMethodDto);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.OWNER))
  @Post('subscriptions')
  async createSubscription(
    @AuthUser() user: Users,
    @Body() createSubscriptionDto: CreateSubscriptionDto
  ) {
    return this.stripeService.createSubscription(user.id, createSubscriptionDto);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.OWNER))
  @Post('cancel-subscription')
  async cancelSubscription(
    @AuthUser() user: Users
  ) {
    return this.stripeService.cancelSubscription(user);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.OWNER))
  @Post('reactive-subscription')
  async reactivateSubscription(
    @AuthUser() user: Users
  ) {
    return this.stripeService.reactivateSubscription(user);
  }

  @Public()
  @Post('intent-success-webhook')
  async intentSuccessWebhook(
    @Req() req: Request
  ) {
    return this.stripeService.paymentSuccessWebhook(req);
  }

  @ApiBearerAuth()
  @UseGuards(RoleGuard(ROLES.OWNER))
  @Post('manual-pay')
  async manualPayForPlan(
    @AuthUser() user: Users
  ) {
    return this.stripeService.manualPayForPlan(user);
  }

}
