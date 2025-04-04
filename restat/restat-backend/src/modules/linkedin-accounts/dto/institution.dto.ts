import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
@Injectable()
export class InstitutionDto {
  @ApiProperty({
    type: String,
    description:
      "Name. This is required property to create an institution.",
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'CreatedAt time in dateTime format. This is a required property to create bid.',
  })
  @IsOptional()
  createdAt?: string;

  @ApiProperty({
    type: String,
    description: 'UpdatedAt in dateTime format. This is a required property to create bid.',
  })
  @IsOptional()
  updatedAt?: string;
}
