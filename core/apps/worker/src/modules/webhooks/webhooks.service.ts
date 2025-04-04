import { Injectable, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessageTypeInMessages,
  OptInOptions,
  OptOutOptions,
  PolymorphicType,
} from '@ontrack-tech-group/common/constants';
import {
  Camper,
  Event,
  Message,
  OptoutNumbers,
  Reservation,
} from '@ontrack-tech-group/common/models';
import { Op, Sequelize } from 'sequelize';
import Telnyx from 'telnyx';

@Injectable()
export class WebhooksService {
  telnyx: Telnyx;

  constructor(private readonly configService: ConfigService) {
    // Initializing Telnyx
    this.telnyx = Telnyx(this.configService.get('TELNYX_API_KEY'));
  }

  async telnyxWebhook(
    _req: RawBodyRequest<Request>,
    query: { event_id: number },
    webhookData: any,
  ) {
    try {
      // This console should not be removed. It will help us in debugging and finding issues related to webhooks.
      console.log(
        'WEBHOOK DATA: ',
        webhookData,
        webhookData.data?.payload?.to[0],
        webhookData.data?.payload?.from,
      );

      const { data } = webhookData;
      const cell = data?.payload?.to[0].phone_number;

      //Checking if autoresponse_type value is available in webhook or not and storing it in variable so no need to chain again.
      const autoresponse_type: string = data?.payload?.autoresponse_type;

      if (data?.event_type === 'message.received') {
        if (OptInOptions[autoresponse_type?.toUpperCase()]) {
          //Start and unstop are the cases for opt-in, so we will delete record from optout tables.
          await OptoutNumbers.destroy({ where: { cell } });
        } else if (
          OptOutOptions[autoresponse_type?.toUpperCase()] ||
          autoresponse_type === OptOutOptions.STOP_ALL
        ) {
          await OptoutNumbers.findOrCreate({ where: { cell } });
        }

        // Finding event if exist and then finding camper by using the from number in webhook data.
        const event = await Event.findByPk(query.event_id);
        if (event) {
          const camper = await Camper.findOne({
            where: Sequelize.where(
              Sequelize.fn(
                'concat',
                Sequelize.col('country_code'),
                Sequelize.col('cell'),
              ),
              {
                [Op.like]: `${data?.payload?.from.phone_number}`,
              },
            ),
            include: [
              {
                model: Reservation,
                attributes: ['id', 'event_id'],
                where: { event_id: event.id },
              },
            ],
            raw: true,
          });

          // Creating message if camper found
          if (camper) {
            await Message.create({
              messageable_id: camper.id,
              messageable_type: PolymorphicType.CAMPER,
              company_id: event.company_id,
              sender_id: camper.id,
              message_type: MessageTypeInMessages.RECEIVED,
              unread: true,
              receiver_name: camper.name,
              sender_name: camper.name,
              text: data?.payload.text,
              event_id: event.id,
              guest_country_code: camper.country_code,
              guest_country_iso_code: camper.country_iso_code,
            });
          }
        }
      }
    } catch (err) {
      console.log('Error in webhook: ', err);
      throw new Error(err.message);
    }

    return 'success';
  }
}
