import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@ontrack-tech-group/common/decorators';
import { PublicService } from './public.service';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get('/get-countries-list')
  getCountriesList() {
    return this.publicService.getCountriesList();
  }

  @Public()
  @Get('/timezones')
  public async getAllTimezones() {
    return this.publicService.getAllTimezones();
  }
}
