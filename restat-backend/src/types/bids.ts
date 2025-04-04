export enum BidStatus {
    PENDING = 'Pending',
    ACTIVE = 'Active',
    COMPLETED = 'Completed'
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