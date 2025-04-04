import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { CreateUserDto, LoginDto } from './dto';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-roles.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    const user = await this.userService.findOneByEmail(email);
    console.log('🚀 ~ AuthService ~ login ~ user:', user);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const validatePassword = await bcrypt.compare(password, user.password);

    if (!validatePassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    const { password: _, ...result } = user.dataValues;
    return {
      ...result,
      access_token: this.jwtService.sign(payload),
    };
  }

  async signUp(createUserDto: CreateUserDto) {
    const { email, password, role = UserRole.USER, ...rest } = createUserDto;

    // Check if the email already exists
    const existingUser = await this.userService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException(
        'Email already in use. Please choose another.',
      );
    }

    // Proceed with user creation
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.userService.createUser({
      ...rest,
      email,
      password: hashedPassword,
      role,
    });
    return {
      message: 'User created successfully',
      ...rest,
      email,
      role,
    };
  }
}
