import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../database/models/users.model';
import { CreateUserDto, UpdateUserDto } from 'src/modules/auth/dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.userModel.create(createUserDto);
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return;
    }
    return user;
  }
  async findAllUsers(): Promise<User[]> {
    return this.userModel.findAll();
  }
  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<{ user: User; message: string }> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await user.update(updateUserDto);
    return { message: 'User updated successfully', user };
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await user.destroy();

    return { message: 'User successfully deleted' };
  }
}
