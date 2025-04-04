import { KafkaConfig } from 'kafkajs';

export const kafkaConfig: KafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID,
  brokers: process.env.KAFKA_BROKERS.split(','),
  ssl: true,
  connectionTimeout: 10000,
};

export const groupId: string = process.env.KAFKA_GROUP_ID;

export const topic: string = process.env.KAFKA_TOPIC;
