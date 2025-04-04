import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MobileIncidentInbox,
  GlobalIncident,
  User,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  isOntrackRole,
  MESSAGES,
  Options,
  SortBy,
  VisibleStatus,
} from '@ontrack-tech-group/common/constants';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import { SocketTypes } from '@Common/constants';
import {
  CreateMobileIncidentInboxDto,
  UpdateMobileIncidentInboxDto,
} from './dto';
import {
  getMobileIncidentInbox,
  sendUpdatedMobileIncidentInbox,
} from './helpers';

@Injectable()
export class MobileIncidentInboxService {
  constructor(private readonly pusherService: PusherService) {}
  async createMobileIncidentInbox(
    createMobileIncidentInboxDto: CreateMobileIncidentInboxDto,
  ) {
    // if there visible_status not in DTO, saving visible_status as HIDE
    const { visible_status, event_id } = createMobileIncidentInboxDto;

    const createdMobileIncidentInbox = await MobileIncidentInbox.create({
      ...createMobileIncidentInboxDto,
      visible_status: visible_status
        ? Object.keys(VisibleStatus).indexOf(visible_status.toUpperCase())
        : Object.keys(VisibleStatus).indexOf(VisibleStatus.HIDE.toUpperCase()),
    });

    if (!createdMobileIncidentInbox)
      throw new UnprocessableEntityException(
        ERRORS.MOBILE_INCIDENT_INBOX_COULD_NOT_BE_CREATED,
      );

    const mobileIncidentInbox = await this.getMobileIncidentInboxById(
      createdMobileIncidentInbox.id,
      event_id,
      { useMaster: true },
    );

    sendUpdatedMobileIncidentInbox(
      { message: `Created Successfully`, mobileIncidentInbox },
      event_id,
      'create',
      SocketTypes.INCIDENT_MOBILE_INBOX,
      true,
      this.pusherService,
    );

    return await getMobileIncidentInbox(createdMobileIncidentInbox.id);
  }

  async getAllMobileIncidentInboxes(event_id: number) {
    return await MobileIncidentInbox.findAll({
      where: {
        event_id,
      },
      attributes: {
        exclude: ['updatedAt'],
        include: [[MobileIncidentInbox.getStatusNameByKey, 'visible_status']],
      },
      order: [['name', SortBy.DESC]],
    });
  }

  async getMobileIncidentInboxById(
    id: number,
    event_id: number,
    options?: Options,
  ) {
    const mobileIncidentInbox = await MobileIncidentInbox.findOne({
      where: { id, event_id },
      attributes: {
        exclude: ['updatedAt'],
        include: [[MobileIncidentInbox.getStatusNameByKey, 'visible_status']],
      },
      ...options,
    });

    if (!mobileIncidentInbox)
      throw new NotFoundException(ERRORS.MOBILE_INCIDENT_INBOX_NOT_FOUND);

    return mobileIncidentInbox;
  }

  async updateMobileIncidentInbox(
    id: number,
    updateMobileIncidentInboxDto: UpdateMobileIncidentInboxDto,
  ) {
    const { event_id, visible_status } = updateMobileIncidentInboxDto;

    const mobileIncidentInbox = await MobileIncidentInbox.findOne({
      where: { id, event_id },
      attributes: { exclude: ['updatedAt'] },
    });

    if (!mobileIncidentInbox)
      throw new NotFoundException(ERRORS.MOBILE_INCIDENT_INBOX_NOT_FOUND);

    const updatedMobileIncidentInbox = await mobileIncidentInbox.update({
      ...updateMobileIncidentInboxDto,
      visible_status: visible_status
        ? Object.keys(VisibleStatus).indexOf(visible_status.toUpperCase())
        : mobileIncidentInbox.visible_status,
    });

    if (!updatedMobileIncidentInbox)
      throw new UnprocessableEntityException(
        ERRORS.MOBILE_INCIDENT_INBOX_COULD_NOT_BE_UPDATED,
      );

    const socketMobileIncidentInbox = await this.getMobileIncidentInboxById(
      id,
      event_id,
      { useMaster: true },
    );

    sendUpdatedMobileIncidentInbox(
      { message: `Updated Successfully`, socketMobileIncidentInbox },
      event_id,
      'update',
      SocketTypes.INCIDENT_MOBILE_INBOX,
      false,
      this.pusherService,
    );

    return await getMobileIncidentInbox(updatedMobileIncidentInbox.id, {
      useMaster: true,
    });
  }

  async deleteMobileIncidentInbox(id: number, event_id: number, user: User) {
    // checking company level permission
    let [company_id] = await withCompanyScope(user, event_id);

    company_id = isOntrackRole(user['role']) ? company_id : user['company_id'];

    const mobileIncidentInbox = await MobileIncidentInbox.findOne({
      where: { id, event_id },
      attributes: ['id'],
    });

    if (!mobileIncidentInbox)
      throw new NotFoundException(ERRORS.MOBILE_INCIDENT_INBOX_NOT_FOUND);

    const globalIncident = await GlobalIncident.findOne({
      attributes: ['id'],
      where: {
        event_id,
        company_id,
      },
    });

    if (globalIncident)
      throw new UnprocessableEntityException(
        ERRORS.GLOBAL_INCIDENT_DATA_PRESENT_FOR_THIS_MOBILE_INBOX_IT_CANNOT_BE_DESTROYED,
      );

    await mobileIncidentInbox.destroy();

    sendUpdatedMobileIncidentInbox(
      { message: `Deleted Successfully`, id },
      event_id,
      'delete',
      SocketTypes.INCIDENT_MOBILE_INBOX,
      false,
      this.pusherService,
    );

    return { message: MESSAGES.MOBILE_INCIDENT_INBOX_SUCCESSFULLY_DESTROYED };
  }
}
