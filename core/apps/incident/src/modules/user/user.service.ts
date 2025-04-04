import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@ontrack-tech-group/common/models';
import { ERRORS } from '@ontrack-tech-group/common/constants';

@Injectable()
export class UserService {
  public async getUserById(id: number) {
    const user: User = await User.findByPk(id, { raw: true });
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    return user;
  }
}
