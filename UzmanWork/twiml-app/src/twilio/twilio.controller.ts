import { Controller, Get, Post, Body, Delete, Param, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { TwilioService } from './twilio.service';

@Controller('twilio')
export class TwilioController {
    constructor(private readonly twilioService: TwilioService) { }

    // @Post('create-subaccount')
    // async createSubaccount(@Body('friendlyName') friendlyName: string) {
    //     return await this.twilioService.createSubaccount(friendlyName);
    // }

    @Get('account/:accountSid')
    async fetchAccount(@Param('accountSid') accountSid: string): Promise<any> {
        // Replace with the actual region (you need to get the region somehow, for example, from the database)

        const accountDetails = await this.twilioService.fetchAccount(accountSid);
        return accountDetails;
    }

    @Get('list-accounts')
    async listAccounts() {
        return await this.twilioService.listAccounts();
    }


    @Get('subaccount-region/:sid')
    async getSubaccountRegion(@Param('sid') subaccountSid: string): Promise<any> {
        try {
            const region = this.twilioService.getSubaccountRegion(subaccountSid);
            return { subaccountSid, region };
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
    }

    @Post('create-logical-subaccount')
    async createLogicalSubaccount(
        @Body('parentFriendlyName') parentFriendlyName: string,
        @Body('childFriendlyName') childFriendlyName: string,
        @Body('region') region: string
    ) {
        return await this.twilioService.createLogicalSubaccount(
            parentFriendlyName,
            childFriendlyName,
            region
        );
    }

    @Post('verify-toll-free')
    async verifyTollFree(@Body() body: { phoneNumber: string; friendlyName?: string }) {
        const { phoneNumber, friendlyName } = body;
        if (!phoneNumber) {
            throw new Error("Phone number is required.");
        }
        return await this.twilioService.requestTollFreeVerification(phoneNumber, friendlyName);
    }

    /**
     * Create Messaging Service
     */
    @Post('create-messaging-service')
    async createMessagingService(@Body() body: { friendlyName: string; tollFreeNumber: string }) {
        const { friendlyName, tollFreeNumber } = body;
        if (!friendlyName || !tollFreeNumber) {
            throw new Error("Both friendlyName and tollFreeNumber are required.");
        }
        return await this.twilioService.createMessagingService(friendlyName, tollFreeNumber);
    }



    @Post('create-subaccount-singapure')
    async createSubaccountSingapure(@Body('friendlyName') friendlyName: string) {
        return await this.twilioService.createSubaccountWithRegion(friendlyName, 'sg1');
    }


    @Post('send-message')
    async sendMessage(
        @Body('to') to: string,
        @Body('message') message: string,
        @Body('subAccountSid') subAccountSid?: string,
        @Body('authToken') authToken?: string,
    ) {
        return await this.twilioService.sendMessage(to, message, subAccountSid, authToken);
    }

    // @Get('subaccount-region/:subaccountSid')
    // async getSubaccountRegion(@Param('subaccountSid') subaccountSid: string): Promise<{ region: string }> {
    //     const region = await this.twilioService.getSubaccountRegion(subaccountSid);
    //     console.log("🚀 ~ TwilioController ~ getSubaccountRegion ~ region:", region)
    //     if (!region) {
    //         throw new NotFoundException('Region for the subaccount not found');
    //     }
    //     return { region };
    // }
}
