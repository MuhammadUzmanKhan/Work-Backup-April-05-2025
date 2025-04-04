import { Op } from 'sequelize';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PresetMessage, User } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  SortBy,
  MESSAGES,
  RESPONSES,
  Options,
} from '@ontrack-tech-group/common/constants';
import {
  isEventExist,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  getAllPriorityGuideWhere,
  sendUpdatedPresetMessaging,
} from './helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  CreatePresetMessageDto,
  GetPresetMessageDto,
  UpdatePresetMessageDto,
} from './dto';
import { CloneDto } from '@Common/dto';
import { SocketTypes, _ERRORS, _MESSAGES } from '@Common/constants';

@Injectable()
export class PresetMessageService {
  constructor(private readonly pusherService: PusherService) {}

  async createPresetMessage(createPresetMessageDto: CreatePresetMessageDto) {
    const { event_id, hot_key } = createPresetMessageDto;

    await isEventExist(event_id);

    if (hot_key) {
      const presetMessageWithSameHotKey = await PresetMessage.findOne({
        where: {
          hot_key: { [Op.iLike]: `${hot_key.toLowerCase()}` },
          event_id,
        },
        attributes: ['id'],
      });

      if (presetMessageWithSameHotKey) {
        throw new BadRequestException(
          RESPONSES.alreadyExist('Preset Message With Same Hot Key'),
        );
      }
    }

    const newPresetMessage = await PresetMessage.create({
      ...createPresetMessageDto,
    });

    const presetMessage = await this.getPresetMessageById(
      newPresetMessage.id,
      event_id,
      { useMaster: true },
    );

    sendUpdatedPresetMessaging(
      { data: presetMessage },
      event_id,
      'new',
      SocketTypes.INCIDENT_PRESET_MESSAGING,
      true,
      this.pusherService,
    );

    return presetMessage;
  }

  async clonePresetMessaging(user: User, clonePresetMessagingDto: CloneDto) {
    const { clone_event_id, current_event_id } = clonePresetMessagingDto;

    let createdCount = 0;

    await withCompanyScope(user, current_event_id);

    const presetMessages = await PresetMessage.findAll({
      where: { event_id: clone_event_id },
    });

    const mappedPresetMessages = presetMessages.map((data) => ({
      title: data.title,
      text: data.text,
      hot_key: data.hot_key,
      is_enabled: data.is_enabled,
    }));

    if (!presetMessages.length)
      throw new NotFoundException(_ERRORS.NO_PRESET_MESSAGES_FOUND);

    for (const mappedPresetMessage of mappedPresetMessages) {
      const { title, hot_key, text, is_enabled } = mappedPresetMessage;
      mappedPresetMessage;

      const [created] = await PresetMessage.findOrCreate({
        where: {
          hot_key,
          event_id: current_event_id,
        },
        defaults: {
          title,
          text,
          is_enabled,
        },
      });

      if (created) {
        createdCount++;
      }
    }

    if (!createdCount) return { message: _ERRORS.NO_RECORDS_CLONE };

    sendUpdatedPresetMessaging(
      { message: 'Preset Message Cloned Successfully', createdCount },
      current_event_id,
      'clone',
      SocketTypes.INCIDENT_PRESET_MESSAGING,
      true,
      this.pusherService,
    );

    return { message: _MESSAGES.PRESET_MESSAGES_CLONE };
  }

  async getAllPresetMessages(getPresetMessageDto: GetPresetMessageDto) {
    return await PresetMessage.findAll({
      where: getAllPriorityGuideWhere(getPresetMessageDto),
      attributes: { exclude: ['updatedAt'] },
      order: [['createdAt', SortBy.DESC]],
    });
  }

  async getPresetMessageById(id: number, event_id: number, options?: Options) {
    const presetMessage = await PresetMessage.findOne({
      where: { id, event_id },
      attributes: { exclude: ['updatedAt'] },
      ...options,
    });

    if (!presetMessage)
      throw new NotFoundException(ERRORS.PRESET_MESSAGE_NOT_FOUND);

    return presetMessage;
  }

  async updatePresetMessage(
    id: number,
    updatePresetMessageDto: UpdatePresetMessageDto,
  ) {
    const { event_id, hot_key } = updatePresetMessageDto;

    const presetMessage = await PresetMessage.findOne({
      where: { id, event_id },
      attributes: { exclude: ['updatedAt'] },
    });
    if (!presetMessage)
      throw new NotFoundException(ERRORS.PRESET_MESSAGE_NOT_FOUND);

    if (hot_key) {
      const presetMessageWithSameHotKey = await PresetMessage.findOne({
        where: {
          hot_key: { [Op.iLike]: `${hot_key.toLowerCase()}` },
          event_id,
          id: { [Op.ne]: id },
        },
        attributes: ['id'],
      });

      if (presetMessageWithSameHotKey) {
        throw new BadRequestException(
          RESPONSES.alreadyExist('Preset Message With Same Hot Key'),
        );
      }
    }

    const updatedPresetMessage = await presetMessage.update({
      ...updatePresetMessageDto,
    });

    if (!updatedPresetMessage)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    const presetMessageUpdated = await this.getPresetMessageById(id, event_id, {
      useMaster: true,
    });

    sendUpdatedPresetMessaging(
      { data: presetMessageUpdated },
      event_id,
      'update',
      SocketTypes.INCIDENT_PRESET_MESSAGING,
      true,
      this.pusherService,
    );

    return presetMessageUpdated;
  }

  async deletePresetMessage(id: number, event_id: number) {
    const presetMessage = await PresetMessage.findOne({
      where: { id, event_id },
    });

    if (!presetMessage)
      throw new NotFoundException(ERRORS.PRESET_MESSAGE_NOT_FOUND);

    await presetMessage.destroy();

    sendUpdatedPresetMessaging(
      { data: id },
      event_id,
      'delete',
      SocketTypes.INCIDENT_PRESET_MESSAGING,
      true,
      this.pusherService,
    );

    return { message: MESSAGES.PRESET_MESSAGE_DESTROYED_SUCCESSFULLY };
  }
}
