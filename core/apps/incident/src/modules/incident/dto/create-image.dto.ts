import { IsNumber, IsString } from 'class-validator';

export class CreateImageDto {
  @IsNumber()
  incident_id!: number;

  @IsString()
  name!: string;

  @IsString()
  url!: string;
}
