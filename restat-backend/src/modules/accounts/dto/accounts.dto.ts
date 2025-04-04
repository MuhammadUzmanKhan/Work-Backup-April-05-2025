import { IsNotEmpty, IsString, ValidateNested, IsOptional, IsBoolean, IsArray, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { JobDto } from "src/modules/jobs/dto/jobs.dto";

export class LocationDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class SocialMediaHandlesDto {
  [key: string]: string;
}

export class ClientExperienceDto {
  @IsOptional()
  @IsString()
  totalYears?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobTitles?: string[];

  @IsOptional()
  @IsString()
  organizationName?: string;
}

export class HistoryDto {
  @IsOptional()
  @IsString()
  proposals?: string;

  @IsOptional()
  @IsString()
  interviews?: string;

  @IsOptional()
  @IsString()
  jobsPosted?: string;

  @IsOptional()
  @IsString()
  totalSpent?: string;

  @IsOptional()
  @IsString()
  hoursBilled?: string;

  @IsOptional()
  @IsString()
  openJobs?: string;

  @IsOptional()
  @IsString()
  hires?: string;

  @IsOptional()
  @IsString()
  hired?: string;

  @IsOptional()
  @IsString()
  memberJoined?: string;

  @IsOptional()
  @IsString()
  hireRate?: string;

  @IsOptional()
  @IsString()
  avgHourlyRate?: string;
}

export class ClientDto {
  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsBoolean()
  upworkPlus?: boolean;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  rating?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HistoryDto)
  history?: HistoryDto;

  @IsOptional()
  @IsString()
  numberOfEmployees?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companyAge?: string;

  @IsOptional()
  @IsString()
  funding?: string;

  @IsOptional()
  @IsString()
  currentInterview?: string;

  @IsOptional()
  @IsBoolean()
  decisionMaker?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaHandlesDto)
  socialMediaHandles?: SocialMediaHandlesDto;

  @IsOptional()
  @IsString()
  specialInterest?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientExperienceDto)
  clientsExperience?: ClientExperienceDto;

  @IsOptional()
  @IsString()
  email: string;
}

export class BidQuestionsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  a?: string;
}

export class ProposedTermsDto {
  @IsOptional()
  @IsString()
  profile?: string;

  @IsOptional()
  @IsString()
  rate?: string;

  @IsOptional()
  @IsString()
  receivedAmount?: string;
}

export class BidDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => JobDto)
  jobDetails?: JobDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientDto)
  client?: ClientDto;

  @IsOptional()
  bidProfileInfo?: {
    freelancer?: string;
    agency?: string;
    businessManager?: string;
  };

  @IsOptional()
  @IsString()
  bidCoverLetter?: string;

  @IsNotEmpty()
  @IsString()
  bidProfile?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BidQuestionsDto)
  bidQuestions?: BidQuestionsDto[];

  @IsUrl()
  @IsNotEmpty() 
  @IsString()
  bidURL: string;

  @IsOptional()
  @IsString()
  bidTime?: string;

  @IsOptional()
  @IsString()
  bidder?: string;

  @IsOptional()
  connects?: string;

  @IsOptional()
  @IsBoolean()
  boosted?: boolean;

  @IsOptional()
  @IsBoolean()
  bidResponse?: boolean;

  @IsOptional()
  @IsBoolean()
  invite?: boolean;

  @IsOptional()
  response?: any;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProposedTermsDto)
  proposedTerms?: ProposedTermsDto;

  @IsOptional()
  @IsString()
  jobObjId?: string;

  @IsOptional()
  createdAt?: any;

  @IsOptional()
  updatedAt?: any;

  @IsOptional()
  @IsString()
  rawHtml?: string;

  @IsOptional()
  @IsBoolean()
  migratedData?: boolean
}

// Updated AccountDto using BidDto
export class AccountDto {
  @ValidateNested()
  @Type(() => BidDto)
  bid: BidDto; 

  @IsOptional()
  @IsString()
  monthStart?: string

  @IsOptional()
  @IsString()
  dayStart?: string

  @IsOptional()
  @IsString()
  dayEnd?: string
}
