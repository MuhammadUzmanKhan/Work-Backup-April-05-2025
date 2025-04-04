import { IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';

export class GetBudgetSummaryPdfDto extends EventIdQueryDto {
  @IsString()
  filename: string;
}
