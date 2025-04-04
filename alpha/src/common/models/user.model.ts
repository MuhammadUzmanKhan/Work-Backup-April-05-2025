import { BOOLEAN } from 'sequelize';
import { UUIDV4 } from 'sequelize';
import { UUID, STRING } from 'sequelize';
import { JwtService } from '@nestjs/jwt';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AllowNull,
  Unique,
  Index,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import { UserRoles, UserSessions } from './index';

@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Users extends Model {
  private configService = new ConfigService();
  JwtConstant = {
    secret: this.configService.get('JWT_SECRET'),
    saltOrRounds: this.configService.get('JWT_SALTROUND'),
  };

  private jwtService: JwtService = new JwtService(this.JwtConstant);

  @Index
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  first_name: string;

  @AllowNull(false)
  @Column({ type: STRING })
  last_name: string;

  @Column({ type: STRING })
  name: string;

  @AllowNull(false)
  @Unique
  @Column({ type: STRING })
  email: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  isAdmin: boolean;

  @AllowNull(false)
  @Column({ type: STRING(255) })
  password: string;

  @Column({ type: STRING })
  dateOfBirth?: string;

  @Column({ type: STRING })
  city?: string;

  @HasOne(() => UserSessions, { onDelete: 'CASCADE' })
  session: UserSessions;

  @HasMany(() => UserRoles, { onDelete: 'CASCADE' })
  user_roles: UserRoles[];

  public async issueJwtToken(fcmToken?: string) {
    delete this.password;
    await UserSessions.destroy({ where: { userId: this.id } });
    const session = await UserSessions.create(
      {
        userId: this.id,
        fcmToken,
      },
      { returning: true },
    );
    const _user = this.toJSON<Users>();
    _user.session = session;
    const token = this.jwtService.sign(_user);
    return { token };
  }
}
