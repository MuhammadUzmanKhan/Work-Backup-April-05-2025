import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';

@Module({
  controllers: [SlackController],
  providers: [SlackService],
  imports: [ConfigModule, HttpModule],
})
export class SlackModule {}
