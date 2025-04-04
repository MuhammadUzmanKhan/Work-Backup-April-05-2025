import { CreateOptions, DestroyOptions, UpdateOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Editor,
  ERRORS,
  NotificationModule,
  NotificationType,
  Options,
  PolymorphicType,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  User,
  EventSubtasks,
  Event,
  Image,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  withCompanyScope,
  throwCatchError,
  isEventExist,
} from '@ontrack-tech-group/common/helpers';
import { imageInclude } from '@Common/helpers';
import { EventService } from '@Modules/event/event.service';
import { ImageService } from '@Modules/image/image.service';
import { QueuesService } from '@Modules/queues/queues.service';
import {
  CreateEventSubtaskDto,
  UpdateEventSubtaskDto,
  UploadSubtaskAttachmentDto,
} from './dto';
import { scheduleNotification } from './helpers';

@Injectable()
export class EventSubtasksService {
  constructor(
    private readonly eventsService: EventService,
    private readonly pusherService: PusherService,
    private readonly imageService: ImageService,
    private readonly sequelize: Sequelize,
    private readonly queuesService: QueuesService,
  ) {}

  async createSubtask(
    createEventSubtaskDto: CreateEventSubtaskDto,
    event_id: number,
    user: User,
  ) {
    let subtask: EventSubtasks;
    const { eventSubtasksAttachments } = createEventSubtaskDto;

    // if user has access to this event
    await withCompanyScope(user, event_id);

    const transaction = await this.sequelize.transaction();

    try {
      subtask = await EventSubtasks.create(
        { ...createEventSubtaskDto, event_id },
        {
          returning: true,
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & {
          editor: Editor;
        },
      );

      /**
       * If URLs object is present while creating a subtask then saving multple images againts subtask
       * Make a URLs array according to DTO of creating a image
       * Passing this array to imageService for saving bulk Images
       */
      if (eventSubtasksAttachments?.length) {
        const bulkUrls = [];
        for (const url of eventSubtasksAttachments) {
          bulkUrls.push({
            name: url.name,
            url: url.url,
            imageable_id: +subtask.id,
            imageable_type: PolymorphicType.EVENT_SUBTASKS,
          });
        }

        await this.imageService.createBulkImage(bulkUrls, user, transaction);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }
    // Send updated event to pusher
    this.sendRealTimeData(event_id, user);

    return this.getSubtaskById(subtask.id, event_id, user, { useMaster: true });
  }

  /**
   * Checking if event and subtask are existing or not
   * Make a URLs array according to DTO of creating a image
   * Passing this array to imageService for saving bulk Images
   * Adding changleLog on adding attachments of subtask
   */
  async uploadSubtaskAttachment(
    uploadSubtaskAttachmentDto: UploadSubtaskAttachmentDto,
    user: User,
  ) {
    const { subtask_id, event_id, eventSubtasksAttachments } =
      uploadSubtaskAttachmentDto;

    // if user has access to this event
    const [company_id] = await withCompanyScope(user, event_id);

    const event = await isEventExist(event_id);

    // saving buld images using image service
    const bulkUrls = [];
    for (const url of eventSubtasksAttachments) {
      bulkUrls.push({
        name: url.name,
        url: url.url,
        imageable_id: +subtask_id,
        imageable_type: PolymorphicType.EVENT_SUBTASKS,
        creator_id: user.id,
      });
    }

    const transaction = await this.sequelize.transaction();

    try {
      await this.imageService.createBulkImage(bulkUrls, user, transaction);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    this.sendRealTimeData(event_id, user);

    const eventSubtask = await this.getSubtaskById(
      +subtask_id,
      event_id,
      user,
      {
        useMaster: true,
      },
    );

    try {
      const message = `An attachment has been uploaded to the event plan '${eventSubtask.name}' within the event '${event.name}'`;
      const message_html = `An attachment has been uploaded to the event plan <strong>${eventSubtask.name}</strong> within the event <strong>${event.name}</strong>`;
      const subject = 'Attachment Has Been Uploaded in Event Plan';

      const schedulerData = {
        event_id,
        company_id,
        event: event.get({ plain: true }),
        module: NotificationModule.EVENT,
        type: NotificationType.UPLOAD,
        subject,
        message,
        message_html,
        queueService: this.queuesService,
      };

      await scheduleNotification(schedulerData);
    } catch (err) {
      console.log('🚀 ~ EventSubtasksService ~ err:', err);
    }

    return eventSubtask;
  }

  /**
   * @returns all subtask with attachments
   */
  async getAllSubtasks(event_id: number, user: User) {
    // if user has access to this event
    await withCompanyScope(user, event_id);

    return await EventSubtasks.findAll({
      where: { event_id },
      include: imageInclude,
      order: [['createdAt', SortBy.DESC]],
    });
  }

  async getSubtaskById(
    id: number,
    event_id: number,
    user: User,
    options?: Options,
  ) {
    // if user has access to this event
    await withCompanyScope(user, event_id);

    const subtask = await EventSubtasks.findOne({
      where: { id },
      include: imageInclude,
      ...options,
    });
    if (!subtask) throw new NotFoundException(ERRORS.SUBTASK_NOT_FOUND);

    return subtask;
  }

  async updateCompleted(id: number, event_id: number, user: User) {
    const [subtask] = await this.getSubtaskByIdAndEvent(id, event_id);

    // if user has access to this event
    const [company_id] = await withCompanyScope(user, event_id);

    const event = await isEventExist(event_id);

    const transaction = await this.sequelize.transaction();

    try {
      // updating the status of the subtask
      await EventSubtasks.update({ completed: !subtask.completed }, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Send updated event to pusher
    this.sendRealTimeData(event_id, user);

    const eventSubtask = await this.getSubtaskById(subtask.id, event_id, user, {
      useMaster: true,
    });

    const allSubtaskComplete = await EventSubtasks.count({
      where: { event_id, completed: false },
    });

    try {
      if (!allSubtaskComplete) {
        const message = `Event Plan has been Completed in event '${event.name}'`;
        const message_html = `Event Plan has been Completed in event <strong>${event.name}</strong>`;
        const subject = 'Event Plan Has Been Completed';

        const schedulerData = {
          event_id,
          company_id,
          event: event.get({ plain: true }),
          module: NotificationModule.EVENT,
          type: NotificationType.EVENT_PLAN_COMPLETE,
          subject,
          message,
          message_html,
          queueService: this.queuesService,
        };

        await scheduleNotification(schedulerData);
      }
    } catch (err) {
      console.log('🚀 ~ EventSubtasksService ~ updateCompleted ~ err:', err);
    }

    return eventSubtask;
  }

  async updateSubtask(
    id: number,
    event_id: number,
    updateEventSubtaskDto: UpdateEventSubtaskDto,
    user: User,
  ) {
    const { eventSubtasksAttachments } = updateEventSubtaskDto;
    const bulkUrls = [];

    // if user has access to this event
    await withCompanyScope(user, event_id);

    // checking if subtask exists
    const [subtask] = await this.getSubtaskByIdAndEvent(id, event_id);

    /**
     * If URLs object is present while updating a subtask then saving multple images againts subtask
     * Make a URLs array according to DTO of creating a image
     * Passing this array to imageService for saving bulk Images
     */
    if (eventSubtasksAttachments?.length) {
      for (const url of eventSubtasksAttachments) {
        bulkUrls.push({
          name: url.name,
          url: url.url,
          imageable_id: +subtask.id,
          imageable_type: PolymorphicType.EVENT_SUBTASKS,
          creator_id: user.id,
        });
      }
    }

    const transaction = await this.sequelize.transaction();

    try {
      await EventSubtasks.update(updateEventSubtaskDto, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: {
          editor_id: user.id,
          editor_name: user.name,
        } as Editor,
      } as UpdateOptions & { editor?: Editor });

      bulkUrls?.length &&
        (await this.imageService.createBulkImage(bulkUrls, user, transaction));

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Send updated event to pusher
    this.sendRealTimeData(event_id, user);

    return this.getSubtaskById(subtask.id, event_id, user, { useMaster: true });
  }

  /**
   * Checking if event and subtask are existing or not
   * Getting all attachments of subtasks and make a array of attachments Ids, passsing attachmentIds array to image service for destroying all attachments
   * Adding changleLog on deleting a subtask
   */
  async removeSubtask(id: number, event_id: number, user: User) {
    const [subtask] = await this.getSubtaskByIdAndEvent(id, event_id);

    // if user has access to this event
    await withCompanyScope(user, event_id);

    // getting all attachments against this event subtask
    const taskAttachments = await this.imageService.getImages(
      subtask.id,
      PolymorphicType.EVENT_SUBTASKS,
    );

    const attachmentIds = taskAttachments.map(({ id }) => id);

    const transaction = await this.sequelize.transaction();

    try {
      await EventSubtasks.destroy({
        where: { id: subtask.id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as DestroyOptions & {
        editor: Editor;
      });

      // deleting all attachments againts this event subtask
      await this.imageService.deleteMultipleImages(attachmentIds, transaction);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Send updated event to pusher
    this.sendRealTimeData(event_id, user);

    return { success: true };
  }

  /**
   * Checking if event, subtask and attachments are existing or not
   * Passing this attachment id to imageService for deleting a attachment of subtask
   * Adding changleLog on deleting attachment of subtask
   */
  async removeSubtaskAttachment(
    id: number,
    attachmentId: number,
    event_id: number,
    user: User,
  ) {
    await withCompanyScope(user, event_id);

    // fetching attachment of event -> tasks
    const eventSubtaskAttachment = await Event.findOne({
      where: { id: event_id },
      include: [
        {
          model: EventSubtasks,
          where: { id },
          include: [
            {
              model: Image,
              where: { id: attachmentId },
            },
          ],
        },
      ],
    });

    if (!eventSubtaskAttachment)
      throw new NotFoundException(
        'Attachment not found against this event task!',
      );

    const transaction = await this.sequelize.transaction();

    try {
      // delete attachment
      await this.imageService.deleteImage(attachmentId, user, transaction);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Send updated event to pusher
    this.sendRealTimeData(event_id, user);

    return { success: true };
  }

  async getSubtaskByIdAndEvent(id: number, event_id: number) {
    const eventTasks = await Event.findOne({
      where: { id: event_id },
      include: [
        {
          model: EventSubtasks,
          where: { id },
        },
      ],
    });
    if (!eventTasks) throw new NotFoundException(ERRORS.SUBTASK_NOT_FOUND);

    return [eventTasks.subtasks[0], eventTasks] as [EventSubtasks, Event];
  }

  /**
   * Send updated event to pusher
   */
  private async sendRealTimeData(event_id: number, user: User) {
    const event = await this.eventsService.getEventById(event_id, user);
    this.pusherService.sendUpdatedEvent(event as Event);
  }
}
