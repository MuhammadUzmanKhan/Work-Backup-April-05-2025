import { Processor, Process } from '@nestjs/bull';
import { Preset } from '@ontrack-tech-group/common/models';
import {
  BullProcesses,
  BullQueues,
  MESSAGES,
} from '@ontrack-tech-group/common/constants';
import {
  CommunicationService,
  IncidentService,
} from '@ontrack-tech-group/common/services';
import {
  EmailOrScheduleJobInterface,
  ReportingScheduleJobInterface,
} from '@Common/constants';
import { formatAndGenerateCsv } from '@Modules/preset/helpers';
import { QueueService } from './queues.service';

@Processor(BullQueues.REPORTING)
export class QueueProcessor {
  constructor(
    private readonly incidentCommunicationService: IncidentService,
    private readonly communicationService: CommunicationService,
    private readonly queueService: QueueService,
  ) {}
  @Process(BullProcesses.SEND_EMAIL_OR_SCHEDULE)
  async handleEmailOrScheduleJob(job: EmailOrScheduleJobInterface) {
    const {
      data: { schedulePresets, emailNowPresets },
    } = job;

    await this.sendEmail(emailNowPresets);

    // schedule remaining presets which have some buffer
    await Promise.all(
      schedulePresets.map(async (preset) =>
        this.queueService.schedulePreset(preset, preset.user),
      ),
    );
  }

  /**
   * This function sends email to list of presets immediately when this function called
   * @param emailNowPresets
   */
  private async sendEmail(emailNowPresets: Preset[]) {
    for (const preset of emailNowPresets) {
      const { csv, filters, user, event, email, pdf, name, id } = preset;

      let incidents = [];
      let csvData = null;

      try {
        incidents = await this.incidentCommunicationService.communicate(
          filters,
          'get-incidents-by-filter',
          user,
        );
      } catch (error) {
        console.log('🚀 ~ PresetService ~ sendEmail ~ error:', error);
      }

      if (csv) {
        csvData = await formatAndGenerateCsv(incidents, event.time_zone);
      }

      try {
        const response = await this.communicationService.communication(
          {
            csvData,
            recipientEmails: email, // if it is not scheduled then use user's email
            pdfUrl: null,
            content: {
              event: event.name,
              company: event.company.name,
              preset: name,
              attachments: Number(csv) + Number(pdf),
            },
          },
          'send-reporting-email',
        );

        if (response.message === MESSAGES.EMAIL_HAS_BEEN_SENT_SUCCESSFULLY) {
          await Preset.update(
            { last_export_time: new Date() },
            { where: { id } },
          );
        }
      } catch (error) {
        console.log('🚀 ~ PresetService ~ sendEmail ~ error:', error);
      }
    }
  }

  @Process(BullProcesses.REPORTING_SCHEDULE)
  async handleEmailJob(job: ReportingScheduleJobInterface) {
    const {
      data: { preset, user },
    } = job;

    await this.sendEmail([{ ...preset, user }] as Preset[]);
  }
}
