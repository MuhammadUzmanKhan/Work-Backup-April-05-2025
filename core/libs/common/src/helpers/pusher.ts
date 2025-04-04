import { FindAttributeOptions, Op, Sequelize } from 'sequelize';
import { Literal } from 'sequelize/types/utils';
import Pusher from 'pusher';
import { IncidentDivision, User } from '../models';

export const getUserIdsFromUserSpecificChannel = (
  channels: string[],
): number[] => {
  const userIds: number[] = [];
  for (const channel of channels) {
    userIds.push(Number(channel.split('-').pop()));
  }

  return [...new Set(userIds)];
};

export const getUsersData = async (
  userIds: number[],
  companyId: number,
  incident_id?: number,
) => {
  return (
    await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: getUsersDataAttributes(companyId, incident_id),
      include: [
        {
          model: IncidentDivision,
          through: { attributes: [] },
          attributes: [
            [
              Sequelize.literal('CAST("incident_divisions"."id" AS INTEGER)'),
              'id',
            ],
          ],
        },
      ],
      useMaster: true,
    })
  ).map((user) => ({
    ...user.toJSON(),
    incident_divisions: user.incident_divisions.map((division) => division.id),
  }));
};

export const extractUserIdAndCompanyIdFromChannel = (
  channel: string,
): { userId: number; companyId: number } => {
  const parts = channel.split('-');
  const companyId = Number(parts[parts.length - 3]); // Third-to-last part is companyId
  const userId = Number(parts[parts.length - 1]); // Last part is userId

  return { userId, companyId };
};
// Helper function to delay execution
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const sendBatchesWithDelay = async (
  pusher: Pusher,
  channels: string[],
  events: string[],
  message: any,
  batchSize = 50,
  delayMs = 1000,
) => {
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);

    events.forEach(async (event) => {
      // Trigger the message for this batch
      await pusher.trigger(batch, event, message);
    });

    // If not the last batch, wait for the delay before sending the next batch
    if (i + batchSize < channels.length) {
      console.log(`Waiting ${delayMs}ms before sending the next batch...`);
      await delay(delayMs); // Delay before processing the next batch
    }
  }
};

export const sendBatchesWithDelayWithIndivisualMessages = async (
  pusher: Pusher,
  channelAndMessage: { channel: string; data: any }[],
  events: string[],
  batchSize = 50,
  delayMs = 1000,
) => {
  for (let i = 0; i < channelAndMessage.length; i += batchSize) {
    const batch = channelAndMessage.slice(i, i + batchSize);

    events.forEach(async (event) => {
      // Trigger the message
      for (const { channel, data } of batch) {
        await pusher.trigger(channel, event, data);
      }
    });

    // If not the last batch, wait for the delay before sending the next batch
    if (i + batchSize < channelAndMessage.length) {
      console.log(`Waiting ${delayMs}ms before sending the next batch...`);
      await delay(delayMs); // Delay before processing the next batch
    }
  }
};

const getUsersDataAttributes = (
  companyId: number,
  incidentId?: number,
): FindAttributeOptions => {
  const attributes: FindAttributeOptions = [
    'id',
    [
      Sequelize.literal(`(
            SELECT
              CASE
                WHEN "ucr"."role_id" = 0 THEN 0
                WHEN "ucr"."role_id" = 28 THEN 28
                ELSE "roles"."id"
              END
            FROM "roles"
            INNER JOIN "users_companies_roles" AS "ucr" ON "roles".id = "ucr"."role_id"
            WHERE "ucr"."user_id" = "User"."id"
            AND (
              "ucr"."role_id" IN (0, 28)
              OR "ucr"."company_id" = ${companyId}
            )
            LIMIT 1
          )`) as Literal,
      'role',
    ],
  ];

  if (incidentId) {
    attributes.push([
      Sequelize.literal(`
        (
         SELECT 
        CASE 
          WHEN EXISTS ( 
            SELECT 1 
            FROM (
              SELECT *
              FROM comments AS COMMENT
              WHERE 
                COMMENT.commentable_id = ${incidentId}
                AND COMMENT.commentable_type = 'Incident'
              ORDER BY COMMENT.created_at DESC
              LIMIT 1
            ) AS latest_comment
            WHERE NOT EXISTS (
              SELECT 1 
              FROM incident_comment_statuses AS comment_status
              WHERE comment_status.incident_id = latest_comment.commentable_id
                AND comment_status.user_id = "User"."id"
                AND latest_comment.created_at < comment_status.updated_at
            )
          )
          THEN TRUE 
          ELSE FALSE 
        END
        )
      `) as Literal,
      'has_unread_comments',
    ]);
  }

  return attributes;
};
