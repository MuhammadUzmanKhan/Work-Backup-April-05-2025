// src/auth/auth.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { LoginDto } from './login.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    const user = await this.userService.findOneByEmail(email);
    console.log('🚀 ~ AuthService ~ login ~ user:', user);

    const validatePassword = await bcrypt.compare(password, user.password);
    console.log(
      '🚀 ~ AuthService ~ login ~ validatePassword:',
      validatePassword,
    );

    if (user && validatePassword) {
      const payload = { email: user.email, sub: user.id, role: user.role };

      return {
        user,
        access_token: this.jwtService.sign(payload),
      };
    } else {
      throw new NotFoundException('User not found');
    }
  }
}
