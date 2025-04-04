import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from '@common/decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { ApiTagNames } from '@common/constants';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Public()
    @ApiTags(ApiTagNames.HEALTH)
    @ApiTags(ApiTagNames.PUBLIC)
    @Get()
    public getHello() {
        return this.appService.getHello();
    }
}
