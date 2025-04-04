import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginUserDto, CreateUserDto } from './dto';
import { Users } from 'src/common/models';
import { ERRORS } from 'src/common/constants/responses';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  public async signup(createUserDto: CreateUserDto) {
    try {
      const alreadyUserExist = await Users.findOne({
        where: { email: createUserDto.email },
        paranoid: false,
      });
      if (alreadyUserExist)
        throw new ForbiddenException(ERRORS.USER_ALREADY_EXISTS);

      createUserDto.password = await bcrypt.hash(
        createUserDto.password,
        parseInt(this.configService.get('JWT_SALTROUND')),
      );
      const user = new Users({
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        name: createUserDto.name,
        email: createUserDto.email.toLocaleLowerCase(),
        password: createUserDto.password,
        dateOfBirth: createUserDto.dateOfBirth,
        city: createUserDto.city,
        zipCode: createUserDto.zipCode,
      });
      await user.save();
      return {
        success: true,
        token: (await user.issueJwtToken()).token,
      };
    } catch (e) {
      console.log(e);
      throw new ConflictException(e);
    }
  }

  public async login(loginUserDto: LoginUserDto) {
    try {
      const user = await Users.findOne({
        where: { email: loginUserDto.email.toLocaleLowerCase() },
      });

      if (!user) throw Error(ERRORS.INVALID_CREDENTIALS);
      if (!bcrypt.compareSync(loginUserDto.password, user.password))
        throw Error(ERRORS.INVALID_CREDENTIALS);

      const _user = user.toJSON();
      const { token } = await user.issueJwtToken();
      return {
        success: true,
        token: token,
      };
    } catch (e) {
      throw new UnauthorizedException(e?.message || ERRORS.INVALID_CREDENTIALS);
    }
  }
}
