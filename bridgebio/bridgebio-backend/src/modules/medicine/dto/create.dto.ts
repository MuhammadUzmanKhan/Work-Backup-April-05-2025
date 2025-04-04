import {
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsObject,
    IsString
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicineDto {
    @ApiProperty({
        description: 'Disease name',
        example: 'Flu'
    })
    @IsNotEmpty()
    @IsString()
    disease: string;

    @ApiProperty({
        description: 'Therapy type',
        example: 'Antiviral'
    })
    @IsNotEmpty()
    @IsString()
    therapy: string;

    @ApiPropertyOptional({
        description: 'Published status',
        example: true
    })
    @IsOptional()
    @IsBoolean()
    published?: boolean;

    @ApiPropertyOptional({
        description: 'Additional configuration details',
        example: { dosage: '50mg' }
    })
    @IsOptional()
    @IsObject()
    additionalConfiguration?: object;
}
