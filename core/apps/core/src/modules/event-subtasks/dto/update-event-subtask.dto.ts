import { PartialType } from '@nestjs/swagger';
import { CreateEventSubtaskDto } from './create-event-subtask.dto';

export class UpdateEventSubtaskDto extends PartialType(CreateEventSubtaskDto) {}
