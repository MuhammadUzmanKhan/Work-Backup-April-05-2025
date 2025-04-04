import { IsString, IsOptional, IsNotEmpty, IsUrl, IsDateString } from 'class-validator';

export class CreateNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    notice: string;

    @IsOptional()
    @IsUrl()
    callToAction?: string;

    @IsNotEmpty()
    @IsDateString()
    startDate: Date;

    @IsNotEmpty()
    @IsDateString()
    endDate: Date;
}
