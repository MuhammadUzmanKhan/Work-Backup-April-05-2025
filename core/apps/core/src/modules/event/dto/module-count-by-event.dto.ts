import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventModuleFuture } from '@Common/constants';

export class GetModuleCountForAnEvent {
  @ApiProperty({
    description: 'Modules can be incident_future, task_future',
  })
  @IsEnum(EventModuleFuture)
  module: EventModuleFuture;
}
