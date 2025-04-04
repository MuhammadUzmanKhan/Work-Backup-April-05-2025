import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PusherService } from '../pusher/pusher.service';
import { ChatController } from './chat.controller';
import { PusherModule } from 'src/pusher/pusher.module';

@Module({
  imports: [PusherModule],
  providers: [ChatGateway, PusherService],
  controllers: [ChatController],
})
export class ChatModule {}
