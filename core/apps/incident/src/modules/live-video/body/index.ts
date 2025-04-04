import {
  LiveVideoMode,
  LiveVideoStreamingRequest,
  LiveVideoTokenRole,
} from '@Common/constants';
import { CreateLiveVideoDto, GenerateTokenDto } from '../dto';

export const createLiveVideoBody = {
  type: CreateLiveVideoDto,
  examples: {
    example: {
      value: {
        department_id: 387,
        channel_name: 'Channel Name',
        video_id: 4108,
        uid: '2321',
        video_type: 'Incident',
        video_mode: LiveVideoMode.NOT_START,
        streaming_request: LiveVideoStreamingRequest.PENDING,
        location: {
          latitude: '36.2774504',
          longitude: '-115.0166152',
        },
        event_id: 1970,
        channel_id: 'Channel Id',
        role: 'publisher',
        publisher_name: 'XYZ',
      },
    },
  },
};

export const generateToken = {
  type: GenerateTokenDto,
  examples: {
    example: {
      value: {
        channel_name: 'string',
        uid: 2321,
        role: LiveVideoTokenRole.PUBLISHER,
      },
    },
  },
};
