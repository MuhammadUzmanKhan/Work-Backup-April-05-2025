import { Request, Response } from 'express';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { User } from '@ontrack-tech-group/common/models';
import { ERRORS, PusherChannels } from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import * as speakeasy from 'speakeasy';
import { TwilioService } from '../../twilio/twilio.service';
import {
  ImpersonateDto,
  ChangeNumberDto,
  VerifyPinDto,
  CreatePinDto,
  ManageMfaDto,
} from './dto';
import {
  getRoleAndPermission,
  getUserCompanyData,
  userToken,
  userData,
  userDataMobile,
  _verifyPin,
} from './helpers';

@Injectable()
export class AuthService {
  constructor(
    private readonly twilioService: TwilioService,
    private pusherService: PusherService,
    private readonly jwtService: JwtService,
    @InjectModel(User)
    private readonly user: typeof User,
  ) {}

  /**
   * To Create Pin for a User
   * @param data
   * @returns
   */
  async createPin(data: CreatePinDto) {
    const user = await this.user.findOne({
      attributes: ['id', 'demo_user', 'mfa_token', 'blocked_at'],
      where: { cell: data.cell, country_code: data.country_code },
    });

    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    // IF BLOCKED USER
    if (user.blocked_at)
      throw new ForbiddenException('User is Temporarily Blocked');

    // IF DEMO USER
    if (user.demo_user) {
      return {
        success: true,
        mfa: user.mfa_token ? true : false,
        message:
          'You are logging in with a demo user. Use your old pin to login',
      };
    }
    // For Test Users
    else if (
      [
        '14155551414',
        '14155551313',
        '14155551212',
        '14155551111',
        '14155551515',
        '4155551414',
        '4155551313',
        '4155551212',
        '4155551111',
        '4155551515',
        '15478523690',
        '5478523690',
        '8871935162',
        '2002000000',
        '4155551420',
        '4155551415',
        '4155551416',
      ].includes(data.cell)
    )
      return {
        success: true,
        mfa: user.mfa_token ? true : false,
        message: 'Use your old pin number',
      };

    // Real Users
    if (user.mfa_token) {
      return {
        success: true,
        mfa: true,
        message: 'Use Authenticator app to enter MFA Pin.',
      };
    }

    const status = await this.twilioService.sendPin(
      data.country_code,
      data.cell,
    );
    if (status) {
      return {
        success: true,
        mfa: false,
        messsage: 'Pin number sent on entered mobile number.',
      };
    } else {
      throw new ServiceUnavailableException('Could Not send Pin');
    }
  }

  /**
   * To Verify Pin send to the user via Twilio
   */
  async verifyPin(data: VerifyPinDto) {
    const { cell, pin } = data;

    const user = await userData(data);
    const _user = await user.get({ plain: true });

    const userRoles = user.users_companies_roles.map(({ role_id }) => role_id);

    // MFA Check
    if (user.mfa_token) throw new BadRequestException('Invalid Pin');

    // Verify Pin
    const status = await _verifyPin(
      cell,
      user.country_code,
      pin,
      this.twilioService,
      user.demo_user,
    );
    if (!status) throw new BadRequestException('Invalid Pin');

    // set the expiration time to 3 days in seconds
    const expiresInThreeDays = 3 * 24 * 60 * 60;

    // getting permissions of that user, if this user has multiple companies it will return multiple permissions against multiple role
    const permission = await getRoleAndPermission(userRoles);

    // getting multiple companies data
    const companies = await getUserCompanyData(user.id);

    // getting token with jwt
    const token = await userToken(_user, this.jwtService);

    // getting expiry time of token and return in API response
    const exp = Math.floor(new Date().getTime() / 1000) + expiresInThreeDays;

    // deleting role_ids
    delete _user.users_companies_roles;

    // deleting MFA Token
    delete _user.mfa_token;

    if (token) {
      return { token, ..._user, companies, permission, exp };
    } else {
      throw new BadRequestException('Invalid Pin');
    }
  }

  /**
   * To Verify MFA via Authenticator app
   */
  async verifyMFA(data: VerifyPinDto) {
    const { pin } = data;

    const user = await userData(data);
    const _user = await user.get({ plain: true });

    const userRoles = user.users_companies_roles.map(({ role_id }) => role_id);

    // MFA Check
    if (user.mfa_token) {
      const isVerified = speakeasy.totp.verify({
        secret: user.mfa_token,
        encoding: 'base32',
        token: pin,
      });

      if (!isVerified) throw new BadRequestException('Invalid MFA Pin');
    } else throw new BadRequestException('API Disable for this User');

    // Set the expiration time to 3 days in seconds
    const expiresInThreeDays = 3 * 24 * 60 * 60;

    // getting permissions of that user, if this user has multiple companies it will return multiple permissions against multiple role
    const permission = await getRoleAndPermission(userRoles);

    // getting multiple companies data
    const companies = await getUserCompanyData(user.id);

    // getting token with jwt
    const token = await userToken(_user, this.jwtService);

    // getting expiry time of token and return in API response
    const exp = Math.floor(new Date().getTime() / 1000) + expiresInThreeDays;

    // deleting role_ids
    delete _user.users_companies_roles;

    // deleting MFA Token
    delete _user.mfa_token;

    if (token) {
      return { token, ..._user, companies, permission, exp };
    } else {
      throw new BadRequestException('Invalid Pin');
    }
  }

  /**
   * To Verify Pin send to the user via Twilio
   */
  async verifyPinMobile(verifyPinDto: VerifyPinDto) {
    const { cell, pin } = verifyPinDto;

    // Set the expiration time to 3 days in seconds
    const expiresInThreeDays = 3 * 24 * 60 * 60;

    const user = await userDataMobile(verifyPinDto);
    const userForToken = (await userData(verifyPinDto)).get({ plain: true });

    const { country_code, demo_user } = user;

    // Verify Pin
    const status = await _verifyPin(
      cell,
      country_code,
      pin,
      this.twilioService,
      demo_user,
    );
    if (!status) throw new BadRequestException('Invalid Pin');

    const token = await userToken(userForToken, this.jwtService);

    // getting expiry time of token and return in API response
    const exp = Math.floor(new Date().getTime() / 1000) + expiresInThreeDays;

    // deleting MFA Token
    delete user.mfa_token;

    if (token) {
      return {
        ...user,
        token,
        exp,
      };
    } else {
      throw new BadRequestException('Invalid Pin');
    }
  }

  /**
   * To Change Number of the user
   */
  async changeNumber(data: ChangeNumberDto) {
    const user = await this.user.findOne({
      where: { cell: data.old_cell, country_code: data.old_country_code },
      attributes: ['id', 'cell', 'country_code'],
      raw: true,
    });

    if (!user)
      throw new NotFoundException('There is no record for this cell number.');

    if (
      user.cell === data.new_cell &&
      user.country_code === data.new_country_code
    )
      throw new BadRequestException('Old number and new number are same');

    return { success: true };
  }

  /**
   * To impersonate a user
   */
  async impersonateUser($user: ImpersonateDto) {
    const user = await userData($user);
    const _user = await user.get({ plain: true });

    // deleting role_ids
    delete _user.users_companies_roles;

    const token = await userToken(_user, this.jwtService);
    if (token) {
      const companies = await getUserCompanyData(user.id);
      // adding user token in db
      return { token, ..._user, companies };
    } else {
      throw new BadRequestException(ERRORS.SOMETHING_WENT_WRONG);
    }
  }

  /**
   * To get companies and role of user
   */
  async userRoleAndCompanies(id: number) {
    const user = await this.user.findByPk(id);
    if (!user) throw new NotFoundException(ERRORS.USER_NOT_FOUND);

    return await getUserCompanyData(user.id);
  }

  /**
   * To enable and disable mfa by generating mfa_token and qrcode. and removing mfa_token for a specific user
   */
  async manageMfa(manageMfaDto: ManageMfaDto, _user: User) {
    let secret: speakeasy.GeneratedSecret = undefined;
    let user: User;
    let mfa_token = null;
    let otpAuthUrl = null;

    const { user_id } = manageMfaDto;

    if (user_id && (_user['is_super_admin'] || _user['is_ontrack_manager'])) {
      user = await this.user.findByPk(user_id, {
        attributes: ['id', 'cell', 'country_code', 'mfa_token'],
      });

      if (!user && user_id) {
        throw new NotFoundException(ERRORS.USER_NOT_FOUND);
      }
    } else {
      user = await this.user.findByPk(_user.id, {
        attributes: ['id', 'cell', 'country_code', 'mfa_token'],
      });
    }

    if (user.mfa_token === null) {
      secret = speakeasy.generateSecret({ length: 32 });
      const customLabel = `OnTrack: ${user.country_code} ${user.cell}`;
      mfa_token = secret.base32;
      otpAuthUrl = `otpauth://totp/${encodeURIComponent(customLabel)}?secret=${
        secret.base32
      }`;
    }

    // Update the user with the new MFA token
    await this.user.update({ mfa_token }, { where: { id: user.id } });

    return {
      success: 'Message: Data updated!',
      ...(user.mfa_token === null && { secret: secret.base32, otpAuthUrl }),
    };
  }

  async authenticatePusherChannel(res: Response, req: Request, user: User) {
    const { channel_name, socket_id } = req.body;
    const userId = user.id.toString();

    // check if channel is for incident and user specific then we need to check its company scope
    const isUserSpecificIncidentListing =
      channel_name.includes('-user-') &&
      channel_name.includes(PusherChannels.PRESENCE_INCIDENT_LISTING);

    if (isUserSpecificIncidentListing) {
      const [eventIdSegment] = channel_name.split('-user-');
      const eventId = Number(eventIdSegment.split('-').pop());

      await withCompanyScope(user, eventId);
    }

    const channelType = channel_name.includes('presence-')
      ? 'presence'
      : channel_name.includes('private-')
        ? 'private'
        : null;

    if (channelType) {
      const authOptions =
        channelType === 'presence' ? { user_id: userId } : undefined;

      const auth = this.pusherService.pusher.authorizeChannel(
        socket_id,
        channel_name,
        authOptions,
      );

      return res.status(200).send(auth);
    }
  }
}
