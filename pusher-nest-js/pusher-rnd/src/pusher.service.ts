// pusher.service.ts
import { Injectable } from '@nestjs/common';
import * as Pusher from 'pusher';
import { pusherConfig } from 'src/pusher/pusher.config';

@Injectable()
export class PusherService {
  private pusher: Pusher;
  private subscriptions: Record<string, Set<string>> = {}; // Store channel subscriptions

  constructor() {
    this.pusher = new Pusher({
      appId: pusherConfig.appId,
      key: pusherConfig.key,
      secret: pusherConfig.secret,
      cluster: pusherConfig.cluster,
      useTLS: pusherConfig.useTLS,
    });
  }

  trigger(channel: string, event: string, data: any) {
    this.pusher.trigger(channel, event, data);
  }

  addSubscriber(channel: string, userId: string) {
    if (!this.subscriptions[channel]) {
      this.subscriptions[channel] = new Set<string>();
    }
    this.subscriptions[channel].add(userId);
  }

  removeSubscriber(channel: string, userId: string) {
    if (this.subscriptions[channel]) {
      this.subscriptions[channel].delete(userId);
    }
  }

  getSubscribers(channel: string): string[] {
    return Array.from(this.subscriptions[channel] || []);
  }
}
