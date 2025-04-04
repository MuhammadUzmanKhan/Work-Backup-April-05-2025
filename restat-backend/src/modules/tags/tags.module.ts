import { Module } from '@nestjs/common';
import { TagController } from './tags.controller';
import { TagService } from './tags.service';

@Module({
    controllers: [TagController],
    providers: [TagService]
})
export class TagModule { }
