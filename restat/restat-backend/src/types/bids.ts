import { Users } from "src/common/models/users.model";
import { DateProps } from "src/modules/bids/bids-jobs-accounts.service";

export enum BidStatus {
    PENDING = 'Pending',
    ACTIVE = 'Active',
    COMPLETED = 'Completed'
}

export interface SearchParams {
    user: Users,
    search: string,
    profile: string[],
    page: number,
    bidderId: string[],
    status: string[],
    perPage: string,
    dates?: DateProps,
    slug?: string,
    hourlyRange?: number[],
    proposedRate?: number,
    receivedRate?: number,
    location?: string[],
    skillSet?: string[],
    type?: string[]
}

export interface Account {
    id: string;
    name: string;
    company: string;
    email?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    locationCountry: string;
    locationState: string;
    timeZone?: string | null;
    source: string;
    paymentMethod: string;
    upWorkRating?: string | null;
    upworkPlus: boolean;
    numReviewsUpwork?: number | null;
    rating: string;
    historyHired?: string | null;
    historyHires: string;
    historyHoursBilled?: string | null;
    historyInterviews?: string | null;
    historyJobsPosted: string;
    historyMemberJoined?: string | null;
    historyOpenJobs: string;
    historyProposals?: string | null;
    historyTotalSpent: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export interface Job {
    accountId: string;
    category: string;
    connects: string;
    createdAt: string;
    deletedAt: string;
    description: string;
    experienceLevel: string;
    featured: boolean;
    hourly: string;
    hourlyRange: string;
    id: string;
    inviteOnly: boolean;
    postedDate: string;
    projectLength: string;
    proposeYourTerms: string;
    title: string;
    type: string;
    updatedAt: string;
    url: string;
}

interface JobSkills {
    id: string;
    name: string;
    source: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}
export interface BidDetails {
    id?: string;
    name?: string;
    date?: string;
    rate?: string;
    bidder?: string;
    bidUserId?: string;
    profile?: string;
    profileId?: string;
    url?: string;
    coverLetter?: string;
    freelancer?: string;
    businessManager?: string;
    company?: string;
    agency?: string;
    boosted?: boolean;
    connects?: string;
    proposedProfile?: string;
    receivedAmount?: string;
    responseDate?: string;
    status?: BidStatus;
    bidResponse?: string;
    bidTime?: Date;
    invite?: boolean;
    job: Job;
    jobSkills?: JobSkills[];
    account: Account;
}

export interface BidDetails {
    id?: string;
    name?: string;
    date?: string;
    rate?: string;
    bidder?: string;
    bidUserId?: string;
    profile?: string;
    profileId?: string;
    url?: string;
    coverLetter?: string;
    freelancer?: string;
    businessManager?: string;
    company?: string;
    agency?: string;
    boosted?: boolean;
    connects?: string;
    proposedProfile?: string;
    receivedAmount?: string;
    responseDate?: string;
    status?: BidStatus;
    bidResponse?: string;
    bidTime?: Date;
    invite?: boolean;
    job: Job;
    jobSkills?: JobSkills[];
    account: Account;
}

export interface IMessage {
    success: boolean;
    message: string;
}

export interface IMarketplaceJobPosting {
    id: string;
    content: {
        title: string;
        description: string;
    };
    classification: {
        additionalSkills?: {
            preferredLabel: string;
        }[];
        skills?: {
            preferredLabel: string;
        }[];
        subCategory: {
            preferredLabel: string;
        };
        category: {
            preferredLabel: string;
        };
    };
    contractTerms: {
        contractStartDate: string | null;
        contractEndDate: string;
        contractType: 'HOURLY' | 'FIXED' | null;
        onSiteType: string | null;
        personsToHire: number;
        experienceLevel: string;
        notSurePersonsToHire: boolean;
        notSureExperiencelevel: boolean;
        fixedPriceContractTerms: {
            amount: {
                rawValue: number;
                currency: string;
                displayValue: string;
            };
            maxAmount: string | null;
            engagementDuration: {
                id: string;
                label: string;
                weeks: number;
            };
        } | null;
        hourlyContractTerms: {
            engagementType: string;
            notSureProjectDuration: boolean;
            hourlyBudgetType: string;
            hourlyBudgetMin: number;
            hourlyBudgetMax: number;
            engagementDuration: {
                id: string;
                label: string;
                weeks: number;
            };
        } | null;
    };
    clientCompanyPublic: {
        id: string;
        legacyType: string;
        teamsEnabled: any | null;
        canHire: boolean;
        hidden: boolean;
        includeInStats: any | null;
        state: string | null;
        city: string;
        timezone: string;
        accountingEntity: string;
        billingType: string;
        country: {
            id: string;
            name: string;
            twoLetterAbbreviation: string;
            threeLetterAbbreviation: string;
            region: string;
            phoneCode: string;
            active: any | null;
            registrationAllowed: any | null;
        };
    };
    activityStat: {
        applicationsBidStats: any | null;
    };
}

export interface IVendorProposal {
    id: string;
    proposalCoverLetter: string;
    marketplaceJobPosting: IMarketplaceJobPosting;
    auditDetails: {
        createdDateTime: {
            rawValue: number;
            displayValue: string;
        };
        modifiedDateTime: {
            rawValue: number;
            displayValue: string;
        };
    };
    status: {
        status: 'Created' | 'Activated' | 'Declined' | 'Accepted' | 'Withdrawn' | 'Offered' | 'Replaced' | 'Archived' | 'Hired';
    };
}

export interface IVendorLead {
    id: string;
    roomName: string;
    createdAtDateTime: string;
    topic: string;
    joinDateTime: string;
    lastVisitedDateTime: string;
    lastReadDateTime: string;
    contractId: string;
}

