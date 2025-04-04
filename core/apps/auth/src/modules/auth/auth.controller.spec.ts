import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  ChangeNumberDto,
  CreatePinDto,
  VerifyPinDto,
  ImpersonateDto,
  ManageMfaDto,
} from './dto';
import { userFixture } from './user.fixture';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    createPin: jest.fn(),
    verifyPin: jest.fn(),
    verifyMFA: jest.fn(),
    verifyPinMobile: jest.fn(),
    changeNumber: jest.fn(),
    manageMfa: jest.fn(),
    impersonateUser: jest.fn(),
    userRoleAndCompanies: jest.fn(),
  };

  const mockUser = userFixture.create();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('createPin', () => {
    it('should call authService.createPin with correct data', async () => {
      const createPinDto: CreatePinDto = { cell: '', country_code: '' };
      await authController.createPin(createPinDto);
      expect(authService.createPin).toHaveBeenCalledWith(createPinDto);
    });
  });

  describe('verifyPin', () => {
    it('should call authService.verifyPin with correct data', async () => {
      const verifyPinDto: VerifyPinDto = {
        pin: '',
        cell: '',
        country_code: '',
      };
      await authController.verifyPin(verifyPinDto);
      expect(authService.verifyPin).toHaveBeenCalledWith(verifyPinDto);
    });
  });

  describe('verifyMFA', () => {
    it('should call authService.verifyMFA with correct data', async () => {
      const verifyMFADto: VerifyPinDto = {
        pin: '',
        cell: '',
        country_code: '',
      };
      await authController.verifyMFA(verifyMFADto);
      expect(authService.verifyMFA).toHaveBeenCalledWith(verifyMFADto);
    });
  });

  describe('verifyPinMobile', () => {
    it('should call authService.verifyPinMobile with correct data', async () => {
      const verifyPinDto: VerifyPinDto = {
        pin: '',
        cell: '',
        country_code: '',
      };
      await authController.verifyPinMobile(verifyPinDto);
      expect(authService.verifyPinMobile).toHaveBeenCalledWith(verifyPinDto);
    });
  });

  describe('changeNumber', () => {
    it('should call authService.changeNumber with correct data', async () => {
      const changeNumberDto: ChangeNumberDto = {
        old_cell: '',
        old_country_code: '',
        new_cell: '',
        new_country_code: '',
        confirm_new_cell: '',
        confirm_new_country_code: '',
      };
      await authController.changeNumber(changeNumberDto);
      expect(authService.changeNumber).toHaveBeenCalledWith(changeNumberDto);
    });
  });

  describe('manageMfa', () => {
    it('should call authService.manageMfa with correct data', async () => {
      const manageMfaDto: ManageMfaDto = { user_id: -1 };
      await authController.manageMfa(mockUser, manageMfaDto);
      expect(authService.manageMfa).toHaveBeenCalledWith(
        manageMfaDto,
        mockUser,
      );
    });
  });

  describe('impersonateUser', () => {
    it('should call authService.impersonateUser with correct data', async () => {
      const impersonateDto: ImpersonateDto = { id: -1 };
      await authController.impersonateUser(impersonateDto);
      expect(authService.impersonateUser).toHaveBeenCalledWith(impersonateDto);
    });
  });

  describe('userRoleAndCompanies', () => {
    it('should call authService.userRoleAndCompanies with correct data', async () => {
      await authController.userRoleAndCompanies(mockUser);
      expect(authService.userRoleAndCompanies).toHaveBeenCalledWith(
        mockUser.id,
      );
    });
  });
});
