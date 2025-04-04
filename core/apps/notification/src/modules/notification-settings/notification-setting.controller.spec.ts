import { Test, TestingModule } from '@nestjs/testing';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { NotificationSetting } from '@ontrack-tech-group/common/models';
import { NotificationModule, NotificationType } from '@Common/enum';
import { NotificationSettingController } from './notification-setting.controller';
import { NotificationSettingService } from './notification-setting.service';
import { GetNotificationSettingDto, UpdateNotificationSettingDto } from './dto';

jest.mock('@ontrack-tech-group/common/models', () => {
  return {
    NotificationSetting: class {
      id!: number;
      module!: string;
      user_id!: number;
      createdAt!: Date;
      updatedAt!: Date;
      static build(data: Partial<NotificationSetting>) {
        return Object.assign(new this(), data);
      }
    },
  };
});

describe('NotificationSettingController', () => {
  let notificationSettingController: NotificationSettingController;
  let notificationSettingService: NotificationSettingService;

  const mockUser = userFixture.create();

  const mockNotificationSettingService = {
    getUserNotificationSetting: jest.fn(),
    updateNotificationSetting: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationSettingController],
      providers: [
        {
          provide: NotificationSettingService,
          useValue: mockNotificationSettingService,
        },
      ],
    }).compile();

    notificationSettingController = app.get<NotificationSettingController>(
      NotificationSettingController,
    );
    notificationSettingService = app.get<NotificationSettingService>(
      NotificationSettingService,
    );
  });

  describe('getUserNotificationSetting', () => {
    it('It should get all notification setting for a user with correct params', async () => {
      const query: GetNotificationSettingDto = {
        module: NotificationModule.TASK,
        notification_type: NotificationType.MENTION,
      };

      const mockNotificationData = [
        {
          notification_type: NotificationType.TASK_ASSIGNED,
          mobile: true,
          sms: true,
          email: true,
          is_enabled: true,
        },
      ].map((data) => (NotificationSetting as any).build(data));

      jest
        .spyOn(notificationSettingService, 'getUserNotificationSetting')
        .mockResolvedValue(mockNotificationData);

      expect(
        await notificationSettingController.getUserNotificationSetting(
          mockUser,
          query,
        ),
      ).toEqual(mockNotificationData);
      expect(
        notificationSettingService.getUserNotificationSetting,
      ).toHaveBeenCalledWith(query, mockUser);
    });
  });

  describe('updateNotification', () => {
    it('should call notificationSettingService.updateNotificationSetting with the correct parameters', async () => {
      const param: UpdateNotificationSettingDto = {
        module: NotificationModule.TASK,
        notification_type: NotificationType.MENTION,
        sms: true,
        is_enabled: true,
        mobile: true,
        email: true,
      };

      const mockNotificationData = [
        {
          notification_type: NotificationType.TASK_ASSIGNED,
          mobile: true,
          sms: true,
          email: true,
          is_enabled: true,
        },
      ].map((data) => (NotificationSetting as any).build(data));

      jest
        .spyOn(notificationSettingService, 'updateNotificationSetting')
        .mockResolvedValue(mockNotificationData);

      expect(
        await notificationSettingController.updateNotificationSetting(
          param,
          mockUser,
        ),
      ).toEqual(mockNotificationData);
      expect(
        notificationSettingService.updateNotificationSetting,
      ).toHaveBeenCalledWith(param, mockUser);
    });
  });
});
