import { IsString, IsOptional, IsNotEmpty, IsDateString, IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    notice: string;

    @IsOptional()
    @IsString()
    callToAction?: string;

    @IsDateString()
    startDate: Date;

    @IsDateString()
    endDate: Date;

    @IsOptional()
    @IsBoolean()
    visibleOnWeb?: boolean;

    @IsOptional()
    @IsBoolean()
    visibleOnExtension?: boolean;
}
