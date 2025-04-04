import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentPlans } from 'src/common/models/payment-plans.model';
import { Subscriptions } from 'src/common/models/subscription.model';
import { Users } from 'src/common/models/users.model';
import { Workspaces } from 'src/common/models/workspaces.model';
import * as moment from 'moment';
import { ConfigService } from '@nestjs/config';
import { Invoices } from 'src/common/models/invoices.model';
import { generateInvoiceNumber } from 'src/common/helpers';
import { Op } from 'sequelize';
import { InvoiceItems } from 'src/common/models/invoice_items.model';
import { BillingCycle, IStripeTransactionData, InvoiceItemNames } from 'src/types/payments';
import { SubscriptionDetails } from 'src/common/models/subscription-details.model';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly configService: ConfigService
    ) { 
        this.isProd = this.configService.get('APP_MODE') === 'prod'
    }
    isProd = false;

    public async getAllPlans() {
        return await PaymentPlans.findAll({
            where: {
                isTrial: false
            },
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            }
        })
    }

    public async getPaymentPlanById(planId: string) {
        return await PaymentPlans.findOne({
            where: {
                id: planId
            },
        })
    }

    public async getSubscriptionDetails(user: Users) {
        const subscription = await Subscriptions.findOne({
            where: {
                workspaceId: user.companyId
            },
            attributes: ['id', 'nextBillingDate', 'isActive', 'billingCycle', 'nextExpectedAmount', 'paidAmount', 'currentPeriodEnd', 'trialEndDate'],
            include: [
                {
                    model: SubscriptionDetails,
                    attributes: ['cardBrand', 'cardLast4', 'cardExpMonth', 'cardExpYear', 'createdAt']
                },
                {
                    model: PaymentPlans,
                    attributes: ['name', 'basePrice', 'isTrial']
                }
            ]
        })

        const activeUsers = await Users.count({
            where: {
                companyId: user.companyId,
            }
        })

        return {
            message: 'Subscription details fetched successfully.',
            subscription,
            activeUsers
        }
    }

    public async getInvoices(user: Users) {
        return await Invoices.findAll({
            where: {
                workspaceId: user.companyId
            },
            attributes: ['id', 'invoiceNo', 'totalAmount', 'createdAt', 'isPaid'],
        })
    }

    public async getInvoiceDetails(user: Users, invoiceId: string) {

        const customerDetails = await Users.findOne({
            where: {
                id: user.id,
                companyId: user.companyId
            },
            attributes: ["name", 'email'],
            include: [
                {
                    model: Workspaces,
                    attributes: ['name']
                }
            ]
        })

        const invoice = await Invoices.findByPk(invoiceId, {
            include: [
                {
                    model: InvoiceItems
                }
            ]
        })
        return {
            invoice,
            customerDetails: {
                name: customerDetails?.name,
                email: customerDetails?.email,
                workspaceName: customerDetails?.company?.name
            },
        }
    }

    public async startTrial(user: Users) {
        const workspace = await Workspaces.findByPk(user.companyId, {
            include: {
                model: Subscriptions,
                include: [PaymentPlans]
            }
        })

        if (
            workspace.subscription &&
            (workspace.subscription?.plan?.isTrial ||
                (workspace.subscription.trialEndDate && moment(workspace.subscription.trialEndDate).isBefore(moment())))
        ) {
            throw new ForbiddenException('You have already availed your trial period.');
        }

        const trialPlan = await PaymentPlans.findOne({
            where: {
                isTrial: true
            }
        })

        const subscription = await this.createSubscription({
            workspaceId: user.companyId, planId: trialPlan.id, isTrial: true
        })
        return {
            message: 'Trial plan is started successfully.',
            data: subscription
        }
    }

    public async createSubscription({ workspaceId, planId, isTrial }: { workspaceId: string, planId: string, isTrial: boolean }): Promise<Subscriptions> {
        return await Subscriptions.create({
            workspaceId,
            planId,
            billingDate: isTrial ? moment() : null,
            nextBillingDate: isTrial ? (this.isProd ? moment().add(3, 'month').endOf('day') : moment().add(10, 'minute')) : null,
            trialEndDate: isTrial ? (this.isProd ? moment().add(3, 'month').subtract(1, 'day').endOf('day') : moment().add(10, 'minute')) : null,
            currentPeriodEnd: isTrial ? (this.isProd ? moment().add(3, 'month').endOf('day') : moment().add(10, 'minute')) : null,
            billingCycle: this.isProd ? BillingCycle.MONTHLY : BillingCycle.DAILY,
            isActive: !!isTrial,
            allowedUsers: null,
        })
    }

    public async activatePlan({ userId, planId, stripeData }: { userId: string, planId: string, stripeData: IStripeTransactionData }) {
        const user = await Users.findByPk(userId, {
            include: [
                {
                    model: Workspaces,
                    attributes: ['id']
                },
            ]
        })
        if (!user) throw new NotFoundException('User not found!')

        const plan = await PaymentPlans.findByPk(planId)
        if (!plan) throw new NotFoundException('Plan not found!')

        let subscription = await Subscriptions.findOne({
            where: {
                workspaceId: user.companyId
            }
        })

        if (!subscription) {
            subscription = await Subscriptions.create({
                workspaceId: user.companyId,
                planId: plan.id,
                billingDate: moment(),
                nextBillingDate: this.isProd ? moment().add(1, 'month').endOf('day') : moment().add(1, 'day'),
                currentPeriodEnd: this.isProd ? moment().add(1, 'month').endOf('day') : moment().add(1, 'day'),
                stripeSubscriptionId: stripeData.stripeSubscriptionId && stripeData.stripeSubscriptionId,
                billingCycle: this.isProd ? BillingCycle.MONTHLY : BillingCycle.DAILY,
                isActive: true,
                allowedUsers: stripeData.allowedUsers,
                paidAmount: stripeData.total,
                nextExpectedAmount: stripeData.total,
            })
        } {
            subscription = await subscription.update({
                planId: plan.id,
                billingDate: moment(),
                nextBillingDate: this.isProd ? moment().add(1, 'month').endOf('day') : moment().add(1, 'day'),
                currentPeriodEnd: this.isProd ? moment().add(1, 'month').endOf('day') : moment().add(1, 'day'),
                stripeSubscriptionId: stripeData.stripeSubscriptionId || subscription.stripeSubscriptionId,
                billingCycle: this.isProd ? BillingCycle.MONTHLY : BillingCycle.DAILY,
                isActive: true,
                ...(stripeData.allowedUsers && { allowedUsers: stripeData.allowedUsers }),
                paidAmount: stripeData.total,
                nextExpectedAmount: stripeData.total,
            })
        }

        // Creating Invoice
        await this.createInvoice(user, subscription.id, { ...stripeData })

        return {
            message: 'Plan is successfully activated.',
            data: subscription
        }
    }

    public async deactivatePlan(user: Users) {
        let subscription = await Subscriptions.findOne({
            where: {
                workspaceId: user.companyId
            }
        })
        if (!subscription) throw new NotFoundException('Subscription not found.')

        await subscription.update({
            isActive: false
        })

        return {
            message: 'Plan deactivated!',
        }
    }

    public async createInvoice(user: Users, subscriptionId: string, metaData: Omit<IStripeTransactionData, 'stripeSubscriptionId'>) {
        const subscription = await Subscriptions.findByPk(subscriptionId, {
            include: [
                {
                    model: PaymentPlans
                }
            ]
        })
        if (!subscription) throw new NotFoundException('Subscription not found!')

        const invoiceOfDay = await Invoices.count({
            where: {
                createdAt: {
                    [Op.between]: [moment().startOf('day').toISOString(), moment().endOf('day').toISOString()]
                }
            }
        });

        // Generate invoice number with incremented counter
        const invoiceNo = generateInvoiceNumber(invoiceOfDay + 101);
        const totalAmount = metaData.total

        // Create the invoice
        const invoice = await Invoices.create({
            workspaceId: user.companyId,
            invoiceNo,
            totalAmount,
            orderId: metaData.orderId,
            transactionId: metaData.transactionId,
            billingPeriodStart: subscription.billingDate,
            billingPeriodEnd: subscription.nextBillingDate,
            currentPeriodEnd: subscription.currentPeriodEnd,
            isPaid: true
        });

        // Create invoice items
        await this.createInvoiceItems(invoice, subscription.plan, metaData)
    }

    public async createInvoiceItems(invoice: Invoices, plan: PaymentPlans, metaData: Omit<IStripeTransactionData, 'stripeSubscriptionId'>) {
        return await InvoiceItems.bulkCreate([
            {
                invoiceId: invoice.id,
                name: InvoiceItemNames.PLAN + plan.name,
                billingCycle: this.isProd ? BillingCycle.MONTHLY : BillingCycle.DAILY, 
                quantity: 1,
                unitPrice: plan.basePrice,
                totalPrice: plan.basePrice,
            },
            {
                invoiceId: invoice.id,
                name: InvoiceItemNames.INCLUDED_USER_QUOTA,
                billingCycle: this.isProd ? BillingCycle.MONTHLY : BillingCycle.DAILY,
                quantity: plan.includedUsers,
                unitPrice: 0,
                totalPrice: 0,
            },
            plan.extraUserPrice && {
                invoiceId: invoice.id,
                name: InvoiceItemNames.EXTRA_USERS,
                billingCycle: this.isProd ? BillingCycle.MONTHLY : BillingCycle.DAILY,
                quantity: metaData.allowedUsers - plan.includedUsers,
                unitPrice: plan.extraUserPrice,
                totalPrice: plan.extraUserPrice * (metaData.allowedUsers - plan.includedUsers),
            }
        ])

    }

}
