export interface CreateFieldProps {
  // Upwork Fields  
  // Job Fields
    name?: string
    titleWithClientName?: string
    description?: string
    category?: string
    postedDate?: number
    experienceLevel?: string
    hourlyRange?: string
    hourly?: string
    projectLength?: string
    url?: string;
    featured?: boolean;
    // Bid Fields
    bidCoverLetter?: string;
    bidURL?: string;
    boosted?: boolean;
    connects?: number;
    profile?: {add?: [number], rem?: [number]};
    bidderProfile?: {add?: [number], rem?: [number]};
    bidderName?: string;
    profileName?: string;
    rate?: number;
    responseDate?: number;
    bidQuestions?: string;
    invite?: boolean;
    // Account Fields
    accountRating?: number;
    clientName?: string;
    clientCountry?: string;
    clientState?: string;
    clientTimezone?: string;

    // LinkedIn Fields
    fullName?: string;
    firstName?: string;
    lastName?: string;
    profileHeadline?: string;
    location?: string;
    connectionDate?: number;
    connectionsCount?: string;
    followers?: string;
    email?: string;
    phone?: string;
    website?: string;
    linkedinProfile?: string;
    industry?: string;
    latestCompanyName?: string;
    latestCompanyLocation?: string;

    // General For Clickup
    assignees?: number[]
    tags?: string[]
    priority?: number
    notify_all?: boolean

}

export enum HUBSPOT_CATEGORYS {
    DEALS = 'DEALS', 
    CONTACTS = 'CONTACTS',
    COMPANIES = 'COMPANIES'
  }
  
  export enum INTEGRATION_OPTION {
    UPWORK = 'UPWORK', 
    LINKEDIN = 'LINKEDIN'
  }
  