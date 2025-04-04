import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CompanyContactController } from './company-contact.controller';
import { CompanyContactService } from './company-contact.service';

@Module({
  controllers: [CompanyContactController],
  providers: [CompanyContactService],
  imports: [ConfigModule, HttpModule],
  exports: [CompanyContactService],
})
export class CompanyContactModule {}
