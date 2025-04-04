import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { StaffInShiftSortingColumns } from '@Common/constants';

export class GetShiftByIdDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'To search through name of Vendor, Role, QR ID.',
  })
  @IsOptional()
  @IsString()
  keyword!: string;

  @ApiPropertyOptional({ description: 'Pass ASC or DESC' })
  @IsOptional()
  @IsEnum(SortBy)
  order!: SortBy;

  @ApiPropertyOptional({
    description:
      'Sorting column can be vendor_name, position, checked_in, checked_out, qr_code',
  })
  @IsOptional()
  @IsEnum(StaffInShiftSortingColumns)
  sort_column!: StaffInShiftSortingColumns;
}
