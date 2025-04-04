import { Event, User } from '@ontrack-tech-group/common/models';

export interface QueueEventJobInterface {
  id: number;
  newEvent: Event;
  user: User;
}
