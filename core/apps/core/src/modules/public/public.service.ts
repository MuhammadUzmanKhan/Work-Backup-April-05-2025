import { COUNTRIES } from '@ontrack-tech-group/common/constants';
import { Injectable } from '@nestjs/common';
import moment from 'moment-timezone';
import 'moment-timezone';

@Injectable()
export class PublicService {
  public async getCountriesList() {
    return { data: COUNTRIES };
  }

  public async getAllTimezones() {
    return moment.tz.names();
  }
}
