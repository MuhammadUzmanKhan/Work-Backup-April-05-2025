import { IntersectionType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { StaffIdsDto } from '@Modules/staff/dto';
export class CreateNoteDto extends IntersectionType(
  StaffIdsDto,
  EventIdQueryDto,
) {
  @IsNotEmpty({ message: 'Message should not be empty' })
  @IsString()
  message!: string;
}
