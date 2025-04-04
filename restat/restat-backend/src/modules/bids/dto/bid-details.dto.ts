import { IsBoolean, IsDateString, IsEmail, IsEnum, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Enum for BidStatus if you have it defined
export enum BidStatus {
    PENDING = 'Pending',
    ACTIVE = 'Active',
    COMPLETED = 'Completed'
}


export class JobSkillsDto {
    @IsUUID()
    id: string;

    @IsString()
    name: string;

    @IsString()
    source: string;

    @IsDateString()
    createdAt: string;

    @IsOptional()
    @IsDateString()
    deletedAt?: string;

    @IsDateString()
    updatedAt: string;
}

export class JobDto {
    @IsUUID()
    accountId: string;

    @IsString()
    category: string;

    @IsOptional()
    @IsString()
    connects?: string;

    @IsString()
    description: string;

    @IsString()
    experienceLevel: string;

    @IsString()
    featured: string;

    @IsString()
    hourly: string;

    @IsString()
    hourlyRange: string;

    @IsUUID()
    id: string;

    @IsBoolean()
    inviteOnly: boolean;

    @IsDateString()
    postedDate: string;

    @IsOptional()
    @IsString()
    projectLength?: string;

    @IsOptional()
    @IsString()
    proposeYourTerms?: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsString()
    url: string;
}

export class AccountDto {
    @IsOptional()
    @IsString()
    address?: string;

    @IsString()
    company: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsString()
    historyHired: string;

    @IsString()
    historyHires: string;

    @IsString()
    historyHoursBilled: string;

    @IsString()
    historyInterviews: string;

    @IsString()
    historyJobsPosted: string;

    @IsOptional()
    @IsDateString()
    historyMemberJoined?: string;

    @IsString()
    historyOpenJobs: string;

    @IsString()
    historyProposals: string;

    @IsString()
    historyTotalSpent: string;

    @IsUUID()
    id: string;

    @IsString()
    locationCountry: string;

    @IsString()
    locationState: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    numReviewsUpwork?: string;

    @IsString()
    paymentMethod: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsString()
    rating: string;

    @IsString()
    source: string;

    @IsOptional()
    @IsString()
    timeZone?: string;

    @IsOptional()
    @IsString()
    upWorkRating?: string;
}

export class BidDetailsDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => AccountDto)
    account?: AccountDto;

    @IsOptional()
    @IsString()
    agency?: string;

    @IsBoolean()
    bidResponse: boolean;

    @IsDateString()
    bidTime: string;

    @IsOptional()
    @IsString()
    bidder?: string;

    @IsOptional()
    @IsString()
    bidUserId?: string;

    @IsOptional()
    @IsString()
    profileId?: string;

    @IsBoolean()
    boosted: boolean;

    @IsOptional()
    @IsString()
    businessManager?: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsOptional()
    @IsString()
    id?: string;

    @IsString()
    connects: string;

    @IsOptional()
    @IsString()
    coverLetter?: string;

    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    freelancer?: string;

    @IsBoolean()
    invite: boolean;

    @ValidateNested()
    @Type(() => JobDto)
    job: JobDto;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => JobSkillsDto)
    jobSkills?: JobSkillsDto[];
}

export class UpdateJobDto {
    @IsString()
    @IsUUID()
    id: string;

    @IsOptional()
    @IsString()
    experienceLevel: string;

    @IsOptional()
    @IsString()
    hourly: string;

    @IsOptional()
    @IsString()
    hourlyRange: string;

    @IsOptional()
    @IsString()
    projectLength?: string;
}

export class UpdateAccountDto {
    @IsUUID()
    id: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    historyHired: string;

    @IsOptional()
    @IsString()
    historyHires: string;

    @IsOptional()
    @IsString()
    historyHoursBilled: string;

    @IsOptional()
    @IsString()
    historyInterviews: string;

    @IsOptional()
    @IsString()
    historyJobsPosted: string;

    @IsOptional()
    @IsDateString()
    historyMemberJoined?: string;

    @IsOptional()
    @IsString()
    historyOpenJobs: string;

    @IsOptional()
    @IsString()
    historyProposals: string;
    
    @IsOptional()
    @IsString()
    historyTotalSpent: string;
    
    @IsOptional()
    @IsString()
    locationCountry: string;

    @IsOptional()
    @IsString()
    locationState: string;

    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    numReviewsUpwork?: string;

    @IsOptional()
    @IsString()
    paymentMethod: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    rating: string;

    @IsOptional()
    @IsString()
    timeZone?: string;

    @IsOptional()
    @IsString()
    upWorkRating?: string;
}

export class UpdateBidDto {
    @IsOptional()
    @IsString()
    bidProfileId?: string;

    @IsOptional()
    @IsString()
    bidUserId?: string;
    
    @IsOptional()
    @IsEnum(BidStatus)
    status?: BidStatus; 

    @IsOptional()
    @IsString()
    responseDate?: string;
    
    @IsOptional()
    @IsString()
    contractDate?: string;

    @IsObject()
    @ValidateNested()
    @Type(() => UpdateJobDto)
    job: UpdateJobDto;

    @IsObject()
    @ValidateNested()
    @Type(() => UpdateAccountDto)
    contact: UpdateAccountDto;
}
