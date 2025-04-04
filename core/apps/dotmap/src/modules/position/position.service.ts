import { Injectable } from '@nestjs/common';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { Position, User } from '@ontrack-tech-group/common/models';
import { NameCompanyDto } from '@Common/dto';
import {
  checkIfWithinScope,
  commonEventCheckInclude,
  getNameAndCompanyWhere,
} from '@Common/helpers';

@Injectable()
export class PositionService {
  async getAllPositions(nameCompanyDto: NameCompanyDto, user: User) {
    await checkIfWithinScope(nameCompanyDto, user);

    return await Position.findAll({
      where: getNameAndCompanyWhere(nameCompanyDto),
      attributes: ['id', 'name', 'company_id'],
      order: [['name', SortBy.ASC]],
      include: commonEventCheckInclude(nameCompanyDto.event_id),
    });
  }
}
