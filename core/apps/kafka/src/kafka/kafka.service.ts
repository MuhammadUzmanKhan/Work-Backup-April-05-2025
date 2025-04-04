import { Injectable } from '@nestjs/common';
import moment from 'moment';
import {
  Consumer,
  EachMessagePayload,
  Partitioners,
  Producer,
  logLevel,
} from 'kafkajs';
import {
  Department,
  DepartmentUsers,
  User,
} from '@ontrack-tech-group/common/models';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import {
  PolymorphicType,
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import _ from 'lodash';

import { _MESSAGES } from '@Common/constants/responses';
import { UserLocationDto } from './dto';
import { checkUserAgainstEvent, upsertUserLocation } from './helper';
import { kafkaConfig, groupId, topic } from './helper/kafka.config';
import { MyKafka } from '../common/class/MyKafka';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class KafkaService {
  private producer: Producer;
  private consumer: Consumer;
  private totalRecords: Array<
    UserLocationDto & {
      event_id: number;
      locationable_id: number;
      locationable_type: 'User';
      user_id: number;
    }
  >;

  constructor(
    private readonly pusherService: PusherService,
    private readonly sequelize: Sequelize,
  ) {
    const kafka = new MyKafka(
      {
        ...kafkaConfig,
        logLevel: logLevel.INFO,
      },
      groupId,
      {
        metadataMaxAge: 0,
        allowAutoTopicCreation: false,
        createPartitioner: Partitioners.LegacyPartitioner,
      },
    );
    kafka.createTopic(topic);

    this.producer = kafka.getProducer();
    this.consumer = kafka.getConsumer();

    this.consumeEachMessage();
  }

  async consumeEachMessage() {
    await this.consumer.subscribe({
      topic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message: payload,
      }: EachMessagePayload) => {
        const locationData = JSON.parse(payload.value.toString());

        if (!this.totalRecords) this.totalRecords = [];

        this.totalRecords.push(locationData);

        // Removing duplicates and keep the latest one
        this.totalRecords = _.uniqBy(
          this.totalRecords,
          (item) =>
            `${item.locationable_id}-${item.locationable_type}-${item.event_id}`,
        ).reverse() as Array<
          UserLocationDto & {
            event_id: number;
            locationable_id: number;
            locationable_type: 'User';
            user_id: number;
          }
        >;

        const { user_id, event_id, longitude, latitude, user } = locationData;

        // Retrieve department_id associated with the current user and determine the departments linked to the user.
        // The socket will be subscribed based on this department_id and the corresponding event_id.
        const departmentUser = await DepartmentUsers.findOne({
          where: { user_id: user.id },
          attributes: ['department_id'],
          include: [
            {
              model: Department,
              attributes: [],
              where: { company_id: locationData['company_id'] },
            },
          ],
        });
        const department_id = departmentUser?.['department_id'];

        // for web
        this.pusherService.sendDataUpdates(
          `${PusherChannels.LOCATION_CHANNEL}`,
          [PusherEvents.USER_LOCATION],
          {
            latitude,
            longitude,
            event_id,
            user_id,
            updated_at: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
          },
        );

        // for iOS
        const channelName = department_id
          ? `${PusherChannels.LOCATION_CHANNEL}-${event_id}-${department_id}`
          : `${PusherChannels.LOCATION_CHANNEL}-${event_id}`;

        this.pusherService.sendDataUpdates(
          channelName,
          [PusherEvents.USER_LOCATION],
          {
            latitude,
            longitude,
            event_id,
            user_id,
            user,
            updated_at: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
          },
        );

        setInterval(async () => {
          if (this.totalRecords.length) {
            const isSaved = await upsertUserLocation(
              this.totalRecords,
              this.sequelize,
            );
            if (isSaved) this.totalRecords = [];
          }
        }, +process.env.KAFKA_DB_OPERATION_INTERVAL || 5000);

        await this.consumer.commitOffsets([
          { topic, partition, offset: payload.offset },
        ]);
      },
    });
  }

  async createUserLocation(createUserLocationDto: UserLocationDto, user: User) {
    const { event_id } = createUserLocationDto;

    const [company_id] = await withCompanyScope(user, event_id);

    await checkUserAgainstEvent(user.id, event_id);

    return await this.createLocationInKafka(
      createUserLocationDto,
      company_id,
      user,
    );
  }

  async createLocationInKafka(
    locationData: UserLocationDto,
    company_id: number,
    user: User,
  ) {
    const message = JSON.stringify({
      ...locationData,
      user,
      company_id,
      locationable_id: user.id,
      locationable_type: PolymorphicType.USER,
      user_id: user.id,
    });

    try {
      await this.producer.send({
        topic,
        messages: [{ value: message }],
      });

      return { message: _MESSAGES.LOCATION_CREATED_SUCCESSFULLY };
    } catch (e) {
      console.log('error in queuing message in kafka: ', e);

      return { message: _MESSAGES.ERROR_CREATING_LOCATION };
    }
  }
}
