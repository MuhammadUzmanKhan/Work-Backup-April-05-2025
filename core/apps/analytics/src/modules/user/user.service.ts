import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@ontrack-tech-group/common/models';

@Injectable()
export class UserService {
  async getUserById(id: number) {
    const user: User = await User.findByPk(id, { raw: true });
    if (!user) throw new NotFoundException();
    return user;
  }
}
