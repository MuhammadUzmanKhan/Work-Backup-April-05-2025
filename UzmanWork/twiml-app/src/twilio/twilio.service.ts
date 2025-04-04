import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
    private client: Twilio;
    private subaccountRegions: Map<string, string> = new Map();
    constructor() {
        const accountSid = "AC39fe98d1c91525313a365e40e9689385"; // Main Account SID from environment variables
        const authToken = "aa6c7ae7cfd5ed69da792cc6282f87d3";   // Main Auth Token from environment variables
        this.client = new Twilio(accountSid, authToken);
    }

    initializeClientWithRegion(region: string) {
        this.client = new Twilio("AC39fe98d1c91525313a365e40e9689385", "aa6c7ae7cfd5ed69da792cc6282f87d3", {
            region,
        });
    }

    /**
  * Create a new subaccount in the specified region.
  * @param friendlyName Name of the new subaccount
  * @param region Regional endpoint (e.g., 'us2' for Canada, 'sg1' for Singapore)
  */
    async createSubaccountWithRegion(friendlyName: string, region: string): Promise<any> {
        try {
            // Step 1: Initialize the client for the desired region
            this.initializeClientWithRegion(region);

            // Step 2: Create the subaccount
            const subaccount = await this.client.api.v2010.accounts.create({ friendlyName });
            console.log("🚀 Subaccount Created:", subaccount);

            // Verify subaccount SID and AuthToken
            if (!subaccount.sid || !subaccount.authToken) {
                throw new Error("Subaccount SID or AuthToken is missing.");
            }
            console.log("Subaccount SID:", subaccount.sid);
            console.log("Subaccount AuthToken:", subaccount.authToken);

            // Step 3: Reinitialize Twilio client for the subaccount
            const subaccountClient = new Twilio(subaccount.sid, subaccount.authToken, { region });

            // Step 4: Create an API key for the subaccount
            const apiKey = await subaccountClient.newKeys.create({
                friendlyName: `Key for ${friendlyName}`,
            });
            console.log("🚀 API Key Created for Subaccount:", apiKey);

            // Step 5: Save subaccount region for reference
            this.subaccountRegions.set(subaccount.sid, region);
            console.log(`Region for subaccount ${subaccount.sid}: ${region}`);

            // Step 6: Return subaccount and API key details
            return {
                subaccount: {
                    sid: subaccount.sid,
                    friendlyName: subaccount.friendlyName,
                    authToken: subaccount.authToken,
                    region
                },
                apiKey: {
                    sid: apiKey.sid,
                    secret: apiKey.secret, // Save the secret securely as it will not be retrievable later
                },
            };
        } catch (error) {
            console.error("Error creating subaccount and API key:", error);
            throw new Error(`Error creating subaccount and API key: ${error.message}`);
        }
    }

    /**
     * Fetch details of a specific account (Main or Subaccount).
     * @param accountSid The SID of the account to fetch
     */
    async fetchAccount(accountSid: string): Promise<any> {
        try {
            const account = await this.client.api.v2010.accounts(accountSid).fetch();
            return account; // Returns account details
        } catch (error) {
            throw new Error(`Error fetching account details: ${error.message}`);
        }
    }



    // async getSubaccountRegion(subaccountSid: string): Promise<string | null> {
    //     // Retrieve region from the stored map using the subaccount SID
    //     return this.subaccountRegions.get(subaccountSid) || null;
    // }

    getSubaccountRegion(subaccountSid: string): string {
        const region = this.subaccountRegions.get(subaccountSid);
        if (!region) {
            throw new Error(`Region not found for subaccount SID: ${subaccountSid}`);
        }
        return region;
    }

    /**
     * List all accounts (Main and Subaccounts).
     */
    async listAccounts(): Promise<any[]> {
        try {
            const accounts = await this.client.api.v2010.accounts.list();
            return accounts; // Returns an array of accounts
        } catch (error) {
            throw new Error(`Error listing accounts: ${error.message}`);
        }
    }

    async createLogicalSubaccount(
        parentFriendlyName: string,
        childFriendlyName: string,
        region: string
    ): Promise<any> {
        // Create Parent Subaccount
        const parentSubaccount = await this.createSubaccountWithRegion(parentFriendlyName, region);

        // Create Child Subaccount with reference to Parent
        const childSubaccount = await this.createSubaccountWithRegion(
            `${parentFriendlyName}:${childFriendlyName}`,
            region
        );

        // Return Parent and Child Details
        return {
            parentSubaccount,
            childSubaccount,
        };
    }

    /**
     * Send an SMS using a specific account.
     * Defaults to the main account if no subaccount credentials are provided.
     * @param to Recipient's phone number
     * @param message The message body
     * @param subAccountSid Optional SID of the subaccount
     * @param authToken Optional Auth Token of the subaccount
     */
    // async sendMessage(to: string, message: string, subAccountSid?: string, authToken?: string): Promise<any> {
    //     let client = this.client;

    //     if (subAccountSid && authToken) {
    //         client = new Twilio(subAccountSid, authToken); // Use subaccount credentials
    //     }

    //     const from = "+12315709664"; // Default "from" number
    //     console.log("🚀 ~ TwilioService ~ sendMessage ~ from:", from);

    //     try {
    //         return await client.messages.create({ to, from, body: message });
    //     } catch (error) {
    //         throw new Error(`Error sending message: ${error.message}`);
    //     }
    // }

    async sendMessage(
        to: string,
        message: string,
        subAccountSid?: string,
        authToken?: string,
        region?: string
    ): Promise<any> {
        let client = this.client;

        if (subAccountSid && authToken) {
            // Initialize client for the subaccount in the specified region
            client = new Twilio(subAccountSid, authToken, { region });
        }

        const from = "+12315709664"; // Default "from" number
        console.log("🚀 Sending Message From:", from);

        try {
            return await client.messages.create({ to, from, body: message });
        } catch (error) {
            throw new Error(`Error sending message: ${error.message}`);
        }
    }


    /**
 * Request Toll-Free Number Verification
 * @param phoneNumber - Toll-Free Number in E.164 format
 * @param friendlyName - Friendly name for identification
 */
    async requestTollFreeVerification(phoneNumber: string, friendlyName?: string): Promise<any> {
        try {
            const verificationRequest = await this.client.validationRequests.create({
                phoneNumber,
                friendlyName: friendlyName || `Verification for ${phoneNumber}`,
            });
            console.log("Verification Request Created:", verificationRequest);
            return verificationRequest;
        } catch (error) {
            console.error("Error requesting Toll-Free verification:", error.message);
            throw new Error(`Verification request failed: ${error.message}`);
        }
    }

    /**
     * Create Messaging Service for Global Messaging
     * @param friendlyName - Messaging Service Name
     * @param tollFreeNumber - Verified Toll-Free Number
     */
    async createMessagingService(friendlyName: string, tollFreeNumberSid: string): Promise<any> {
        try {
            // Deprecated: Use with caution
            console.warn("⚠️ 'Messaging.services' is deprecated. Check Twilio API documentation for alternatives.");

            const messagingService = await this.client.messaging.services.create({
                friendlyName,
                inboundRequestUrl: "https://demo.twilio.com/welcome/sms/reply/",
            });

            // Attach toll-free number to the messaging service
            await this.client.messaging.services(messagingService.sid).phoneNumbers.create({
                phoneNumberSid: tollFreeNumberSid,
            });

            console.log("Messaging Service Created:", messagingService);
            return messagingService;
        } catch (error) {
            console.error("Error creating Messaging Service:", error.message);
            throw new Error(`Messaging Service creation failed: ${error.message}`);
        }
    }

}
