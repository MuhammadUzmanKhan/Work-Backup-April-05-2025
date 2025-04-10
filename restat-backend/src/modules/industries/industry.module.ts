import { Module } from '@nestjs/common';
import { IndustryController } from './industry.controller';
import { IndustryService } from './industry.service';

@Module({
    controllers: [IndustryController],
    providers: [IndustryService]
})
export class IndustryModule { }
