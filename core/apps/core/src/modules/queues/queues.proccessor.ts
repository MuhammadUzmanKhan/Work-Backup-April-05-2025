import { Processor, Process } from '@nestjs/bull';
import { Op } from 'sequelize';
import {
  BullProcesses,
  BullQueues,
  TemplateNames,
  GlobalRoles,
  AdminRoles,
} from '@ontrack-tech-group/common/constants';
import {
  checkUserNotificationSettingEmailPermission,
  CommunicationService,
  createNotification,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { User, UserCompanyRole } from '@ontrack-tech-group/common/models';
import { getUserDetail } from '@ontrack-tech-group/common/helpers';
import { getCompanyParentId } from '@Common/helpers';

@Processor(BullQueues.EVENT)
export class QueueProcessor {
  constructor(
    private readonly communicationService: CommunicationService,
    private readonly pusherService: PusherService,
  ) {}

  @Process(BullProcesses.SEND_EVENT_PLAN_NOTIFICATION)
  async handleEventPlanEmailNotification(job) {
    const {
      data: { notificationData },
    } = job;

    await this.sendNotification(notificationData);
  }

  /**
   * This function sends email to list of presets immediately when this function called
   */
  private async sendNotification(notificationData) {
    const {
      messageBody,
      emailBody,
      subject,
      event_id,
      company_id,
      module,
      message_html,
      message,
      type,
    } = notificationData;

    const companyId: number[] = [company_id];
    let userParentCompany;

    const parentCompany = await getCompanyParentId(company_id);

    if (parentCompany) companyId.push(parentCompany.parent_id);

    const users = await User.findAll({
      attributes: ['id'],
      include: [
        {
          model: UserCompanyRole,
          where: {
            role_id: {
              [Op.in]: [...GlobalRoles, ...AdminRoles],
            },
            company_id: {
              [Op.in]: companyId,
            },
          },
        },
      ],
    });

    const user_ids = users.map((data) => data.id);

    const { userEmails, userNumbers } =
      await checkUserNotificationSettingEmailPermission(user_ids, module, type);

    if (user_ids?.length) {
      const notification = await createNotification(
        {
          message,
          message_html,
          module,
          type,
          company_id,
          module_id: event_id,
        },
        user_ids,
      );

      for (const user_id of user_ids) {
        if (parentCompany) {
          userParentCompany = await getUserDetail(
            user_id,
            parentCompany?.parent_id,
          );
        }
        const notificationData = {
          id: notification.id,
          user_id,
          message,
          message_html,
          module,
          type,
          company_id: userParentCompany ? parentCompany?.parent_id : company_id,
          module_id: event_id,
          unread: true,
        };

        this.pusherService.sendNotificationSocket(notificationData);
      }
    }

    try {
      if (userEmails?.length) {
        await this.communicationService.communication(
          {
            data: { email: userEmails, ...emailBody },
            template: TemplateNames.EVENT_COMMENT_MENTION,
            subject,
          },
          'send-email',
        );
      }
    } catch (err) {
      console.log('🚀 ~ QueueProcessor ~ sendNotification ~ error:', err);
    }

    try {
      if (userNumbers?.length) {
        await this.communicationService.communication(
          {
            messageBody,
            userNumbers,
          },
          'send-message',
        );
      }
    } catch (err) {
      console.log('🚀 ~ QueueProcessor ~ sendNotification ~ err:', err);
    }
  }
}
