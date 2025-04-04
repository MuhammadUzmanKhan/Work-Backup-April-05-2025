import {
  STRING,
  BOOLEAN,
  INTEGER,
  NUMBER,
  DATE,
  Op,
  Transaction,
} from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  AfterSave,
  Sequelize,
  AfterCreate,
  AfterBulkCreate,
  AfterDestroy,
} from 'sequelize-typescript';
import {
  Event,
  EventSubtasks,
  GlobalIncident,
  Incident,
  IncidentForm,
  IncidentZone,
  InventoryType,
  InventoryZone,
  LostAndFound,
  ReferenceMap,
  Route,
  ServiceRequest,
  User,
  Cad,
  Task,
  PersonInvolved,
  ChangeLog,
} from '.';
import { Literal } from 'sequelize/types/utils';
import { Editor, IosInterruptionLevel, PolymorphicType } from '../constants';
import { CommunicationService, TranslateService } from '../services';
import {
  createChangeLog,
  handleAfterCommit,
  pushNotificationJsonFormater,
  sendChangeLogUpdate,
} from '../helpers';
import { AppInjector } from '../controllers';

@Table({
  tableName: 'images',
  underscored: true,
  timestamps: true,
})
export class Image extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: NUMBER })
  imageable_id: number;

  @Column({ type: STRING })
  imageable_type: string;

  @Column({ type: STRING })
  url: string;

  @Column({ type: DATE })
  capture_at: Date;

  @ForeignKey(() => Event)
  @Column({ type: NUMBER })
  event_id: number;

  @Column({ type: STRING })
  creator_type: string;

  @ForeignKey(() => User)
  @Column({ type: NUMBER })
  creator_id: number;

  @Column({ type: BOOLEAN, defaultValue: true })
  primary: boolean;

  @Column({ type: NUMBER })
  image_type: number;

  @Column({ type: STRING })
  thumbnail: string;

  @BelongsTo(() => User)
  creator: User;

  @BelongsTo(() => Event, { foreignKey: 'imageable_id', constraints: false })
  events: Event;

  @BelongsTo(() => User, { foreignKey: 'imageable_id', constraints: false })
  users: User;

  @BelongsTo(() => EventSubtasks, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  eventSubtasks: EventSubtasks;

  @BelongsTo(() => InventoryType, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  inventory_type: InventoryType;

  @BelongsTo(() => InventoryZone, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  inventory_zone: InventoryZone;

  @BelongsTo(() => IncidentZone, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  incident_zone: IncidentZone;

  @BelongsTo(() => Route, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  route: Route;

  @BelongsTo(() => Incident, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  incident: Incident;

  @BelongsTo(() => IncidentForm, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  incident_form: IncidentForm;

  @BelongsTo(() => LostAndFound, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  lost_and_found: LostAndFound;

  @BelongsTo(() => ServiceRequest, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  service_request: ServiceRequest;

  @BelongsTo(() => GlobalIncident, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  global_incident: GlobalIncident;

  @BelongsTo(() => ReferenceMap, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  reference_map: ReferenceMap;

  @BelongsTo(() => Cad, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  cad: Cad;

  @BelongsTo(() => Task, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  task: Task;

  @BelongsTo(() => PersonInvolved, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  person_involved: PersonInvolved;

  @BelongsTo(() => Event, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  auditAttachments: Event;

  @BelongsTo(() => Event, {
    foreignKey: 'imageable_id',
    constraints: false,
  })
  eventIncidents: Event;

  @BelongsTo(() => User, {
    foreignKey: 'creator_id',
    constraints: false,
  })
  created_by: User;

  @AfterSave
  static async setPrimaryImageForUser(image: Image) {
    if (image.imageable_type === PolymorphicType.USER) {
      await Image.update(
        { primary: false },
        {
          where: {
            imageable_type: PolymorphicType.USER,
            imageable_id: image.imageable_id,
            id: { [Op.ne]: image.id },
          },
        },
      );
    }
  }

  @AfterCreate
  static async createAttachmentChangeLog(
    image: Image,
    options: { editor: Editor },
  ) {
    const { editor } = options;

    if (!editor) return;

    const polymorphicType = image.imageable_type;

    switch (polymorphicType) {
      case PolymorphicType.TASK:
        await this.generateCreateTaskAttachmentChangeLog(image, editor);
        break;

      case PolymorphicType.EVENT:
        await this.generateCreateEventAttachmentChangeLog(image, editor);
        break;

      default:
        return;
    }
  }

  @AfterBulkCreate
  static async BulkCreateAttachmentChangeLog(
    images: Image[],
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const polymorphicType = images[0].imageable_type;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        switch (polymorphicType) {
          case PolymorphicType.TASK:
            await this.taskAttachmentChangeLog(images, editor);
            break;
          case PolymorphicType.EVENT_SUBTASKS:
            await this.eventSubTaskAttachmentChangeLog(images, editor);
            break;

          // Ignore other PolymorphicTypes
          default:
            return;
        }
      });
    }
  }

  @AfterDestroy
  static async deleteAttachmentChangeLog(
    image: Image,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const polymorphicType = image.imageable_type;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        switch (polymorphicType) {
          case PolymorphicType.TASK:
            await this.generateDeleteTaskAttachmentChangeLog(image, editor);
            break;
          case PolymorphicType.EVENT:
            await this.generateDeleteEventAttachmentChangeLog(image, editor);
            break;
          case PolymorphicType.EVENT_SUBTASKS:
            await this.generateDeleteEventSubTaskAttachmentChangeLog(
              image,
              editor,
            );
            break;

          // Ignore other PolymorphicTypes
          default:
            return;
        }
      });
    }
  }

  public static getImageType: Literal = Sequelize.literal(`(
    CASE 
      WHEN "Image"."image_type" IS NOT NULL THEN 
        CASE 
            WHEN "Image"."image_type" = 0 THEN 'id_proof'
            WHEN "Image"."image_type" = 1 THEN 'incident'
            WHEN "Image"."image_type" = 2 THEN 'person_signature'
            WHEN "Image"."image_type" = 2 THEN 'reporter_signature'
            WHEN "Image"."image_type" = 2 THEN 'incident_area'
          END
      ELSE NULL
    END
  )`);

  static async sendIncidentImagePushNotification(
    image: Image,
    communicationService: CommunicationService,
  ) {
    const { imageable_type, id } = image;

    if (imageable_type !== PolymorphicType.INCIDENT) return;

    let _image = await Image.findByPk(id, {
      attributes: ['id', 'url'],
      include: [
        {
          model: Incident,
          attributes: ['id', 'company_id'],
          include: [
            {
              model: User,
              as: 'users',
              attributes: ['cell'],
            },
            {
              model: Event,
              attributes: ['id', 'name', 'company_id', 'incident_future_v2'],
            },
          ],
        },
      ],
      useMaster: true,
    });
    _image = _image.get({ plain: true });

    const event = _image.incident.event;

    const users = _image.incident.users;

    if (!users.length) return;

    const userNumbers = users.map((user) => user.cell);

    const notificationBody = pushNotificationJsonFormater(
      userNumbers,
      'New image uploaded successfully',
      `INCIDENT TICKET #${_image.incident.id}`,
      {
        event_id: event.id,
        incident_id: _image.incident.id,
        company_id: event.company_id,
        image_url: _image.url,
        type: 'incident',
        incident_v2: event['incident_future_v2'],
      },
      event,
      IosInterruptionLevel.TIME_SENSITIVE,
    );

    try {
      await communicationService.communication(
        { notificationBody },
        'send-push-notification',
      );
    } catch (error) {
      console.log('send incident image push notification error: ', error);
    }
  }

  static async getTaskByIdOrIds(taskIds: number[]) {
    return await Task.findAll({
      where: { id: { [Op.in]: taskIds } },
      attributes: ['id', 'name', 'parent_id'],
    });
  }

  // Function to handle task attachment creation logs
  static async generateCreateTaskAttachmentChangeLog(
    image: Image,
    editor: Editor,
  ) {
    const task = await Image.getTaskByIdOrIds([image.imageable_id]);
    const isSubtask = task[0].parent_id !== null;

    const formatted_log_text = isSubtask
      ? `Uploaded a file '${image.name}' against Subtask (${task[0].name})`
      : `Uploaded a file '${image.name}'`;

    const change_logable_id = isSubtask
      ? task[0].parent_id
      : image.imageable_id;

    const changelog = {
      formatted_log_text,
      change_logable_id,
      change_logable_type: PolymorphicType.TASK,
      column: 'image',
      editor_id: editor.editor_id,
      editor_type: PolymorphicType.USER,
      old_value: null,
      new_value: image.url,
      commented_by: editor.editor_name,
    };

    await createChangeLog(changelog, editor, PolymorphicType.TASK);
  }

  // Function to handle event attachment creation logs
  static async generateCreateEventAttachmentChangeLog(
    image: Image,
    editor: Editor,
  ) {
    const changelog = {
      formatted_log_text: `Uploaded a file`,
      change_logable_id: image.imageable_id,
      change_logable_type: PolymorphicType.EVENT,
      column: 'attachment',
      editor_id: editor.editor_id,
      editor_type: PolymorphicType.USER,
      old_value: null,
      new_value: image.url,
      commented_by: editor.editor_name,
    };

    await createChangeLog(changelog, editor, PolymorphicType.EVENT);
  }

  // Function to handle bulk task attachment creation logs
  static async taskAttachmentChangeLog(images: Image[], editor: Editor) {
    // Fetch task information for each image's associated task
    const imageableIds = images.map((image) => image.imageable_id);
    const tasks = await Image.getTaskByIdOrIds(imageableIds);

    // Create change logs for each image
    const changeLogs = images
      .map((image) => {
        const task = tasks.find((task) => task.id === image.imageable_id);

        const isSubtask = task?.parent_id !== null;
        const formatted_log_text = isSubtask
          ? `Uploaded a file '${image.name}' against Subtask (${task.name})`
          : `Uploaded a file '${image.name}'`;

        return {
          formatted_log_text,
          change_logable_id: isSubtask
            ? task[0]?.parent_id
            : image.imageable_id,
          change_logable_type: PolymorphicType.TASK,
          column: 'image',
          editor_id: editor.editor_id,
          editor_type: PolymorphicType.USER,
          old_value: null,
          new_value: image.url,
          commented_by: editor.editor_name,
        };
      })
      .filter(Boolean);

    // Bulk insert the change logs
    if (changeLogs.length) {
      const bulkChangeLogs = await ChangeLog.bulkCreate(changeLogs);

      const translateService = await AppInjector.resolve(TranslateService);

      // Send change log updates for each log
      for (const changelog of bulkChangeLogs) {
        const logs =
          await translateService.translateSingleChangLogToAllLanguages(
            changelog,
            PolymorphicType.TASK,
          );

        await sendChangeLogUpdate(logs, editor, PolymorphicType.TASK);
      }
    }
  }

  // Function to handle bulk task attachment creation logs
  static async eventSubTaskAttachmentChangeLog(
    images: Image[],
    editor: Editor,
  ) {
    const changeLogs = [];

    for (const image of images) {
      // Fetch the EventSubTask by imageable_id, which is likely the subtask id
      const subtask = await this.getEventSubTaskById(image.imageable_id);

      const formatted_log_text = `Uploaded a file '${image.name}' against Event Task '${subtask.name}'`;

      changeLogs.push({
        formatted_log_text,
        change_logable_id: subtask.event_id,
        change_logable_type: PolymorphicType.EVENT,
        column: 'attachment',
        editor_id: editor.editor_id,
        editor_type: PolymorphicType.USER,
        old_value: null,
        new_value: image.url,
        commented_by: editor.editor_name,
      });
    }

    // Bulk insert the change logs if any exist
    if (changeLogs.length) {
      const bulkChangeLogs = await ChangeLog.bulkCreate(changeLogs);

      // Send change log updates for each log
      for (const changelog of bulkChangeLogs) {
        await sendChangeLogUpdate(changelog, editor, PolymorphicType.EVENT);
      }
    }
  }

  // Function to handle task attachment deletion logs
  static async generateDeleteTaskAttachmentChangeLog(
    image: Image,
    editor: Editor,
  ) {
    const task = await Image.getTaskByIdOrIds([image.imageable_id]);
    const isSubtask = task[0].parent_id !== null;

    const formatted_log_text = isSubtask
      ? `Deleted a file '${image.name}' against Subtask (${task[0].name})`
      : `Deleted a file '${image.name}'`;

    const change_logable_id = isSubtask
      ? task[0].parent_id
      : image.imageable_id;

    const changelog = {
      formatted_log_text,
      change_logable_id,
      change_logable_type: PolymorphicType.TASK,
      column: 'image',
      editor_id: editor.editor_id,
      editor_type: PolymorphicType.USER,
      old_value: image.url,
      new_value: null,
      commented_by: editor.editor_name,
    };

    await createChangeLog(changelog, editor, PolymorphicType.TASK);
  }

  // Function to handle event attachment deletion logs
  static async generateDeleteEventAttachmentChangeLog(
    image: Image,
    editor: Editor,
  ) {
    const changelog = {
      formatted_log_text: `Deleted a file '${image.name}'`,
      change_logable_id: image.imageable_id,
      change_logable_type: PolymorphicType.EVENT,
      column: 'attachment',
      editor_id: editor.editor_id,
      editor_type: PolymorphicType.USER,
      old_value: image.url,
      new_value: null,
      commented_by: editor.editor_name,
    };

    await createChangeLog(changelog, editor, PolymorphicType.EVENT);
  }

  // Function to handle delete event subtask attachment deletion logs
  static async generateDeleteEventSubTaskAttachmentChangeLog(
    image: Image,
    editor: Editor,
  ) {
    const subtask = await this.getEventSubTaskById(image.imageable_id);

    const changelog = {
      formatted_log_text: `Deleted a file '${image.name}' of Event Task '${subtask.name}'`,
      change_logable_id: subtask.event_id,
      change_logable_type: PolymorphicType.EVENT,
      column: 'subtask_attachment',
      editor_id: editor.editor_id,
      editor_type: PolymorphicType.USER,
      old_value: image.url,
      new_value: null,
      commented_by: editor.editor_name,
    };

    await createChangeLog(changelog, editor, PolymorphicType.EVENT);
  }

  static async getEventSubTaskById(id: number) {
    return await EventSubtasks.findByPk(id, {
      attributes: ['id', 'event_id', 'name'],
      useMaster: true,
    });
  }
}
