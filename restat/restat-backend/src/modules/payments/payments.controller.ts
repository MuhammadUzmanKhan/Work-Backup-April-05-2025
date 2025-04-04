import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ROLES } from 'src/common/constants/roles';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentService: PaymentsService) { }

    @ApiBearerAuth()
    @Get('/plans')
    @UseGuards(RoleGuard(ROLES.OWNER))
    public getAllPlans(
    ) {
        return this.paymentService.getAllPlans();
    }

    @ApiBearerAuth()
    @Get('subscription-details')
    @UseGuards(RoleGuard(ROLES.OWNER))
    public getSubscriptionDetails(
        @AuthUser() user: Users,
    ) {
        return this.paymentService.getSubscriptionDetails(user);
    }

    @ApiBearerAuth()
    @Get('invoices')
    @UseGuards(RoleGuard(ROLES.OWNER))
    public getInvoices(
        @AuthUser() user: Users,
    ) {
        return this.paymentService.getInvoices(user);
    }

    @ApiBearerAuth()
    @Get('invoices/:id')
    @UseGuards(RoleGuard(ROLES.OWNER))
    public getInvoiceDetails(
        @Param('id') id: string,
        @AuthUser() user: Users,
    ) {
        return this.paymentService.getInvoiceDetails(user, id);
    }

    @ApiBearerAuth()
    @Post('/start-trial')
    @UseGuards(RoleGuard(ROLES.OWNER))
    public activateTrial(
        @AuthUser() user: Users,
    ) {
        return this.paymentService.startTrial(user);
    }

}
