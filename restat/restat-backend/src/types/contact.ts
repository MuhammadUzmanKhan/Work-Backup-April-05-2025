import { SOURCE } from "src/common/constants/source";

export interface IContact {
    id?: string;
    source?: SOURCE;
    workspaceId?: string;
    jobId?: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    locationState?: string;
    locationCountry?: string;
    decisionMaker?: boolean;
    socialMediaLinks?: { name: string; url: string }[];
    designation?: string;
    paymentMethod?: string;
    rating?: string;
    upworkPlus?: boolean;
    historyTotalSpent?: string;
    historyOpenJobs?: string;
    historyJobsPosted?: string;
    historyInterviews?: string;
    historyHoursBilled?: string;
    historyMemberJoined?: Date;
    historyProposals?: string;
    historyHires?: string;
    historyHired?: string;
    upWorkRating?: number;
    numReviewsUpwork?: number;
    timeZone?: string;
    hubspotContactId?: string;
    currentInterview?: string;
  
    // LinkedIn
    linkedinProfileLink?: string;
    linkedinConnected?: boolean;
    linkedinConnectedDate?: string;
    linkedinConnections?: string;
    linkedinFollowers?: string;
    profileHeadline?: string;
    location?: string;
    birthday?: string;
    websites?: string[];
  }
  