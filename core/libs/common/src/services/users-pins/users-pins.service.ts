import { Injectable } from '@nestjs/common';
import { PolymorphicType } from '../../constants';
import { UserPins } from '../../models';

@Injectable()
export class UsersPinsService {
  public async createUserPin(
    pinable_id: number,
    user_id: number,
    pinable_type: PolymorphicType,
  ) {
    return await UserPins.create({
      pinable_id,
      user_id,
      pinable_type,
    });
  }

  public async findUserPin(
    pinable_id: number,
    user_id: number,
    pinable_type: PolymorphicType,
  ) {
    return await UserPins.findOne({
      where: { pinable_id, user_id, pinable_type },
    });
  }

  public async deleteUserPin(
    pinable_id: number,
    user_id: number,
    pinable_type: PolymorphicType,
  ) {
    return await UserPins.destroy({
      where: { pinable_id, user_id, pinable_type },
    });
  }
}
