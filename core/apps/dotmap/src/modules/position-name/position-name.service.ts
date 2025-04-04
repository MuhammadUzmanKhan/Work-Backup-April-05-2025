import { Injectable } from '@nestjs/common';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { User, PositionName } from '@ontrack-tech-group/common/models';
import {
  checkIfWithinScope,
  commonEventCheckInclude,
  getNameAndCompanyWhere,
} from '@Common/helpers';
import { NameCompanyDto } from '@Common/dto';

@Injectable()
export class PositionNameService {
  async getAllPositionNames(nameCompanyDto: NameCompanyDto, user: User) {
    await checkIfWithinScope(nameCompanyDto, user);

    return await PositionName.findAll({
      where: getNameAndCompanyWhere(nameCompanyDto),
      attributes: ['id', 'name', 'company_id'],
      order: [['name', SortBy.ASC]],
      include: commonEventCheckInclude(nameCompanyDto.event_id),
    });
  }
}
