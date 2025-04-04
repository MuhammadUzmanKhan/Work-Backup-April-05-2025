import { IsString, IsBoolean, IsOptional, IsUrl, IsUUID } from 'class-validator';

export class CreateManualBidDto {

  @IsUUID()
  bidProfileId: string; // Required

  @IsOptional()
  @IsString()
  bidCoverLetter?: string;

  @IsOptional()
  @IsString()
  bidProfileFreelancer?: string;

  @IsOptional()
  @IsString()
  bidProfileAgency?: string;

  @IsOptional()
  @IsString()
  bidProfileBusinessManager?: string;

  @IsUUID()
  userId: string; // Required

  @IsUrl()
  upworkProposalUrl: string; // Required

  @IsOptional()
  @IsString()
  connects?: string;

  @IsOptional()
  @IsBoolean()
  boosted?: boolean;

  @IsOptional()
  @IsBoolean()
  bidResponse?: boolean;

  @IsOptional()
  @IsString()
  responseDate?: string;

  @IsOptional()
  @IsString()
  contractDate?: string;

  @IsOptional()
  @IsBoolean()
  invite?: boolean;

  @IsOptional()
  @IsString()
  proposedProfile?: string;

  @IsOptional()
  @IsString() // Optional, changed to string
  proposedRate?: string;

  @IsOptional()
  @IsString() // Optional, changed to string
  receivedAmount?: string;

  @IsUrl()
  jobUrl: string; // Required

  @IsString()
  jobTitle: string; // Required

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  jobPosted?: string;

  @IsString()
  contactName: string; // Required

  @IsOptional()
  @IsString()
  contactCountry?: string;

  @IsOptional()
  @IsString()
  contactState?: string;

  @IsBoolean()
  isManual: boolean; // Required
}
