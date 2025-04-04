import * as dotenv from 'dotenv';
import { User } from '@ontrack-tech-group/common/models';
import { getTags } from './helpers';

const Mailchimp = require('mailchimp-api-v3');

dotenv.config();

export class MailChimpService {
  private readonly mailchimp: any;

  constructor() {
    this.mailchimp = new Mailchimp(process.env.MAILCHIMP_API_KEY);
  }

  /**
   * @description To add contact in MailChimp using their POST API call
   */
  async addContact(
    email: string,
    first_name: string,
    last_name: string,
    user_id: number,
    company_id: number,
  ) {
    try {
      const tags = await getTags(user_id, company_id);

      if (!tags.length) return;

      await this.mailchimp.post(
        `/lists/${process.env.MAILCHIMP_LIST_ID}/members`,
        {
          tags,
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: first_name,
            LNAME: last_name,
          },
        },
      );
    } catch (error) {
      console.log('🚀 ~ MailChimpService ~ error:', error);
    }
  }

  async updateContact(oldUserData: User, updatedUserData: User) {
    try {
      const updatedFields: any = {};

      if (oldUserData['email'] !== updatedUserData['email'])
        updatedFields.email_address = updatedUserData['email'];
      if (oldUserData['first_name'] !== updatedUserData['first_name'])
        updatedFields.FNAME = updatedUserData['first_name'];
      if (oldUserData['last_name'] !== updatedUserData['last_name'])
        updatedFields.LNAME = updatedUserData['last_name'];
      if (oldUserData['demo_user'] !== updatedUserData['demo_user'])
        updatedFields.demo_user = updatedUserData['demo_user'];

      if (Object.keys(updatedFields).length === 0) {
        return; // No changes to update
      }

      await this.mailchimp.put(
        `/lists/${process.env.MAILCHIMP_LIST_ID}/members/${oldUserData['email']}`,
        {
          email_address: updatedFields.email_address,
          status: updatedUserData['demo_user'] ? 'unsubscribed' : 'subscribed',
          merge_fields: {
            FNAME: updatedFields.FNAME,
            LNAME: updatedFields.LNAME,
          },
        },
      );
    } catch (error) {
      console.log('🚀 ~ MailChimpService ~ error:', error);
    }
  }

  /**
   * @description To update the contact status in MailChimp to Subscribe or Unsubscribe on blocking or unblocking a user from system
   */
  async updateContactStatus(is_blocked: boolean, email: string) {
    try {
      await this.mailchimp.put(
        `/lists/${process.env.MAILCHIMP_LIST_ID}/members/${email}`,
        {
          status: is_blocked ? 'unsubscribed' : 'subscribed',
        },
      );
    } catch (error) {
      console.log(
        '🚀 ~ MailChimpService ~ updateContactStatus ~ error:',
        error,
      );
    }
  }
}
