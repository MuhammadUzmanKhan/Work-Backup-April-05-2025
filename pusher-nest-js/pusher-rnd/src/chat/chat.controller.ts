// chat.controller.ts
import { Controller, Post, Body, Res, Get, Param } from '@nestjs/common';
import { PusherService } from '../pusher/pusher.service';
import { Response } from 'express';

@Controller('chat')
export class ChatController {
  constructor(private readonly pusherService: PusherService) {}

  // @Post('message')
  // sendMessage(
  //   @Body('message') message: string,
  //   @Body('recipient') recipient: string,
  // ): void {
  //   this.pusherService.trigger(`private-chat-${recipient}`, 'message', {
  //     text: message,
  //     sender: recipient,
  //   });

  @Post('authenticate')
  authenticate(
    @Body('socket_id') socketId: string,
    @Body('channel_name') channelName: string,
    @Body('userId') userId: string,
    @Res() response: Response,
  ): void {
    try {
      console.log('Received socket_id:', socketId); // Log socket_id
      console.log('Received channel_name:', channelName); // Log channel_name
      console.log('Received userId:', userId); // Log userId
      const authResponse = this.pusherService.authenticate(
        socketId,
        channelName,
        userId,
      );
      response.send(authResponse);
    } catch (error) {
      console.error('Authentication error:', error);
      response.status(500).send({ error: 'Authentication failed' });
    }
  }

  @Post('subscribe')
  subscribeUser(
    @Body('channel') channel: string,
    @Body('userId') userId: string,
    @Res() response: Response,
  ): void {
    try {
      this.pusherService.addSubscriber(channel, userId);
      response
        .status(200)
        .send({ message: `User ${userId} subscribed to channel ${channel}.` });
    } catch (error) {
      console.error('Subscription error:', error);
      response.status(500).send({ error: 'Subscription failed' });
    }
  }

  @Post('unsubscribe')
  unsubscribeUser(
    @Body('channel') channel: string,
    @Body('userId') userId: string,
    @Res() response: Response,
  ): void {
    try {
      this.pusherService.removeSubscriber(channel, userId);
      response.status(200).send({
        message: `User ${userId} unsubscribed from channel ${channel}.`,
      });
    } catch (error) {
      console.error('Unsubscription error:', error);
      response.status(500).send({ error: 'Unsubscription failed' });
    }
  }

  @Post('message-to-subscribers')
  async sendMessageToSubscribers(
    @Body('channel') channel: string,
    @Body('recipients') recipients: string[],
    @Body('message') message: string,
    @Body('sender') sender: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      console.log('Sending message:', message);
      console.log('Recipients:', recipients);
      console.log('Channel:', channel);

      // Fetch and log subscribed users
      const users = await this.pusherService.getSubscribedUsers(channel);
      console.log('Subscribed users:', users);

      // Trigger the message to the channel
      this.pusherService.trigger(channel, 'message', {
        recipients,
        text: message,
        sender,
      });

      response.status(200).send({ message: 'Message sent to all recipients.' });
    } catch (error) {
      console.error('Error sending message to subscribers:', error);
      response
        .status(500)
        .send({ error: 'Failed to send message to subscribers.' });
    }
  }

  @Get(':channelName/users')
  async getChannelUsers(
    @Param('channelName') channelName: string,
    @Res() response: Response,
  ) {
    try {
      const users = await this.pusherService.getSubscribedUsers(channelName);
      response.status(200).send({ users });
    } catch (error) {
      console.error('Error fetching subscribed users:', error);
      response.status(500).send({ error: 'Failed to fetch subscribed users.' });
    }
  }
}
