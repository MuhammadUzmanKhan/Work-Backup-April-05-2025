import { ApiProperty } from '@nestjs/swagger';

export class PusherChannelsDto {
  @ApiProperty({ description: "Events are 'all' and 'event_id' " })
  'events-channel': string;

  @ApiProperty({ description: "Events are 'event_id' " })
  'events-comments-channel': string;

  @ApiProperty({ description: "Events are 'event_id' " })
  'events-changelog-channel': string;

  @ApiProperty({ description: "Events are 'event_id' " })
  'events-attachment-channel': string;

  @ApiProperty({ description: "Events are 'subtask_id' " })
  'events-subtask-attachment-channel': string;

  @ApiProperty({ description: "Events are 'all' and 'user_id' " })
  'user-channel': string;

  @ApiProperty({ description: "Events are 'all' and 'event_id' " })
  'departments-channel': string;

  @ApiProperty({ description: "Events 'event_id' " })
  'incident-division': string;

  @ApiProperty({ description: "Events 'event_id' " })
  'associate-departments-channel': string;

  @ApiProperty({ description: "Events 'event_id' " })
  'disassociate-departments-channel': string;

  @ApiProperty({ description: "Events 'event_id' " })
  'disassociate-incident-division': string;

  @ApiProperty({ description: "Events 'event_id' " })
  'user-channel-upload-csv': string;

  @ApiProperty({
    description:
      "Channel 'tasks-channel-event_id' event_id is an integer concatenate with tasks-channel-  and Event to be trigger is 'task-channel-upload-csv'",
  })
  'tasks-channel-event_id': string;
}
