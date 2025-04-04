import { IsString, IsOptional, IsNotEmpty, IsUrl, IsDateString } from 'class-validator';

export class UpdateNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    notice: string;

    @IsOptional()
    @IsUrl()
    callToAction?: string;

    @IsDateString()
    startDate: Date;

    @IsDateString()
    endDate: Date;
}
