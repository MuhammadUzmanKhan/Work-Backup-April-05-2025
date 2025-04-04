import {
  Admin,
  Consumer,
  ICustomPartitioner,
  Kafka,
  KafkaConfig,
  Producer,
} from 'kafkajs';

export class MyKafka {
  private kafka: Kafka;
  private admin: Admin;
  private producer: Producer;
  private consumer: Consumer;
  private isAlreadyConnected: {
    admin: boolean;
    consumer: boolean;
    producer: boolean;
  };

  constructor(
    kafkaConfig: KafkaConfig,
    groupId: string,
    producerConfig: {
      metadataMaxAge: number;
      allowAutoTopicCreation: boolean;
      createPartitioner: ICustomPartitioner;
    },
  ) {
    this.kafka = new Kafka(kafkaConfig);

    this.producer = this.kafka.producer(producerConfig);

    this.consumer = this.kafka.consumer({
      groupId,
    });

    this.admin = this.kafka.admin();

    this.connect();
  }

  getKafka() {
    return this.kafka;
  }

  getAdmin() {
    return this.admin;
  }

  getConsumer() {
    return this.consumer;
  }

  getProducer() {
    return this.producer;
  }

  async connect(
    admin: boolean = true,
    consumer: boolean = true,
    producer: boolean = true,
  ) {
    if (admin && !this.isAlreadyConnected?.admin) {
      await this.admin.connect();
      this.isAlreadyConnected = {
        ...this.isAlreadyConnected,
        admin: true,
      };
    }

    if (producer && !this.isAlreadyConnected?.producer) {
      await this.producer.connect();
      this.isAlreadyConnected = {
        ...this.isAlreadyConnected,
        producer: true,
      };
    }

    if (consumer && !this.isAlreadyConnected?.consumer) {
      await this.consumer.connect();
      this.isAlreadyConnected = {
        ...this.isAlreadyConnected,
        consumer: true,
      };
    }
  }

  async disconnect(disconnect: 'producer' | 'consumer' | 'admin') {
    switch (disconnect) {
      case 'admin':
        await this.admin.disconnect();
        break;

      case 'producer':
        await this.producer.disconnect();
        break;

      case 'consumer':
        await this.consumer.disconnect();
        break;
    }
  }

  async createTopic(topic: string) {
    await this.connect();

    const topics = await this.listTopics();

    if (!topics.includes(topic)) {
      try {
        await this.admin.createTopics({
          topics: [{ topic, numPartitions: 1, replicationFactor: 2 }],
          waitForLeaders: true,
        });
      } catch (error) {
        console.log('error creating kafka topic : ', error);
      }
    }
  }

  async checkTopicPartition(topic: string) {
    try {
      const topicMetadata = await this.admin.fetchTopicMetadata({
        topics: [topic],
      });

      topicMetadata.topics.forEach((topic) => {
        topic.partitions.forEach((partition) => {
          console.log(
            `Partition: ${JSON.stringify(partition)}, Leader: ${partition.leader}`,
          );
        });
      });

      console.log('Topic Metadata:', topicMetadata);
    } catch (error) {
      console.log('🚀 ~ MyKafka ~ checkTopicPartition ~ error:', error);
    }
  }

  async listTopics() {
    let topics = [];
    try {
      await this.connect();

      topics = await this.admin.listTopics();
    } catch (error) {
      console.error('Error listing topics:', error);
    }

    return topics;
  }

  async deleteTopic(topic: string) {
    try {
      await this.admin.deleteTopics({
        topics: [topic],
      });
    } catch (error) {
      console.log('error in deleting topic: ', error);
    }
  }
}
