import { Request, Response } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/sequelize';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '@ontrack-tech-group/common/models';
import { ERRORS } from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import * as speakeasy from 'speakeasy';
import { userFixture } from './user.fixture';
import { TwilioService } from '../../twilio/twilio.service';
import {
  ChangeNumberDto,
  VerifyPinDto,
  CreatePinDto,
  ManageMfaDto,
  ImpersonateDto,
} from './dto';
import {
  getRoleAndPermission,
  getUserCompanyData,
  userToken,
  userData,
  _verifyPin,
  userDataMobile,
} from './helpers';

jest.mock('./helpers');

// Mock the external helper function
jest.mock('@ontrack-tech-group/common/helpers', () => ({
  withCompanyScope: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let pusherService: PusherService;

  const mockRes: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    json: jest.fn(),
    sendStatus: jest.fn(),
  };

  const mockReq: Partial<Request> = {
    body: {
      channel_name: 'presence-channel-user-1',
      socket_id: 'socket123',
    },
  };

  const mockTwilioService = {
    sendPin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
  };

  const _mockUser = userFixture.create();
  const mockUser = {
    ..._mockUser,
    demo_user: false,
    mfa_token: null,
    users_companies_roles: [{ role_id: 1 }],
    get: jest.fn().mockReturnValue({
      ..._mockUser,
      demo_user: false,
      mfa_token: null,
      users_companies_roles: [{ role_id: 1 }],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: TwilioService, useValue: mockTwilioService },
        { provide: JwtService, useValue: mockJwtService },
        {
          provide: PusherService,
          useValue: {
            pusher: {
              authorizeChannel: jest.fn(),
            },
          },
        },
        { provide: getModelToken(User), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    pusherService = module.get<PusherService>(PusherService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPin', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const createPinDto: CreatePinDto = {
        cell: '1234567890',
        country_code: '+1',
      };

      await expect(service.createPin(createPinDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        attributes: ['id', 'demo_user', 'mfa_token', 'blocked_at'],
        where: {
          cell: createPinDto.cell,
          country_code: createPinDto.country_code,
        },
      });
    });

    it('should return success for demo user', async () => {
      mockUserModel.findOne.mockResolvedValue({ ...mockUser, demo_user: true });
      const createPinDto: CreatePinDto = {
        cell: '1234567890',
        country_code: '+1',
      };

      const result = await service.createPin(createPinDto);

      expect(result).toEqual({
        success: true,
        mfa: false,
        message:
          'You are logging in with a demo user. Use your old pin to login',
      });
    });

    it('should return success for MFA user', async () => {
      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        mfa_token: 'dummy_token',
      });

      const createPinDto: CreatePinDto = {
        cell: '4155555555',
        country_code: '+1',
      };

      const result = await service.createPin(createPinDto);

      expect(result).toEqual({
        success: true,
        mfa: true,
        message: 'Use Authenticator app to enter MFA Pin.',
      });
    });

    it('should return success for test users', async () => {
      mockUserModel.findOne.mockResolvedValue({ mockUser });
      const createPinDto: CreatePinDto = {
        cell: '4155551414',
        country_code: '+1',
      };

      const result = await service.createPin(createPinDto);

      expect(result).toEqual({
        success: true,
        mfa: false,
        message: 'Use your old pin number',
      });
    });

    it('should throw ForbiddenException if user is Blocked', async () => {
      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        blocked_at: new Date(),
      });

      const createPinDto: CreatePinDto = {
        cell: '1234567890',
        country_code: '+1',
      };

      await expect(service.createPin(createPinDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ServiceUnavailableException if unable to send pin', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockTwilioService.sendPin.mockResolvedValue(false);

      const createPinDto: CreatePinDto = {
        cell: '1234567890',
        country_code: '+1',
      };

      await expect(service.createPin(createPinDto)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockTwilioService.sendPin).toHaveBeenCalledWith(
        createPinDto.country_code,
        createPinDto.cell,
      );
    });

    it('should return success if pin is sent', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockTwilioService.sendPin.mockResolvedValue(true);

      const createPinDto: CreatePinDto = {
        cell: '1234567890',
        country_code: '+1',
      };

      const result = await service.createPin(createPinDto);

      expect(result).toEqual({
        success: true,
        mfa: false,
        messsage: 'Pin number sent on entered mobile number.',
      });
    });
  });

  describe('verifyPin', () => {
    it('should throw BadRequestException if user MFA token is present', async () => {
      (userData as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfa_token: 'some_token',
      });
      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };

      await expect(service.verifyPin(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if pin verification fails', async () => {
      (userData as jest.Mock).mockResolvedValue(mockUser);
      (_verifyPin as jest.Mock).mockResolvedValue(false);
      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };

      await expect(service.verifyPin(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if token is not generated', async () => {
      (userData as jest.Mock).mockResolvedValue(mockUser);
      (_verifyPin as jest.Mock).mockResolvedValue(true);
      (userToken as jest.Mock).mockResolvedValue(null);

      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };

      await expect(service.verifyPin(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return success with token and user details if pin verification passes', async () => {
      (userData as jest.Mock).mockResolvedValue(mockUser);
      (_verifyPin as jest.Mock).mockResolvedValue(true);
      (getUserCompanyData as jest.Mock).mockResolvedValue([]);
      (getRoleAndPermission as jest.Mock).mockResolvedValue([]);
      (userToken as jest.Mock).mockResolvedValue('jwt_token');

      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };
      const result = await service.verifyPin(verifyPinDto);

      expect(result).toHaveProperty('token', 'jwt_token');
      expect(result).toHaveProperty('exp');
    });
  });

  describe('verifyMFA', () => {
    it('should throw BadRequestException if user MFA token is not present', async () => {
      (userData as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfa_token: null,
      });
      const verifyPinDto: VerifyPinDto = {
        pin: '123456',
        cell: '1234567890',
        country_code: '',
      };

      await expect(service.verifyMFA(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if MFA verification fails', async () => {
      (userData as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfa_token: 'some_token',
      });
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);
      const verifyPinDto: VerifyPinDto = {
        pin: '123456',
        cell: '1234567890',
        country_code: '',
      };

      await expect(service.verifyMFA(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if token is not generated', async () => {
      (userData as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfa_token: 'some_token',
      });
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
      (getUserCompanyData as jest.Mock).mockResolvedValue([]);
      (getRoleAndPermission as jest.Mock).mockResolvedValue([]);
      (userToken as jest.Mock).mockResolvedValue(null);

      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };

      await expect(service.verifyMFA(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return success with token and user details if MFA verification passes', async () => {
      (userData as jest.Mock).mockResolvedValue({
        ...mockUser,
        mfa_token: 'some_token',
      });
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);
      (getUserCompanyData as jest.Mock).mockResolvedValue([]);
      (getRoleAndPermission as jest.Mock).mockResolvedValue([]);
      (userToken as jest.Mock).mockResolvedValue('jwt_token');

      const verifyPinDto: VerifyPinDto = {
        pin: '123456',
        cell: '1234567890',
        country_code: '',
      };
      const result = await service.verifyMFA(verifyPinDto);

      expect(result).toHaveProperty('token', 'jwt_token');
      expect(result).toHaveProperty('exp');
    });
  });

  describe('changeNumber', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      const changeNumberDto: ChangeNumberDto = {
        old_cell: '1234567890',
        new_cell: '0987654321',
        old_country_code: '+1',
        new_country_code: '+1',
        confirm_new_cell: '',
        confirm_new_country_code: '',
      };

      await expect(service.changeNumber(changeNumberDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: {
          cell: changeNumberDto.old_cell,
          country_code: changeNumberDto.old_country_code,
        },
        attributes: ['id', 'cell', 'country_code'],
        raw: true,
      });
    });

    it('should throw BadRequestException if old and new numbers are the same', async () => {
      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        cell: '1234567890',
        country_code: '+1',
      });
      const changeNumberDto: ChangeNumberDto = {
        old_cell: '1234567890',
        new_cell: '1234567890',
        old_country_code: '+1',
        new_country_code: '+1',
        confirm_new_cell: '',
        confirm_new_country_code: '',
      };

      await expect(service.changeNumber(changeNumberDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return success if number is changed', async () => {
      mockUserModel.findOne.mockResolvedValue(mockUser);
      const changeNumberDto: ChangeNumberDto = {
        old_cell: '1234567890',
        new_cell: '0987654321',
        old_country_code: '+1',
        new_country_code: '+1',
        confirm_new_cell: '',
        confirm_new_country_code: '',
      };

      const result = await service.changeNumber(changeNumberDto);

      expect(result).toEqual({ success: true });
    });
  });

  describe('manageMfa', () => {
    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);
      const manageMfaDto: ManageMfaDto = { user_id: 2 };
      const currentUser = { id: 1, is_super_admin: true } as unknown as User;

      await expect(
        service.manageMfa(manageMfaDto, currentUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return updated MFA details when MFA token is generated', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        ...mockUser,
        mfa_token: null,
      });
      mockUserModel.update.mockResolvedValue([1]);

      const manageMfaDto: ManageMfaDto = { user_id: 2 };
      const currentUser = { id: 1, is_super_admin: true } as unknown as User;

      const result = await service.manageMfa(manageMfaDto, currentUser);

      expect(result).toHaveProperty('success', 'Message: Data updated!');
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('otpAuthUrl');
    });

    it('should not generate new MFA token if MFA token already exists', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        ...mockUser,
        mfa_token: 'existing_token',
      });
      const manageMfaDto: ManageMfaDto = { user_id: 2 };
      const currentUser = { id: 1, is_super_admin: true } as unknown as User;

      const result = await service.manageMfa(manageMfaDto, currentUser);

      expect(result).toEqual({ success: 'Message: Data updated!' });
    });

    it('case for non internal role', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        ...mockUser,
        mfa_token: 'existing_token',
      });
      const manageMfaDto: ManageMfaDto = { user_id: 2 };
      const currentUser = { id: 1, is_super_admin: false } as unknown as User;

      const result = await service.manageMfa(manageMfaDto, currentUser);

      expect(result).toEqual({ success: 'Message: Data updated!' });
    });
  });

  describe('verifyPinMobile', () => {
    it('should successfully verify the pin and return the token and user data', async () => {
      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };

      (userDataMobile as jest.Mock).mockResolvedValue(mockUser);
      (userData as jest.Mock).mockResolvedValue(mockUser);
      (_verifyPin as jest.Mock).mockResolvedValue(true);
      (userToken as jest.Mock).mockResolvedValue('jwt_token');

      const result = await service.verifyPinMobile(verifyPinDto);

      expect(result).toEqual({
        ...mockUser,
        token: 'jwt_token',
        exp: expect.any(Number),
      });
      expect(userDataMobile).toHaveBeenCalledWith(verifyPinDto);
      expect(userData).toHaveBeenCalledWith(verifyPinDto);
      expect(_verifyPin).toHaveBeenCalledWith(
        verifyPinDto.cell,
        mockUser.country_code,
        verifyPinDto.pin,
        mockTwilioService,
        mockUser.demo_user,
      );
      expect(userToken).toHaveBeenCalledWith(
        mockUser.get({ plain: true }),
        mockJwtService,
      );
    });

    it('should throw BadRequestException if pin verification fails', async () => {
      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };

      (userDataMobile as jest.Mock).mockResolvedValue(mockUser);
      (_verifyPin as jest.Mock).mockResolvedValue(false);

      await expect(service.verifyPinMobile(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(_verifyPin).toHaveBeenCalledWith(
        verifyPinDto.cell,
        mockUser.country_code,
        verifyPinDto.pin,
        mockTwilioService,
        mockUser.demo_user,
      );
    });

    it('should throw BadRequestException if token generation fails', async () => {
      const verifyPinDto: VerifyPinDto = {
        cell: '1234567890',
        pin: '1234',
        country_code: '',
      };

      (userDataMobile as jest.Mock).mockResolvedValue(mockUser);
      (userData as jest.Mock).mockResolvedValue(mockUser);
      (_verifyPin as jest.Mock).mockResolvedValue(true);
      (userToken as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyPinMobile(verifyPinDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userToken).toHaveBeenCalledWith(
        mockUser.get({ plain: true }),
        mockJwtService,
      );
    });
  });

  describe('impersonateUser', () => {
    it('should be successful and return the token and user data', async () => {
      const impersonateDto: ImpersonateDto = { id: 1 };

      (userData as jest.Mock).mockResolvedValue(mockUser);
      (userToken as jest.Mock).mockResolvedValue('jwt_token');
      (getUserCompanyData as jest.Mock).mockResolvedValue([]);

      const result = await service.impersonateUser(impersonateDto);

      expect(result).toEqual({
        ...mockUser.get({ plain: true }),
        token: 'jwt_token',
        companies: [],
      });

      expect(userData).toHaveBeenCalledWith(impersonateDto);
      expect(userToken).toHaveBeenCalledWith(
        mockUser.get({ plain: true }),
        mockJwtService,
      );
      expect(getUserCompanyData).toHaveBeenCalledWith(impersonateDto.id);
    });

    it('should throw BadRequestException if something goes wrong', async () => {
      const impersonateDto: ImpersonateDto = { id: 1 };
      (userData as jest.Mock).mockResolvedValue(mockUser);
      (userToken as jest.Mock).mockResolvedValue(null);

      await expect(service.impersonateUser(impersonateDto)).rejects.toThrow(
        new BadRequestException(ERRORS.SOMETHING_WENT_WRONG),
      );
    });
  });

  describe('userRoleAndCompanies', () => {
    it('should return company data for a valid user', async () => {
      mockUserModel.findByPk.mockResolvedValue(mockUser);
      (getUserCompanyData as jest.Mock).mockResolvedValue([
        { companyId: 1, roleName: 'Admin' },
      ]);

      const result = await service.userRoleAndCompanies(1);

      expect(result).toEqual([{ companyId: 1, roleName: 'Admin' }]);
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(1);
      expect(getUserCompanyData).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null); // Simulate user not found

      await expect(service.userRoleAndCompanies(1)).rejects.toThrow(
        new NotFoundException(ERRORS.USER_NOT_FOUND),
      );
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(1);
    });
  });

  describe('authenticatePusherChannel', () => {
    it('should authorize a presence channel', async () => {
      mockReq.body.channel_name = 'presence-channel-user-1';

      await service.authenticatePusherChannel(
        mockRes as Response,
        mockReq as Request,
        mockUser as unknown as User,
      );

      expect(pusherService.pusher.authorizeChannel).toHaveBeenCalledWith(
        mockReq.body.socket_id,
        mockReq.body.channel_name,
        { user_id: mockUser.id.toString() },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should authorize a private channel', async () => {
      mockReq.body.channel_name = 'private-channel-user-1';

      await service.authenticatePusherChannel(
        mockRes as Response,
        mockReq as Request,
        mockUser as unknown as User,
      );

      expect(pusherService.pusher.authorizeChannel).toHaveBeenCalledWith(
        mockReq.body.socket_id,
        mockReq.body.channel_name,
        undefined, // No options for private channels
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should check company scope for user-specific incident listing', async () => {
      mockReq.body.channel_name = 'presence-incident-listing-2015-user-1';

      (withCompanyScope as jest.Mock).mockResolvedValueOnce(true);

      await service.authenticatePusherChannel(
        mockRes as Response,
        mockReq as Request,
        mockUser as unknown as User,
      );

      expect(withCompanyScope).toHaveBeenCalledWith(mockUser, 2015);
      expect(pusherService.pusher.authorizeChannel).toHaveBeenCalled();
    });

    it('should not authorize if channel type is invalid', async () => {
      mockReq.body.channel_name = 'invalid-channel-user-1';

      await service.authenticatePusherChannel(
        mockRes as Response,
        mockReq as Request,
        mockUser as unknown as User,
      );

      expect(pusherService.pusher.authorizeChannel).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
    });
  });
});
