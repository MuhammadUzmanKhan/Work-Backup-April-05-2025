import { IsString, IsOptional, IsNotEmpty, IsDateString, IsBoolean } from 'class-validator';

export class CreateNotificationDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    notice: string;

    @IsOptional()
    @IsBoolean()
    maintainceMode?: boolean;

    @IsOptional()
    @IsString()
    callToAction?: string;

    @IsNotEmpty()
    @IsDateString()
    startDate: Date;

    @IsNotEmpty()
    @IsDateString()
    endDate: Date;

    @IsOptional()
    @IsBoolean()
    visibleOnWeb?: boolean;

    @IsOptional()
    @IsBoolean()
    visibleOnExtension?: boolean;
}
