import { UploadIncidentDto } from '@Modules/incident/dto';
import { uploadIncidentCompiler } from '@Modules/incident/helpers';
import { Processor, Process } from '@nestjs/bull';
import { PusherService } from '@ontrack-tech-group/common/services';
import { User } from '@ontrack-tech-group/common/models';
import { Job } from 'bull';

interface JobInterface extends Job {
  data: {
    uploadIncidentDto: UploadIncidentDto;
    incidentsData: any[];
    event_id: number;
    currentUser: User;
    divisionLockService: boolean;
  };
}

@Processor('incidentQueue')
export class QueueProcessor {
  constructor(private readonly pusherService: PusherService) {}
  @Process('uploadCSVProcess')
  async handleTask(job: JobInterface) {
    const { data } = job;

    return await uploadIncidentCompiler(
      data.uploadIncidentDto,
      this.pusherService,
      data.incidentsData,
      data.event_id,
      data.currentUser,
      undefined,
      true,
    );
  }
}
