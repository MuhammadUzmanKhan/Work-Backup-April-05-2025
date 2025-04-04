export interface IClient {
    company?: string;
    name?: string;
    timeZone?: string;
    upworkPlus?: boolean;
    paymentMethod?: string;
    rating?: string;
    location?: {
        country?: string;
        state?: string;
    };
    history?: {
        proposals?: string;
        interviews?: string;
        jobsPosted?: string;
        totalSpent?: string;
        hoursBilled?: string;
        openJobs?: string;
        hires?: string;
        hired?: string;
        memeberJoined?: string; 
    };
}
