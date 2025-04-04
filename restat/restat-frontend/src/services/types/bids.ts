export enum BidStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
}

export interface BidProfile {
  id: string;
  name: string;
  deletedAt?: string | null;
}

export interface Contact {
  id: string;
  source: string;
  slug: string;
  workspaceId: string;
  jobId: string;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  locationState: string;
  locationCountry: string;
  decisionMaker: boolean;
  socialMediaLinks?: string | null;
  designation?: string | null;
  paymentMethod: string;
  rating: string;
  upworkPlus: boolean;
  historyTotalSpent: string;
  historyOpenJobs: string;
  historyJobsPosted: string;
  historyInterviews?: string | null;
  historyHoursBilled?: string | null;
  historyMemberJoined?: string | null;
  historyProposals?: string | null;
  historyHires?: string | null;
  historyHired?: string | null;
  upWorkRating?: string | null;
  numReviewsUpwork?: number | null;
  timeZone?: string | null;
  hubspotContactId?: string | null;
  currentInterview?: string | null;
  linkedinProfileLink?: string | null;
  linkedinConnected?: string | null;
  linkedinConnectedDate?: string | null;
  linkedinConnections?: string | null;
  linkedinFollowers?: string | null;
  profileHeadline?: string | null;
  location?: string | null;
  birthday?: string | null;
  websites?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Job {
  id: string;
  accountId: string;
  category: string;
  connects?: string | null;
  title: string;
  description: string;
  postedDate: string;
  experienceLevel: string;
  hourlyRange?: string | null;
  hourly: string;
  projectLength?: string | null;
  url: string;
  type?: string | null;
  featured: boolean;
  proposeYourTerms?: string | null;
  inviteOnly: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  jobsTags?: { tags: { id: string, name: string } }[];
}

export interface BidDetails {
  id: string;
  slug: string;
  jobId: string;
  userId: string;
  bidProfileId: string;
  contactId: string;
  coverLetter: string;
  bidProfileFreelancer?: string | null;
  bidProfileAgency?: string | null;
  bidProfileBusinessManager?: string | null;
  upworkProposalURL: string;
  boosted: boolean;
  connects: string;
  proposedProfile: string;
  proposedRate: string;
  receivedAmount?: string | null;
  responseDate?: string | null;
  status: BidStatus;
  bidResponse: boolean;
  bidQuestionAnswers?: string[];  // assuming it is an array of strings
  dateTime: string;
  invite: boolean;
  jobObjId?: string | null;
  clickupTaskId?: string | null;
  hubspotDealId?: string | null;
  hub_id?: string | null;
  isManual: boolean;
  contractDate?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  company: string;
  user: string;
  bidProfile: BidProfile;
  contact: Contact;
  job: Job;
}

export interface IBidDetails {
  show: boolean;
  data: BidDetails | null;
}
