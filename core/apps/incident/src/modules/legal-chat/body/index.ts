import { SendLegalMessageDto } from '../dto';

export const sendLegalMessage = {
  type: SendLegalMessageDto,
  examples: {
    Example: {
      value: {
        incident_id: 7,
        message: 'This is a test message',
        is_attachment: false,
      },
    },
    'Chat-With-Attachment': {
      value: {
        incident_id: 7,
        message: 'www.s3-attachment-link.com',
        is_attachment: true,
        attachment_name: 's3 attachment link',
      },
    },
  },
};
