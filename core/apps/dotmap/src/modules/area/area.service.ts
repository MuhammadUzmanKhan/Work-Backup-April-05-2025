import { Injectable } from '@nestjs/common';
import { Area, User } from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { NameCompanyDto } from '@Common/dto';
import {
  checkIfWithinScope,
  commonEventCheckInclude,
  getNameAndCompanyWhere,
} from '@Common/helpers';

@Injectable()
export class AreaService {
  async getAllAreas(nameCompanyDto: NameCompanyDto, user: User) {
    await checkIfWithinScope(nameCompanyDto, user);

    return await Area.findAll({
      where: getNameAndCompanyWhere(nameCompanyDto),
      attributes: ['id', 'name', 'company_id'],
      order: [['name', SortBy.ASC]],
      include: commonEventCheckInclude(nameCompanyDto.event_id),
    });
  }
}
