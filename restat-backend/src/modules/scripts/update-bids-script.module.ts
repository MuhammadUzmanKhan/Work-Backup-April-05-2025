import { Module } from '@nestjs/common';
import { UpdateBidsScriptController } from './update-bids-script.controller';
import { UpdateBidsScriptService } from './update-bids-script.service';

@Module({
    controllers: [UpdateBidsScriptController],
    providers: [UpdateBidsScriptService]
})
export class UpdateBidsScriptModule { }
