import * as handlebars from 'handlebars';
import * as fs from 'fs';
import sgMail from '@sendgrid/mail';
import { AttachmentJSON } from '@Common/interfaces';

export const emailSender = async (
  contactPublicData: any,
  templatePath: string,
  subject: string,
  threadId?: string,
) => {
  try {
    const { email, attachments } = contactPublicData;
    const to = email || [process.env.ONTRACK_SUPPORT_EMAIL];

    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(template);

    // Render the template with dynamic data
    const emailContent = compiledTemplate({ ...contactPublicData });

    const isToArray = Array.isArray(to);

    // Create the email message
    const msg = {
      to: isToArray ? to[0] : to, // If `to` is an array, use first recipient; otherwise, use the string as is.
      cc: isToArray && threadId && to.length > 1 ? to.slice(1) : undefined, // BCC only if `to` is an array with more than one recipient
      from: threadId
        ? { email: process.env.LEGAL_PRIVILAGE_EMAIL, name: 'OnTrack Legal' }
        : process.env.ONTRACK_EMAIL,
      subject,
      html: emailContent,
      attachments: attachments?.length ? attachments : undefined,
      ...(threadId && {
        replyTo: `notifications+${threadId}@${process.env.REPLY_DOMAIN}`,
        headers: {
          'Message-ID': `notifications+${threadId}@${process.env.REPLY_DOMAIN}`,
        },
      }), // Add replyTo and headers only if threadId exists
    };

    // Send the email using SendGrid to multiple or single user
    if (to.length > 1) {
      sgMail.sendMultiple(msg);
    } else {
      await sgMail.send(msg);
    }

    return true;
  } catch (error) {
    console.error(error);
  }
};

export const sendEmailUsingTemplate = async (
  data: any,
  templatePath: string,
  subject: string,
  to: string[],
  attachments?: AttachmentJSON[],
) => {
  try {
    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(template);

    // Render the template with dynamic data
    const emailContent = compiledTemplate(data);

    // Create the email message
    const msg = {
      to,
      from: process.env.ONTRACK_EMAIL, // Set the sender email address
      subject,
      html: emailContent,
      attachments,
    };

    // Send the email using SendGrid
    await sgMail.send(msg);

    return true;
  } catch (error) {
    console.log('🚀 ~ error:', error);
  }
};
