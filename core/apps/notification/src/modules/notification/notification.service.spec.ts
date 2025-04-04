import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { UserNotification } from '@ontrack-tech-group/common/models';

jest.mock('@ontrack-tech-group/common/models', () => ({
  UserNotification: {
    update: jest.fn(),
  },
}));

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('updateNotification', () => {
    it('should mark the notification as read and return success', async () => {
      const mockUser = { id: 1 } as any; // Mock user object
      const mockNotificationId = 123;

      // Mock the UserNotification.update method
      const mockUpdate = jest.fn().mockResolvedValue([1]); // Sequelize's update resolves to the number of affected rows
      (UserNotification.update as jest.Mock).mockImplementation(mockUpdate);

      const result = await service.updateNotification(
        mockNotificationId,
        mockUser,
      );

      // Validate the response
      expect(result).toEqual({ success: true });

      // Ensure UserNotification.update was called with correct arguments
      expect(UserNotification.update).toHaveBeenCalledWith(
        { unread: false },
        {
          where: { user_id: mockUser.id, notification_id: mockNotificationId },
        },
      );
    });
  });
});
