import { Injectable } from "@nestjs/common";
import { IsArray, IsString } from "class-validator";

@Injectable()
export class FetchProposalDto {

    @IsArray()
    proposals: ProposalDto[]; // Array of proposals

    @IsArray()
    profiles: ProfileDto[]; // Array of profiles

    @IsString()
    userId: string

    @IsString()
    workspaceId: string

}

// DTO for individual proposal
export class ProposalDto {
    proposalUrl: string; 
    profileName: string; 
  }
  
  // DTO for individual profile
  export class ProfileDto {
    id: string;
    name: string;
    accessToken: string;
  }
  
  