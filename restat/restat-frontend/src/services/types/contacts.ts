import { BidStatus } from "./bids";
import { CONTACT_SOURCE } from "./common";

export interface ILinkedInReference {
  id: string;
  linkedinConnected: boolean | null;
  linkedinConnectedDate: string | null;
  createdAt: string;
  user: {
    deletedAt: any;
    name: string;
  };
  profile: {
    deletedAt: any;
    name: string;
  };
  industry: {
    name: string;
  };
}

export interface IBid {
  id: string;
  slug: string;
  upworkProposalURL: string;
  status: BidStatus;
  createdAt: string;
  responseDate: string;
  contractDate: string;
  user: {
    deletedAt: any;
    name: string;
  };
  bidProfile: {
    deletedAt: any;
    name: string;
  };
}
export interface ICompanyExperience {
  duration: string | null;
  totalDuration: string | null;
  title: string | null;
}

export interface ICompany {
  name: string;
  location: string | null;
  experiences: ICompanyExperience[];
}

export interface IEducation {
  duration: string;
  degree: string;
}

export interface IInstitution {
  name: string;
  education: IEducation[];
}

export interface ISkill {
  name: string;
}

interface IJob {
  title: string;
  category: string;
  url: string;
  postedDate: string;
}

export interface IContact {
  id: string;
  source: CONTACT_SOURCE;
  workspaceId: string;
  jobId: string | null;
  slug: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  locationState: string | null;
  locationCountry: string | null;
  decisionMaker: boolean;
  socialMediaLinks: { name: string, url: string }[] | null;
  designation: string | null;
  paymentMethod: string | null;
  rating: string | null;
  upworkPlus: boolean | null;
  historyTotalSpent: string | null;
  historyOpenJobs: string | null;
  historyJobsPosted: string | null;
  historyInterviews: string | null;
  historyHoursBilled: string | null;
  historyMemberJoined: string | null;
  historyProposals: string | null;
  historyHires: string | null;
  historyHired: string | null;
  upWorkRating: number | null;
  numReviewsUpwork: number | null;
  timeZone: string | null;
  hubspotContactId: string | null;
  currentInterview: string | null;
  historyHireRate: number | null;
  historyAvgHourlyRate: number | null;
  linkedinProfileLink: string | null;
  linkedinConnections: string | null;
  linkedinFollowers: string | null;
  profileHeadline: string | null;
  location: string | null;
  birthday: string | null;
  websites: string[] | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  companies: ICompany[];
  institutions: IInstitution[];
  skills: ISkill[];
  job: IJob | null;
  bid: IBid[];
  linkedInReference: ILinkedInReference[];
  ContactExperience?: ICompanyExperience;
  contactExperiences?: ICompanyExperience[];
}
