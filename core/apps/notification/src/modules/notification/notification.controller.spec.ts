import { Test, TestingModule } from '@nestjs/testing';
import { userFixture } from '@ontrack-tech-group/common/fixtures';
import { Notification } from '@ontrack-tech-group/common/models';
import { CompanyIdDto, PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { NotificationModule, NotificationType } from '@Common/enum';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { GetNotificationDto } from './dto';

jest.mock('@ontrack-tech-group/common/models', () => {
  return {
    Notification: class {
      id!: number;
      message!: string;
      message_html!: string;
      module!: string;
      type!: string;
      module_id!: number;
      company_id!: number;
      createdAt!: Date;
      updatedAt!: Date;
      unread!: boolean;
      event_id!: number;
      task_list_id!: number;

      static build(data: Partial<Notification>) {
        return Object.assign(new this(), data);
      }
    },
  };
});

describe('NotificationController', () => {
  let notificationController: NotificationController;
  let notificationService: NotificationService;

  const mockUser = userFixture.create();

  const mockNotificationService = {
    createNotification: jest.fn(),
    getAllNotifications: jest.fn(),
    getAllNotificationsCounts: jest.fn(),
    updateNotification: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    notificationController = app.get<NotificationController>(
      NotificationController,
    );
    notificationService = app.get<NotificationService>(NotificationService);
  });

  describe('getAllNotifications', () => {
    it('It should get all notifications for a user with correct params', async () => {
      const query: GetNotificationDto = {
        company_id: 1,
        module: NotificationModule.TASK,
        type: NotificationType.MENTION,
      };

      const mockNotificationData = [
        {
          id: 142,
          message: 'You have been assigned to tasker.',
          message_html: 'You have been assigned to <strong>tasker</strong>.',
          module: 'Task',
          type: NotificationType.TASK_ASSIGNED,
          module_id: 6005,
          company_id: 195,
          createdAt: new Date('2024-12-04T10:04:56.094Z'),
          updatedAt: new Date('2024-12-04T10:04:56.094Z'),
          unread: true,
          event_id: 2473,
          task_list_id: 574,
        },
      ].map((data) => (Notification as any).build(data));

      jest
        .spyOn(notificationService, 'getAllNotifications')
        .mockResolvedValue(mockNotificationData);

      expect(
        await notificationController.getAllNotifications(query, mockUser),
      ).toEqual(mockNotificationData);
      expect(notificationService.getAllNotifications).toHaveBeenCalledWith(
        query,
        mockUser,
      );
    });
  });

  describe('getAllNotificationsCounts', () => {
    it('Ishould call NotificationService.getAllNotificationsCounts with the correct parameters', async () => {
      const dto: CompanyIdDto = { company_id: 1 };
      const result = {
        totalCount: 1,
        mentionedCounts: 0,
        moduleCounts: [
          {
            count: 1,
            module: 'Task',
          },
        ],
      };
      jest
        .spyOn(notificationService, 'getAllNotificationsCounts')
        .mockResolvedValue(result);

      expect(
        await notificationController.getAllNotificationsCounts(dto, mockUser),
      ).toEqual(result);
      expect(
        notificationService.getAllNotificationsCounts,
      ).toHaveBeenCalledWith(dto.company_id, mockUser);
    });
  });

  describe('updateNotification', () => {
    it('should call NotificationService.updateNotification with the correct parameters', async () => {
      const param: PathParamIdDto = { id: 1 };
      const result = { success: true };

      jest
        .spyOn(notificationService, 'updateNotification')
        .mockResolvedValue(result);

      expect(
        await notificationController.updateNotification(param, mockUser),
      ).toEqual(result);
      expect(notificationService.updateNotification).toHaveBeenCalledWith(
        param.id,
        mockUser,
      );
    });
  });
});
