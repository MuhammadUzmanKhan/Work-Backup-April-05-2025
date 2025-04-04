import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  User,
  UserCompanyRole,
  UserToken,
  RolePermission,
} from '@ontrack-tech-group/common/models';
import {
  userData,
  userDataMobile,
  getUserCompanyData,
  userToken,
  getRoleAndPermission,
  _verifyPin,
} from './';
import { TwilioService } from '../../../twilio/twilio.service';
import { userFixture } from '../user.fixture';
import { VerifyPinDto } from '../dto';

// Mock external dependencies and services
jest.mock('../../../twilio/twilio.service');

// Directly mock the User model
jest.mock('@ontrack-tech-group/common/models', () => ({
  User: {
    findOne: jest.fn(),
  },
  UserCompanyRole: {
    findAll: jest.fn(),
  },
  UserToken: {
    create: jest.fn(),
  },
  RolePermission: {
    findAll: jest.fn(),
  },
  Permission: jest.fn(), // Only include if you need to mock Permission model behavior
}));

describe('Helper Functions', () => {
  let jwtService: JwtService;
  let twilioService: TwilioService;

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

  const data: VerifyPinDto = {
    cell: '1234567890',
    country_code: '+1',
    pin: '1122',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtService, TwilioService],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    twilioService = module.get<TwilioService>(TwilioService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
  });

  describe('userData', () => {
    it('should return user data when user is found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(
        mockUser.get({ plain: true }),
      );

      const result = await userData(data);

      expect(result).toEqual(mockUser.get({ plain: true }));

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
          attributes: expect.any(Array),
          include: expect.any(Array),
        }),
      );
    });

    it('should throw BadRequestException when user is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(userData(data)).rejects.toThrow(
        new BadRequestException('Invalid Pin'),
      );
    });

    it('should throw ForbiddenException when user is blocked', async () => {
      mockUser.blocked_at = new Date();
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(userData(data)).rejects.toThrow(
        new ForbiddenException('User is Temporarily Blocked'),
      );
    });
  });

  describe('userDataMobile', () => {
    it('should return mobile user data and companies', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      const getUserCompanyDataSpy = jest
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .spyOn(require('./index'), 'getUserCompanyData') // Correctly spy on the function from the module
        .mockResolvedValue([{ role: 'admin' }]);

      const result = await userDataMobile(data);

      expect(result).toHaveProperty('companies');
      expect(User.findOne).toHaveBeenCalled();
      expect(getUserCompanyDataSpy).toHaveBeenCalledWith(mockUser.get().id);

      getUserCompanyDataSpy.mockRestore();
    });

    it('should throw BadRequestException when mobile user is not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      /* 
        We don't want the end user to know if the number 
        he is trying is in the system or not, this is why we 
        are using BadRequestException instead of NotFoundException 
      */
      await expect(userDataMobile(data)).rejects.toThrow(
        new BadRequestException('Invalid Pin'),
      );
    });

    it('should throw ForbiddenException when mobile user is blocked', async () => {
      const mockUser = {
        get: jest.fn().mockReturnValue({ id: 1, blocked_at: new Date() }),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(userDataMobile(data)).rejects.toThrow(
        new ForbiddenException('User is Temporarily Blocked'),
      );
    });
  });

  describe('getUserCompanyData', () => {
    it('should return user company data', async () => {
      const mockData = [{ id: 1, role_id: 1, company_id: 2 }];
      (UserCompanyRole.findAll as jest.Mock).mockResolvedValue(mockData);

      const result = await getUserCompanyData(1);

      expect(result).toEqual(mockData);
      expect(UserCompanyRole.findAll as jest.Mock).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });
  });

  describe('userToken', () => {
    it('should return token when user token is created', async () => {
      const mockToken = 'test_token';
      jwtService.sign = jest.fn().mockReturnValue(mockToken);
      (UserToken.create as jest.Mock).mockResolvedValue(true);

      const result = await userToken(mockUser as unknown as User, jwtService);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(mockUser);
      expect(UserToken.create as jest.Mock).toHaveBeenCalledWith({
        token: mockToken,
        user_id: mockUser.id,
      });
    });

    it('should throw BadRequestException when token creation fails', async () => {
      jwtService.sign = jest.fn().mockReturnValue(null);

      await expect(
        userToken(mockUser as unknown as User, jwtService),
      ).rejects.toThrow(new BadRequestException('Invalid Pin'));
    });
  });

  describe('getRoleAndPermission', () => {
    it('should return role permissions', async () => {
      const mockPermissions = [{ name: 'READ' }];
      (RolePermission.findAll as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await getRoleAndPermission([1, 2]);

      expect(result).toEqual(['READ']);
      expect(RolePermission.findAll as jest.Mock).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });
  });

  describe('_verifyPin', () => {
    it('should return user with demo user', async () => {
      twilioService.verifyPin = jest.fn().mockResolvedValue(true);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await _verifyPin(
        '1234567890',
        '+1',
        '1234',
        twilioService,
        true,
      );

      expect(result).toBe(true);
      expect(User.findOne as jest.Mock).toBeCalled();
    });

    it('should return true if pin is verified via Twilio', async () => {
      twilioService.verifyPin = jest.fn().mockResolvedValue(true);

      const result = await _verifyPin(
        '1234567890',
        '+1',
        '1234',
        twilioService,
      );

      expect(result).toBe(true);
      expect(twilioService.verifyPin).toHaveBeenCalledWith(
        '1234',
        '+1',
        '1234567890',
      );
    });

    it('should return false if Twilio verification fails', async () => {
      twilioService.verifyPin = jest.fn().mockResolvedValue(false);

      const result = await _verifyPin(
        '1234567890',
        '+1',
        '1234',
        twilioService,
      );

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      twilioService.verifyPin = jest.fn().mockRejectedValue(new Error('Error'));

      const result = await _verifyPin(
        '1234567890',
        '+1',
        '1234',
        twilioService,
      );

      expect(result).toBe(false);
    });
  });
});
