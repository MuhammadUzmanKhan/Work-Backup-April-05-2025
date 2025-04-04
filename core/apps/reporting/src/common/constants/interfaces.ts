import { Job } from 'bull';
import { Preset, User } from '@ontrack-tech-group/common/models';

export interface EmailOrScheduleJobInterface extends Job {
  data: {
    emailNowPresets: Preset[];
    schedulePresets: Preset[];
  };
}

export interface ReportingScheduleJobInterface extends Job {
  data: { preset: Preset; user: User };
}
