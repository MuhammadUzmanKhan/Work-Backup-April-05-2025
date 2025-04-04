import { Injectable } from '@nestjs/common';
import * as Pusher from 'pusher';
import { pusherConfig } from './pusher.config';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class PusherService {
  private pusher: Pusher;
  private subscriptions = new Map<string, Set<string>>(); // channel -> set of userIds
  private filePath = path.resolve(__dirname, 'subscriptions.json');

  constructor() {
    this.pusher = new Pusher(pusherConfig);
  }

  addSubscriber(channel: string, userId: string): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel).add(userId);
    this.saveSubscriptions();
  }

  removeSubscriber(channel: string, userId: string): void {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.get(channel).delete(userId);
      this.saveSubscriptions();
    }
  }

  isUserSubscribed(channel: string, userId: string): boolean {
    return (
      this.subscriptions.has(channel) &&
      this.subscriptions.get(channel).has(userId)
    );
  }

  trigger(channel: string, event: string, data: any): void {
    this.pusher.trigger(channel, event, data);
  }

  // Authenticate a user for a Pusher presence channel
  authenticate(socketId: string, channel: string, userId: string) {
    const presenceData = {
      user_id: userId,
    };
    return this.pusher.authenticate(socketId, channel, presenceData);
  }
  fetchChannelUsers(channelName: string) {
    return this.pusher.get({
      path: `/channels/${channelName}/users`,
    });
  }

  // Save the current subscriptions to a file
  private saveSubscriptions(): void {
    const data = JSON.stringify(
      Array.from(this.subscriptions.entries()).map(([channel, userIds]) => [
        channel,
        Array.from(userIds),
      ]),
    );
    fs.writeFileSync(this.filePath, data);
  }

  // Load subscriptions from the file
  private loadSubscriptions(): void {
    if (fs.existsSync(this.filePath)) {
      const data = fs.readFileSync(this.filePath, 'utf8');
      const entries: [string, string[]][] = JSON.parse(data);
      this.subscriptions = new Map(
        entries.map(([channel, userIds]) => [channel, new Set(userIds)]),
      );
    }
  }

  async getSubscribedUsers(channelName: string): Promise<any> {
    try {
      const response = await this.pusher.get({
        path: `/channels/${channelName}/users`,
      });

      const body = await this.streamToString(response.body as Readable);

      const parsedBody = JSON.parse(body);
      return parsedBody.users;
    } catch (error) {
      console.error('Error fetching subscribed users from Pusher:', error);
      throw new Error('Could not fetch subscribed users from Pusher.');
    }
  }

  // Helper function to convert a ReadableStream to a string
  private async streamToString(stream: Readable): Promise<string> {
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }

  // async getSubscribedUsers(channelName: string): Promise<any> {
  //   try {
  //     // Perform the GET request to the Pusher API
  //     const result = await this.pusher.get({
  //       path: `/channels/${channelName}/users`,
  //       params: {},
  //     });

  //     console.log('🚀 ~ PusherService ~ getSubscribedUsers ~ result:', result);

  //     // Convert the stream to a string
  //     const body = await this.streamToString(
  //       result.body as NodeJS.ReadableStream,
  //     );
  //     console.log('Fetched users:', body);

  //     // Parse and return the users array
  //     return JSON.parse(body).users;
  //   } catch (error) {
  //     console.error('Error fetching subscribed users:', error);
  //     throw new Error('Could not fetch subscribed users.');
  //   }
  // }

  // // Helper function to convert a readable stream to a string
  // private async streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  //   const chunks: Uint8Array[] = [];
  //   return new Promise((resolve, reject) => {
  //     stream.on('data', (chunk) => chunks.push(chunk));
  //     stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  //     stream.on('error', reject);
  //   });
  // }
}
