import { HttpException, HttpStatus, Injectable, MethodNotAllowedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { FetchProposalDto } from './dto/get-proposals.dto';
import { IVendorLead, IVendorProposal } from 'src/types/bids';
import { JobService } from '../jobs/jobs.service';
import { ContactService } from '../contacts/contacts.service';
import { BidService } from '../bids/bids.service';

@Injectable()
export class UpworkApisService {
    constructor(
        private readonly jobService: JobService,
        private readonly contactService: ContactService,
        private readonly bidService: BidService,
    ) { }

    private readonly upworkGraphQLUrl = 'https://api.upwork.com/graphql';
    private readonly upworkTokenUrl = 'https://www.upwork.com/api/v3/oauth2/token';

    private getVendorProposalQuery = (proposalId: string) => `
    query VendorProposal {
        vendorProposal(id: "${proposalId}") {
            id
            proposalCoverLetter
            marketplaceJobPosting {
                id
                activityStat {
                    applicationsBidStats {
                        avgRateBid {
                            rawValue
                            currency
                            displayValue
                        }
                        minRateBid {
                            rawValue
                            currency
                            displayValue
                        }
                        maxRateBid {
                            rawValue
                            currency
                            displayValue
                        }
                        avgInterviewedRateBid {
                            rawValue
                            currency
                            displayValue
                        }
                    }
                }
                content {
                    title
                    description
                }
                classification {
                    category {
                        preferredLabel
                    }
                    subCategory {
                        preferredLabel
                    }
                    skills {
                        preferredLabel
                    }
                    additionalSkills {
                        preferredLabel
                    }
                }
                contractTerms {
                    contractStartDate
                    contractEndDate
                    contractType
                    onSiteType
                    personsToHire
                    experienceLevel
                    notSurePersonsToHire
                    notSureExperiencelevel
                    fixedPriceContractTerms {
                        amount {
                            rawValue
                            currency
                            displayValue
                        }
                        maxAmount {
                            rawValue
                            currency
                            displayValue
                        }
                        engagementDuration {
                            id
                            label
                            weeks
                        }
                    }
                    hourlyContractTerms {
                        engagementType
                        notSureProjectDuration
                        hourlyBudgetType
                        hourlyBudgetMin
                        hourlyBudgetMax
                        engagementDuration {
                            id
                            label
                            weeks
                        }
                    }
                }
                clientCompanyPublic {
                    id
                    legacyType
                    teamsEnabled
                    canHire
                    hidden
                    includeInStats
                    state
                    city
                    timezone
                    accountingEntity
                    billingType
                    country {
                        id
                        name
                        twoLetterAbbreviation
                        threeLetterAbbreviation
                        region
                        phoneCode
                        active
                        registrationAllowed
                    }
                }
            }
            auditDetails {
                createdDateTime {
                    rawValue
                    displayValue
                }
                modifiedDateTime {
                    rawValue
                    displayValue
                }
            }
            status {
                status
            }
        }
    }    
  `;

    private getVendorLeadQuery = (proposalId: string) => `
    query ProposalRoom {
        proposalRoom(vendorProposalId: "${proposalId}") {
            id
            roomName
            createdAtDateTime
            topic
            joinDateTime
            lastVisitedDateTime
            lastReadDateTime
            contractId
        }
    }    
  `;

    async getVendorLead(proposalId: string, authToken: string): Promise<{
        success: boolean,
        data: any
    }> {
        try {
            const vendorLead = await axios.post(
                this.upworkGraphQLUrl,
                { query: this.getVendorLeadQuery(proposalId) },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            )
            return { success: true, data: vendorLead.data }

        } catch (error: any) {
            console.log('Error in getVendorLead', error);
            throw new HttpException(
                error.response?.data || 'Failed to fetch vendor proposal',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getVendorProposal({ proposals, profiles }: FetchProposalDto): Promise<{
        success: boolean,
        data: { vendorProposal: IVendorProposal, profileId: string, vendorLead: IVendorLead | null }[]
    }> {
        const proposalPromises = proposals.map(async proposal => {
            const authToken = profiles.find(profile => profile.name === proposal.profileName)?.accessToken;
            const profileId = profiles.find(profile => profile.name === proposal.profileName)?.id;
            const cleanBidURL = proposal.proposalUrl.includes("?")
                ? proposal.proposalUrl.split("?")[0]
                : proposal.proposalUrl;

            const proposalIdMatch = cleanBidURL.match(/proposals(?:\/insights)?\/(\d+)/);
            const proposalId = proposalIdMatch ? proposalIdMatch[1] : null;

            if (proposalId && authToken) {
                try {
                    const proposalResponse = await axios.post(
                        this.upworkGraphQLUrl,
                        { query: this.getVendorProposalQuery(proposalId) },
                        {
                            headers: {
                                Authorization: `Bearer ${authToken}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    const vendorLeadResponse = await this.getVendorLead(proposalId, authToken);

                    return {
                        ...proposalResponse.data?.data,
                        profileId,
                        vendorLead: vendorLeadResponse?.data?.data?.proposalRoom || null,
                    };
                } catch (error) {
                    console.error(`Error fetching proposal or vendor lead for proposalId: ${proposalId}`, error);
                    return null; // Handle rejected promises gracefully
                }
            }

            return null;
        });

        try {
            const result: any = await Promise.allSettled(proposalPromises);
            const fulfilledResults = result.filter((res: any) => res.status === 'fulfilled' && res.value);
            const data = fulfilledResults.map((res: any) => res.value);

            console.log('Fulfilled', data.length);
            console.log('Rejected', result.filter((res: any) => res.status === 'rejected').length);

            return { success: true, data };
        } catch (error: any) {
            console.error('Error in getVendorProposal', error);
            throw new HttpException(
                error.response?.data || 'Failed to fetch vendor proposal',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async generateAccessToken(refreshToken: string): Promise<any> {
        if (!refreshToken) throw new NotFoundException('Refresh token not found!')
        const body = new URLSearchParams();
        const configService = new ConfigService();

        body.append('grant_type', 'refresh_token');
        body.append('refresh_token', refreshToken);
        body.append('client_id', configService.get('UPWORK_CLIENT_ID'),);
        body.append('client_secret', configService.get('UPWORK_CLIENT_SECRET'),);

        try {
            const response: AxiosResponse = await axios.post(
                this.upworkTokenUrl,
                body.toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );
            return response.data;
        } catch (error: any) {
            throw new HttpException(
                error.response?.data || 'Failed to generate access token',
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async populateProposalFromUpwork(data: FetchProposalDto) {
        const userId = data.userId
        const workspaceId = data.workspaceId
        if (!userId || !workspaceId) throw new MethodNotAllowedException('UserId and workspaceId are required')
        const proposals = await this.getVendorProposal(data);

        if (proposals.success) {
            const result = await proposals.data.map(async proposal => {
                // 1: Create Or Find Job
                const { job } = await this.jobService.createOrUpdateJobFromUpworkAPI(workspaceId, proposal.vendorProposal.marketplaceJobPosting)

                // 2: Create Or Find Contact
                const { contact } = await this.contactService.createContactFromUpworkAPI(workspaceId, job.id, proposal.vendorProposal.marketplaceJobPosting)

                // 3: Create Or Find Bid
                const { bid } = await this.bidService.createOrUpdateBidFromUpworkAPI({
                    userId,
                    bidProfileId: proposal.profileId,
                    contactId: contact.id,
                    jobId: job.id,
                    proposal: proposal.vendorProposal,
                    lead: proposal.vendorLead,
                })

                return {
                    success: true, data: { bid, job, contact }
                }
            })
            const data = await Promise.allSettled(result)
            return { success: true, data }
        } else {
            return { success: false, data: proposals }
        }
    }



}
