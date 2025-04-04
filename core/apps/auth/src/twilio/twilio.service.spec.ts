import { Test, TestingModule } from '@nestjs/testing';
import { TwilioService } from './twilio.service';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

jest.mock('twilio'); // Mock the Twilio module

describe('TwilioService', () => {
  let service: TwilioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwilioService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'TWILIO_ACCOUNT_SID':
                  return 'test_account_sid';
                case 'TWILIO_KEY_SID':
                  return 'test_key_sid';
                case 'TWILIO_KEY_SECRET':
                  return 'test_key_secret';
                case 'TWILIO_VERIFY_SID':
                  return 'test_verify_sid';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TwilioService>(TwilioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPin', () => {
    it('should send SMS and return true on success', async () => {
      const mockClient = {
        verify: {
          v2: {
            services: jest.fn().mockReturnThis(),
            verifications: {
              create: jest.fn().mockResolvedValue({}),
            },
          },
        },
      };

      (Twilio as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.sendPin('+1', '234567890');

      expect(result).toBe(true);
      expect(mockClient.verify.v2.services).toHaveBeenCalledWith(
        'test_verify_sid',
      );
      expect(
        mockClient.verify.v2.services().verifications.create,
      ).toHaveBeenCalledWith({
        to: '+1234567890',
        channel: 'sms',
      });
    });

    it('should return false on error', async () => {
      // Mock the Twilio client to simulate an error scenario
      const mockClient = {
        verify: {
          v2: {
            services: jest.fn().mockReturnThis(),
            verifications: {
              create: jest
                .fn()
                .mockRejectedValue(new Error('Failed to send SMS')), // Simulate a rejection
            },
          },
        },
      };

      (Twilio as jest.Mock).mockImplementation(() => mockClient); // Mock the Twilio constructor

      const result = await service.sendPin('+1', '234567890');

      expect(result).toBe(false); // Expect the result to be false on error
    });
  });

  describe('verifyPin', () => {
    it('should verify pin and return true if approved', async () => {
      const mockClient = {
        verify: {
          v2: {
            services: jest.fn().mockReturnThis(),
            verificationChecks: {
              create: jest.fn().mockResolvedValue({ status: 'approved' }),
            },
          },
        },
      };

      (Twilio as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.verifyPin('1234', '+1', '234567890');

      expect(result).toBe(true);
      expect(mockClient.verify.v2.services).toHaveBeenCalledWith(
        'test_verify_sid',
      );
      expect(
        mockClient.verify.v2.services().verificationChecks.create,
      ).toHaveBeenCalledWith({
        to: '+1234567890',
        code: '1234',
      });
    });

    it('should return false on verification error', async () => {
      const mockClient = {
        verify: {
          v2: {
            services: jest.fn().mockReturnThis(),
            verificationChecks: {
              create: jest
                .fn()
                .mockRejectedValue(new Error('Verification failed')),
            },
          },
        },
      };

      (Twilio as jest.Mock).mockImplementation(() => mockClient);

      const result = await service.verifyPin('1234', '+1', '234567890');

      expect(result).toBe(false);
    });
  });
});
