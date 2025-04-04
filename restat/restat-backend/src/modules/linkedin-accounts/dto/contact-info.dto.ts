import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsArray, IsNotEmpty } from "class-validator";
@Injectable()
export class ContactInfoDto {
    @ApiProperty({
        type: String,
        description: 'Address. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      address?: string;
    
      @ApiProperty({
        type: String,
        description: 'Birthday. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      birthday?: string;
    
      @ApiProperty({
        type: String,
        description: 'Connected date. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      connected?: string;
    
      @ApiProperty({
        type: String,
        description: 'Email. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      email?: string;
    
      @ApiProperty({
        type: String,
        description: 'LinkedIn profile link. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsNotEmpty()
      @IsString()
      linkedinProfileLink?: string;
    
      @ApiProperty({
        type: String,
        description: 'Phone number. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      phone?: string;
    
      @ApiProperty({
        type: String,
        description: 'Twitter handle. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      twitter?: string;
    
      @ApiProperty({
        type: String,
        description: 'Any other account. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      anyOtherAccount?: string;
    
      @ApiProperty({
        type: String,
        description: 'Website. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsString()
      website?: string;
    
      @ApiProperty({
        type: Array,
        description: 'Websites array. This is optional property to create a linkedin account.',
        required: false,
      })
      @IsOptional()
      @IsArray()
      websites?: string[];
}