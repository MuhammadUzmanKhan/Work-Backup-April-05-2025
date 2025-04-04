import axios from 'axios';
import { NotFoundException } from '@nestjs/common';
import { throwCatchError } from '@ontrack-tech-group/common/helpers';
import { CommunicationService } from '@ontrack-tech-group/common/services';
import {
  Chat,
  Event,
  Incident,
  LegalGroup,
} from '@ontrack-tech-group/common/models';
import {
  Options,
  RESPONSES,
  TemplateNames,
} from '@ontrack-tech-group/common/constants';
import { WhereOptions } from 'sequelize';

export const isLegalGroupExists = async (
  incident_id: number,
  thread_id?: number,
  options?: Options,
) => {
  const _where: WhereOptions = {};

  if (incident_id) {
    _where['incident_id'] = incident_id;
  } else {
    _where['thread_id'] = thread_id;
  }

  // Check if the legal_group_id exists
  const legalGroup = await LegalGroup.findOne({
    where: _where,
    attributes: [
      'id',
      'incident_id',
      'status',
      'thread_id',
      'participants',
      'company_id',
    ],
    include: [
      {
        model: Incident,
        attributes: ['event_id'],
        include: [
          {
            model: Event,
            attributes: ['time_zone'],
          },
        ],
      },
    ],
    ...options,
  });

  if (!legalGroup) {
    throw new NotFoundException(RESPONSES.notFound('Legal Group'));
  }

  return legalGroup;
};

// get data from email response using regex
export const emailResponseRegex = async (body: any) => {
  const from = body.from || '';
  const emailMatch = from.match(/<(.*)>/); // creating regex to get email from response
  const senderEmail = emailMatch ? emailMatch[1] : from; // matching email from body from
  const senderName = from.replace(/<.*>/, '').trim(); // Remove email, keep only name

  // Extract thread_id from the "envelope" field
  let thread_id = null;

  const replyDomain = process.env.REPLY_DOMAIN;

  // Escape dots in replyDomain for regex
  const escapedDomain = replyDomain.replace(/\./g, '\\.');

  // for single reply & not forwarded case
  if (!thread_id) {
    const extractThreadId = (email: string) =>
      email?.match(
        new RegExp(`notifications\\+([a-f0-9-]+)@${escapedDomain}`),
      )?.[1];

    thread_id = extractThreadId(body.to) || extractThreadId(body.cc) || null;
  }

  // for reply all case & multiple emails
  // If thread_id is not found in the envelope, fall back to the "to" field
  if (!thread_id) {
    const toEmail = body.to || '';

    const threadIdMatch = toEmail.match(
      `notifications\\+([a-f0-9-]+)@${escapedDomain}`,
    );
    thread_id = threadIdMatch ? threadIdMatch[1] : null;
  }

  // Extract the actual message (plain text)
  let message = '';
  if (body.email) {
    // regex to match the "Content-Type: text/plain" header, making it more universally applicable to your email form
    const regex =
      /Content-Type: text\/plain[^]*?\r\n\r\n([\s\S]*?)\r\n\r\nOn\s[A-Za-z]+,/;

    const match = body.email.match(regex);
    if (match) message = match[1].trim();
  }

  return {
    senderEmail,
    senderName,
    thread_id,
    message,
  };
};

export const sendLegalChatEmail = async (
  communicationService: CommunicationService,
  legalGroup: LegalGroup,
  message: string,
  is_attachment: boolean,
  attachment_name: string,
) => {
  if (!legalGroup.participants.length) return;

  try {
    let textMessage = message;
    const attachments = [];
    let attachmentLink = null;

    // If the message is an attachment link
    if (is_attachment && message.startsWith('http')) {
      try {
        // Download the file from the provided URL
        const response = await axios.get(message, {
          responseType: 'arraybuffer',
        });
        const fileData = Buffer.from(response.data).toString('base64');

        // Extract file extension from URL (e.g. pdf, csv, etc.)
        const match = message.match(/\.(\w+)$/);
        const fileExt = match ? match[1] : 'dat';

        // Build attachment object
        attachments.push({
          filename: attachment_name || `Attachment.${fileExt}`,
          content: fileData,
          // A basic mapping for MIME type, adjust if needed:
          type:
            fileExt === 'pdf'
              ? 'application/pdf'
              : fileExt === 'csv'
                ? 'text/csv'
                : fileExt.startsWith('doc')
                  ? 'application/msword'
                  : 'application/octet-stream',
          disposition: 'attachment',
        });

        // Clear the text message since it's an attachment
        textMessage = null;
        attachmentLink = message;
      } catch (error) {
        console.error('Error downloading attachment:', error);
        throwCatchError(error);
      }
    }

    await communicationService.communication(
      {
        data: {
          email: legalGroup.participants,
          incident_id: legalGroup.incident_id,
          message: textMessage,
          attachmentLink,
          attachmentName: attachment_name,
          attachments: attachments.length ? attachments : undefined,
          hasAttachment: attachments.length > 0,
        },

        template: TemplateNames.LEGAL_CHAT,
        subject: `[OnTrack Legal] Re: #${legalGroup.incident_id}`,
        threadId: legalGroup.thread_id,
      },
      'send-email',
    );
  } catch (err) {
    console.error('🚀 ~ Error sending legal chat email:', err);
  }
};

export const getLegalLogCount = async (legal_group_id: number) => {
  return await Chat.count({
    where: { legal_group_id },
  });
};
