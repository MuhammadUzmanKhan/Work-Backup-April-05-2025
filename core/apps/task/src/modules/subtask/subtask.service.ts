import momentTimezone from 'moment-timezone';
import { CreateOptions, DestroyOptions, Op, UpdateOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Department,
  Event,
  Image,
  Task,
  TaskCategory,
  User,
  UserTask,
} from '@ontrack-tech-group/common/models';
import {
  Editor,
  ERRORS,
  Options,
  PolymorphicType,
  RESPONSES,
  restrictedDeleteImageRoleTaskModule,
  SocketTypesStatus,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  CommunicationService,
  ImageService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import {
  getUserRole,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { TaskStatus, _ERRORS } from '@Common/constants';
import { sendTaskUpdate } from '@Common/helpers/sockets';
import {
  getTaskByIdQuery,
  isTaskExist,
  linkCategories,
} from '@Modules/task/helpers';
import { currentTimestamp, imageInclude, isPastDue } from '@Common/helpers';
import {
  createdSubtaskAssignee,
  excludeAttributes,
  getSubtaskByIdHelper,
  handleTaskUpdate,
  isSubtaskExist,
  sendRealTimeData,
} from './helper';
import {
  CreateSubtaskDto,
  RemoveSubtaskAttachmentsDto,
  UpdateSubtaskDto,
  UploadSubtaskAttachmentDto,
} from './dto';

@Injectable()
export class SubtaskService {
  constructor(
    private sequelize: Sequelize,
    private readonly imageService: ImageService,
    private readonly pusherService: PusherService,
    private readonly communicationService: CommunicationService,
  ) {}

  async createSubtask(createSubtaskDto: CreateSubtaskDto, user: User) {
    const {
      parent_id,
      subtasksAttachments,
      category_ids,
      user_id,
      department_id,
      status,
      deadline,
    } = createSubtaskDto;
    let subtask: Task;
    const bulkUrls = [];

    const task = await isTaskExist(parent_id);

    // If the parent task’s status is marked as “Completed,” restrict the user from creating subtasks.
    if (task.status === TaskStatus.COMPLETED)
      throw new BadRequestException(_ERRORS.PARENT_TASK_COMPLETED);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    // if the status changes to 'completed' within deadline, saving completed_past_due true else false
    if (status === TaskStatus.COMPLETED) {
      // Set completed_past_due based on deadline and current timestamp
      createSubtaskDto['completed_past_due'] =
        deadline < currentTimestamp(time_zone);

      createSubtaskDto['completed_past_due_duration'] = momentTimezone
        .tz(time_zone)
        .diff(momentTimezone(deadline))
        .toString();

      createSubtaskDto['completed_at'] = momentTimezone()
        .tz(time_zone)
        .toISOString();
    }

    const transaction = await this.sequelize.transaction();

    try {
      subtask = await Task.create(
        {
          ...createSubtaskDto,
          event_id: task.event_id,
          created_by: user.id,
          task_list_id: task.task_list_id,
        },
        {
          returning: true,
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & {
          editor: Editor;
        },
      );

      // linking categories to task
      if (category_ids)
        await linkCategories(
          category_ids,
          subtask.id,
          user,
          false,
          transaction,
        );

      /**
       * If URLs object is present while creating a subtask then saving multple images againts subtask
       * Make a URLs array according to DTO of creating a image
       * Passing this array to imageService for saving bulk Images
      event_id: task.event_id,
      */
      if (subtasksAttachments?.length) {
        for (const url of subtasksAttachments) {
          bulkUrls.push({
            name: url.name,
            url: url.url,
            imageable_id: subtask.id,
            imageable_type: PolymorphicType.TASK,
            creator_id: user.id,
          });
        }

        await this.imageService.createBulkImage(bulkUrls, null, transaction);
      }

      // assigning department or user
      if (user_id || department_id) {
        await createdSubtaskAssignee(
          subtask.id,
          {
            event_id: task.event_id,
            user_id,
            department_id,
          },
          subtask,
          this.pusherService,
          this.communicationService,
          user,
          transaction,
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Send pusher to both Task & Subtask
    handleTaskUpdate(
      subtask.id,
      subtask.event_id,
      time_zone,
      true,
      SocketTypesStatus.CREATE,
      this.pusherService,
    );

    // Send updated task to pusher
    sendRealTimeData(parent_id, this.pusherService, task.event_id, time_zone);

    return await this.getSubtaskById(subtask.id, parent_id, user, {
      useMaster: true,
    });
  }

  /**
   * Checking if subtask is existing or not
   * Make a URLs array according to DTO of creating a image
   * Passing this array to imageService for saving bulk Images
   * Adding changleLog on adding attachments of subtask
   */
  async uploadSubtaskAttachment(
    uploadSubtaskAttachmentDto: UploadSubtaskAttachmentDto,
    user: User,
  ) {
    const bulkUrls = [];
    const { subtask_id, parent_id, subtasksAttachments } =
      uploadSubtaskAttachmentDto;

    const task = await isTaskExist(parent_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    // saving buld images using image service
    for (const url of subtasksAttachments) {
      bulkUrls.push({
        name: url.name,
        url: url.url,
        imageable_id: subtask_id,
        imageable_type: PolymorphicType.TASK,
        creator_id: user.id,
      });
    }

    const transaction = await this.sequelize.transaction();

    try {
      bulkUrls?.length &&
        (await this.imageService.createBulkImage(bulkUrls, user, transaction));

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    sendRealTimeData(parent_id, this.pusherService, task.event_id, time_zone);

    // Send pusher to both Task & Subtask
    handleTaskUpdate(
      subtask_id,
      task.event_id,
      time_zone,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return await this.getSubtaskById(subtask_id, parent_id, user);
  }

  /**
   * @returns all subtask with attachments
   */
  async getAllSubtasks(parent_id: number, user: User) {
    const task = await isTaskExist(parent_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    return await Task.findAll({
      where: { parent_id },
      attributes: {
        exclude: excludeAttributes,
        include: [
          [Sequelize.literal('"event->departments"."name"'), 'department_name'],
          isPastDue('Task', time_zone),
        ],
      },
      include: [
        imageInclude([
          Sequelize.literal(`"images->created_by"."name"`),
          'createdBy',
        ]),
        {
          model: TaskCategory,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'cell', 'country_code'],
          through: { attributes: [] },
          include: [
            imageInclude([
              Sequelize.literal(`"users->images->created_by"."name"`),
              'createdBy',
            ]),
          ],
        },
        {
          model: Event,
          where: { id: task.event_id },
          attributes: [],
          include: [
            {
              model: Department,
              attributes: [],
              through: { attributes: [] },
              where: {
                id: {
                  [Op.eq]: Sequelize.literal('"Task"."department_id"'),
                },
              },
              required: false,
            },
          ],
        },
      ],
      order: [
        ['createdAt', SortBy.DESC],
        [{ model: Image, as: 'images' }, 'createdAt', SortBy.DESC],
      ],
    });
  }

  async getSubtaskById(
    id: number,
    parent_id: number,
    user: User,
    options?: Options,
  ) {
    const task = await isTaskExist(parent_id);

    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    const subtask = await Task.findOne({
      where: { id, parent_id },
      attributes: {
        exclude: excludeAttributes,
        include: [
          [Sequelize.literal('"event->departments"."name"'), 'department_name'],
          isPastDue('Task', time_zone),
        ],
      },
      include: [
        imageInclude([
          Sequelize.literal(`"images->created_by"."name"`),
          'createdBy',
        ]),
        {
          model: TaskCategory,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email', 'cell', 'country_code'],
          through: { attributes: [] },
          include: [
            imageInclude([
              Sequelize.literal(`"users->images->created_by"."name"`),
              'createdBy',
            ]),
          ],
        },
        {
          model: Event,
          attributes: [],
          include: [
            {
              model: Department,
              attributes: [],
              through: { attributes: [] },
              where: {
                id: {
                  [Op.eq]: Sequelize.literal('"Task"."department_id"'),
                },
              },
              required: false,
            },
          ],
        },
      ],
      order: [[{ model: Image, as: 'images' }, 'createdAt', SortBy.DESC]],
      ...options,
    });
    if (!subtask) throw new NotFoundException(RESPONSES.notFound('Subtask'));

    return subtask;
  }

  async updateSubtask(
    id: number,
    updateSubtaskDto: UpdateSubtaskDto,
    user: User,
  ) {
    const {
      subtasksAttachments,
      parent_id,
      category_ids,
      user_id,
      department_id,
      status,
      deadline,
    } = updateSubtaskDto;
    const bulkUrls = [];

    // checking if parent task exist or not
    const task = await isTaskExist(parent_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    // getting subtask and checking if subtask exist or not
    const subtask = await getSubtaskByIdHelper(id, parent_id, time_zone);
    const plainSubtask = subtask.get({ plain: true });

    // Before starting the transaction, check if deadline update should be ignored
    if (plainSubtask['is_date_locked'] && subtask.deadline !== deadline) {
      delete updateSubtaskDto.deadline;
    }

    // if the status changes to 'completed' within deadline, saving completed_past_due true else false
    if (status === TaskStatus.COMPLETED) {
      // Set completed_past_due based on deadline and current timestamp
      updateSubtaskDto['completed_past_due'] =
        subtask.deadline < currentTimestamp(time_zone);

      if (plainSubtask['is_past_due']) {
        updateSubtaskDto['completed_past_due_duration'] = momentTimezone
          .tz(time_zone)
          .diff(momentTimezone(subtask.deadline))
          .toString();
      }

      updateSubtaskDto['completed_at'] = momentTimezone()
        .tz(time_zone)
        .toISOString();
    } else {
      updateSubtaskDto['completed_past_due'] = false;
    }

    // If the deadline changes and the task is already completed, adjust the past due status
    if (
      updateSubtaskDto?.deadline > currentTimestamp(time_zone) &&
      subtask.status === TaskStatus.COMPLETED
    )
      updateSubtaskDto['completed_past_due'] = false;

    /**
     * If URLs object is present while updating a subtask then saving multple images againts subtask
     * Make a URLs array according to DTO of creating a image
     * Passing this array to imageService for saving bulk Images
     */
    if (subtasksAttachments?.length) {
      for (const url of subtasksAttachments) {
        bulkUrls.push({
          name: url.name,
          url: url.url,
          imageable_id: subtask.id,
          imageable_type: PolymorphicType.TASK,
          creator_id: user.id,
        });
      }
    }

    const transaction = await this.sequelize.transaction();

    try {
      // updaing subtask categories
      if (category_ids)
        await linkCategories(category_ids, subtask.id, user, true, transaction);

      await Task.update(updateSubtaskDto, {
        where: { id, parent_id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as UpdateOptions & {
        editor: Editor;
      });

      bulkUrls?.length &&
        (await this.imageService.createBulkImage(bulkUrls, user, transaction));

      if (user_id || department_id) {
        await createdSubtaskAssignee(
          subtask.id,
          {
            event_id: task.event_id,
            user_id,
            department_id,
          },
          subtask,
          this.pusherService,
          this.communicationService,
          user,
          transaction,
        );
      } else if (user_id === null) {
        await UserTask.destroy({
          where: { task_id: id },
          transaction,
        });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Send updated event to pusher
    sendRealTimeData(parent_id, this.pusherService, task.event_id, time_zone);

    // Send pusher to both Task & Subtask
    handleTaskUpdate(
      subtask.id,
      subtask.event_id,
      time_zone,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return await this.getSubtaskById(subtask.id, parent_id, user, {
      useMaster: true,
    });
  }

  /**
   * Checking if event, subtask and attachments are existing or not
   * Passing this attachment id to imageService for deleting a attachment of subtask
   * Adding changleLog on deleting attachment of subtask
   */
  async removeSubtaskAttachment(
    id: number,
    removeSubtaskAttachmentsDto: RemoveSubtaskAttachmentsDto,
    user: User,
  ) {
    const { parent_id, attachment_ids } = removeSubtaskAttachmentsDto;

    // checking subtask exist or not
    const subtask = await isSubtaskExist(id, parent_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, subtask.event_id);

    // fetching images attached to the subtask
    const images = await Image.findAll({
      where: {
        id: { [Op.in]: attachment_ids },
        imageable_id: id,
        imageable_type: PolymorphicType.TASK,
      },
      attributes: ['id', 'creator_id'],
    });

    // If some attachments are missing, throw an error
    if (images.length !== attachment_ids.length) {
      throw new NotFoundException(
        RESPONSES.notFound('Some of Attachments of given Subtask'),
      );
    }

    // Check role-based deletion restrictions
    const isRestrictedRole = restrictedDeleteImageRoleTaskModule(
      getUserRole(user),
    );

    if (isRestrictedRole) {
      const unauthorizedAttachments = images.filter(
        (image) => image.creator_id !== user.id,
      );
      if (unauthorizedAttachments.length > 0) {
        throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
      }
    }

    const transaction = await this.sequelize.transaction();

    try {
      // delete attachments
      await this.imageService.deleteMultipleImages(
        attachment_ids,
        user,
        transaction,
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Send updated event to pusher
    sendRealTimeData(
      parent_id,
      this.pusherService,
      subtask.event_id,
      time_zone,
    );

    // Send pusher to both Task & Subtask
    handleTaskUpdate(
      subtask.id,
      subtask.event_id,
      time_zone,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return { message: RESPONSES.destroyedSuccessfully('Subtask Attachment') };
  }

  /**
   * Checking if subtask is existing or not
   * Getting all attachments of subtasks and make a array of attachments Ids, passsing attachmentIds array to image service for destroying all attachments
   * Adding changleLog on deleting a subtask
   */
  async removeSubtask(id: number, parent_id: number, user: User) {
    // checking is parent exist or not
    const task = await isTaskExist(parent_id);

    // Check if user has access to this event or not based on its company or subcompany
    const [, , time_zone] = await withCompanyScope(user, task.event_id);

    const subtask = await getTaskByIdQuery(id, task.event_id, time_zone);

    // getting all attachments against this subtask
    const taskAttachments = await this.imageService.getImages(
      subtask.id,
      PolymorphicType.TASK,
    );

    const attachmentIds = taskAttachments.map(({ id }) => id);

    const transaction = await this.sequelize.transaction();

    try {
      await Task.destroy({
        where: { id, parent_id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as DestroyOptions & {
        editor: Editor;
      });

      // deleting all attachments againts this event subtask
      await this.imageService.deleteMultipleImages(
        attachmentIds,
        user,
        transaction,
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    // Get parent task data and make a plain copy for Pusher after deletion
    const parentSocketTask = await getTaskByIdQuery(
      subtask.parent_id,
      task.event_id,
      time_zone,
    );

    // for adding isDeleted attribute in socket
    const plainedSubtask = subtask.get({ plain: true });

    plainedSubtask['isDeleted'] = true;

    // Send pusher to both Task & Subtask
    sendTaskUpdate(
      plainedSubtask,
      false,
      SocketTypesStatus.DELETE,
      this.pusherService,
    );

    sendRealTimeData(parent_id, this.pusherService, task.event_id, time_zone);

    sendTaskUpdate(
      parentSocketTask,
      false,
      SocketTypesStatus.UPDATE,
      this.pusherService,
    );

    return { message: RESPONSES.destroyedSuccessfully('Subtask') };
  }
}
