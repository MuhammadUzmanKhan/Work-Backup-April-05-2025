import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UploadIncidentDto } from '@Modules/incident/dto';
import { User } from '@ontrack-tech-group/common/models';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('incidentQueue') private readonly incidentQueue: Queue,
  ) {}

  async uploadCSVInitiator(
    uploadIncidentDto: UploadIncidentDto,
    incidentsData: any[],
    event_id: number,
    currentUser: User,
    divisionLockService: boolean,
  ) {
    return await this.incidentQueue.add('uploadCSVProcess', {
      uploadIncidentDto,
      incidentsData,
      event_id,
      currentUser,
      divisionLockService,
    });
  }
}
