import {
  INTEGER,
  TEXT,
  BOOLEAN,
  STRING,
  JSONB,
  Sequelize,
  Transaction,
} from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  HasMany,
  BelongsTo,
  BelongsToMany,
  BeforeUpdate,
  AfterCreate,
  AfterDestroy,
  AfterBulkCreate,
} from 'sequelize-typescript';
import { Literal } from 'sequelize/types/utils';
import {
  User,
  Event,
  Image,
  TaskList,
  UserTask,
  TaskCategory,
  TaskTaskCategory,
  ChangeLog,
  Comment,
  IncidentDivision,
  Department,
} from '.';
import { Editor, PolymorphicType, TaskLocation } from '../constants';
import {
  createChangeLog,
  formatDateTimeWithTimezone,
  handleAfterCommit,
  humanizeTitleCase,
  sendChangeLogUpdate,
} from '../helpers';
import { AppInjector } from '../controllers';
import { TranslateService } from '../services';

@Table({
  tableName: 'tasks',
  underscored: true,
  timestamps: true,
})
export class Task extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: TEXT })
  description: string;

  @Column({ type: STRING })
  deadline: string;

  @Column({ type: STRING })
  start_date: string;

  @Column({ type: 'TIMESTAMP' })
  completed_at: Date;

  @ForeignKey(() => IncidentDivision)
  @Column({ type: INTEGER })
  incident_division_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @ForeignKey(() => TaskList)
  @Column({ type: INTEGER })
  task_list_id: number;

  @Column({ type: BOOLEAN })
  priority: boolean;

  @Column({ type: STRING })
  status: string;

  @Column({ type: BOOLEAN })
  is_recursive: boolean;

  @ForeignKey(() => Task)
  @Column({ type: INTEGER })
  parent_id: number;

  @Column({ type: JSONB })
  location: TaskLocation;

  @Column({ type: STRING })
  color: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  created_by: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @Column({ type: INTEGER })
  order: number;

  @Column({ type: BOOLEAN, defaultValue: false })
  completed_past_due: boolean;

  @Column({ type: STRING })
  completed_past_due_duration: string;

  @Column({ type: BOOLEAN, defaultValue: false })
  is_pinned: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => TaskList)
  task_list: TaskList;

  @BelongsTo(() => IncidentDivision)
  incidentDivision: IncidentDivision;

  @BelongsTo(() => Department, { foreignKey: 'department_id' })
  department: Department;

  @HasMany(() => Image, {
    foreignKey: 'imageable_id',
    scope: { imageable_type: PolymorphicType.TASK },
    onDelete: 'CASCADE',
    as: 'images',
  })
  images: Image[];

  @HasMany(() => UserTask, { foreignKey: 'task_id' })
  user_tasks: UserTask[];

  @BelongsToMany(() => User, () => UserTask)
  users: User[];

  @HasMany(() => TaskTaskCategory, { foreignKey: 'task_id' })
  task_task_categories: TaskTaskCategory[];

  @BelongsToMany(() => TaskCategory, () => TaskTaskCategory)
  task_categories: TaskCategory[];

  @HasMany(() => ChangeLog, {
    foreignKey: 'change_logable_id',
    constraints: false,
    scope: { change_logable_type: PolymorphicType.TASK },
    as: 'task_logs',
  })
  task_logs: ChangeLog[];

  @HasMany(() => Comment, {
    foreignKey: 'commentable_id',
    constraints: false,
    scope: { commentable_type: PolymorphicType.TASK },
    as: 'task_comments',
  })
  task_comments: Comment[];

  @HasMany(() => Task, { foreignKey: 'parent_id' })
  subtasks: Task[];

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    constraints: false,
  })
  creator: User;

  @AfterCreate
  static async createTaskChangeLog(
    task: Task,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const isSubtask = task.parent_id !== null;
        const formatted_log_text = isSubtask
          ? `created a Subtask (${task.name})`
          : `created a Task`;

        const changelog = {
          formatted_log_text,
          change_logable_id: isSubtask ? task.parent_id : task.id,
          change_logable_type: PolymorphicType.TASK,
          column: isSubtask ? 'subtask' : 'task',
          editor_type: PolymorphicType.USER,
          old_value: null,
          new_value: task.name,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.TASK);
      });
    }
  }

  @AfterBulkCreate
  static async bulkCreateTaskChangeLog(
    tasks: Task[],
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Create change logs for each task
        const changeLogs = tasks.map((task) => {
          const isSubtask = task.parent_id !== null;
          const formatted_log_text = isSubtask
            ? `created a Subtask (${task.name})`
            : `created a Task`;

          return {
            formatted_log_text,
            change_logable_id: isSubtask ? task.parent_id : task.id,
            change_logable_type: PolymorphicType.TASK,
            column: isSubtask ? 'subtask' : 'task',
            editor_type: PolymorphicType.USER,
            old_value: null,
            new_value: task.name,
            editor_id: editor.editor_id,
            commented_by: editor.editor_name,
          };
        });

        // Bulk insert the change logs
        if (changeLogs.length) {
          const bulkChangeLogs = await ChangeLog.bulkCreate(changeLogs);
          for (const changelog of bulkChangeLogs) {
            await sendChangeLogUpdate(changelog, editor, PolymorphicType.TASK);
          }
        }
      });
    }
  }

  @BeforeUpdate
  static async updateTaskChangelogs(
    task: Task,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    // Fetch the old state of the task before the update
    const oldTask = await this.getTaskById(task.id);

    // Map of user properties to track changes
    const mapping: Record<string, string> = {
      name: 'name',
      description: 'description',
      deadline: 'deadline',
      incident_division_id: 'incident_division_id',
      department_id: 'department_id',
      task_list_id: 'task_list_id',
      status: 'status',
      priority: 'priority',
      color: 'color',
      is_pinned: 'is_pinned',
      start_date: 'start_date',
    };

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Get the fields that have been modified in this update
        const changedFields = task.changed() || [];

        // Map the changed fields to the properties we care about
        const properties = changedFields
          .map((field) => mapping[field])
          .filter(Boolean);

        const updatedTask = await this.getTaskById(task.id);

        const plainUpdatedTask = updatedTask.get({ plain: true });

        if (properties.length) {
          // Generate the change logs for the modified properties
          let changelogs = [];

          // if task is subtask then using subtask format function otherwise using task format function
          changelogs = task.parent_id
            ? await this.formatSubtaskChangeLog(
                properties,
                updatedTask,
                editor,
                oldTask,
              )
            : await this.formatTaskChangeLog(
                properties,
                updatedTask,
                editor,
                oldTask,
              );

          if (changelogs.length) {
            const bulkChangeLogs = await ChangeLog.bulkCreate(changelogs);

            const translateService =
              await AppInjector.resolve(TranslateService);

            const timeZone = plainUpdatedTask?.event?.time_zone;

            for (const changelog of bulkChangeLogs) {
              const logs =
                await translateService.translateSingleChangLogToAllLanguages(
                  changelog,
                  PolymorphicType.TASK,
                  timeZone,
                );

              await sendChangeLogUpdate(
                logs,
                editor,
                PolymorphicType.TASK,
                timeZone,
              );
            }
          }
        }
      });
    }
  }

  @AfterDestroy
  static async deleteSubtaskChangeLog(
    subtask: Task,
    options: { transaction?: Transaction; editor: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor || subtask.parent_id === null) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const changelog = {
          formatted_log_text: `Subtask (${subtask.name}) has been deleted`,
          change_logable_id: subtask.parent_id,
          change_logable_type: PolymorphicType.TASK,
          column: 'subtask',
          editor_type: PolymorphicType.USER,
          old_value: subtask.name,
          new_value: null,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.TASK);
      });
    }
  }

  static async getTaskById(id: number) {
    return await Task.findByPk(id, {
      attributes: [
        'id',
        'name',
        'description',
        'deadline',
        'incident_division_id',
        'department_id',
        'task_list_id',
        'status',
        'priority',
        'color',
        'is_pinned',
        'parent_id',
        'start_date',
      ],
      include: [
        {
          model: IncidentDivision,
          attributes: ['id', 'name'],
        },
        {
          model: Department,
          attributes: ['id', 'name'],
        },
        {
          model: TaskList,
          attributes: ['id', 'name'],
        },
        {
          model: Event,
          attributes: ['id', 'time_zone'],
        },
      ],
      useMaster: true,
    });
  }

  static async formatTaskChangeLog(
    properties: string[],
    task: Task,
    editor: Editor,
    oldTask: Task,
  ) {
    const changelogs = [];
    const taskPlain = task.get({ plain: true });
    const oldTaskPlain = oldTask.get({ plain: true });

    // fetching timezone from event
    const timezone = taskPlain.event.time_zone;

    for (const property of properties) {
      let text = '';
      const newValue = taskPlain[property];
      const oldValue = oldTaskPlain[property];

      switch (property) {
        case 'priority':
          text = `Priority has been '${newValue ? 'Set' : 'Unset'}'`;
          break;
        case 'incident_division_id':
          text = `Incident Division has been updated from '${oldTask.incidentDivision?.name || 'N/A'}' to '${task.incidentDivision?.name || 'N/A'}'`;
          break;
        case 'task_list_id':
          text = `Task List has been updated from '${oldTaskPlain?.task_list?.['name'] || 'Standalone'}' to '${taskPlain?.task_list?.['name'] || 'Standalone'}'`;
          break;
        case 'start_date':
          text = `Start Date has been updated from '${oldValue ? formatDateTimeWithTimezone(oldValue, timezone) : 'N/A'}' to '${newValue ? formatDateTimeWithTimezone(newValue, timezone) : 'N/A'}'`;
          break;
        case 'deadline':
          text = `Deadline has been updated from '${oldValue ? formatDateTimeWithTimezone(oldValue, timezone) : 'N/A'}' to '${newValue ? formatDateTimeWithTimezone(newValue, timezone) : 'N/A'}'`;
          break;
        case 'department_id':
          if (newValue === null) {
            text = `Department '${oldTask.department?.name || 'N/A'}' has been unassigned`;
          } else if (oldValue === null) {
            text = `Department '${task.department?.name || 'N/A'}' has been assigned`;
          } else {
            text = `Department has been updated from '${oldTask.department?.name || 'N/A'}' to '${task.department?.name || 'N/A'}'`;
          }
          break;
        default:
          text = `${humanizeTitleCase(property)} has been updated from '${oldValue || 'N/A'}' to '${newValue}'`;
          break;
      }

      changelogs.push({
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: taskPlain.id,
        change_logable_type: PolymorphicType.TASK,
        parent_changed_at: new Date(),
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        editor_name: editor.editor_name,
      });
    }

    return changelogs;
  }

  static async formatSubtaskChangeLog(
    properties: string[],
    subtask: Task,
    editor: Editor,
    oldSubtask: Task,
  ) {
    const changelogs = [];
    const subtaskPlain = subtask.get({ plain: true });
    const oldSubtaskPlain = oldSubtask.get({ plain: true });
    const subtaskNamePrefix = `${subtaskPlain.name}`;

    // fetching timezone from event
    const timezone = subtaskPlain.event.time_zone;

    for (const property of properties) {
      let text = '';
      const newValue = subtaskPlain[property];
      const oldValue = oldSubtaskPlain[property];

      switch (property) {
        case 'priority':
          text = `Priority of Subtask (${subtaskNamePrefix}) has been '${newValue ? 'Set' : 'Unset'}'`;
          break;
        case 'incident_division_id':
          text = `Incident Division has been updated from '${oldSubtask.incidentDivision?.name || 'N/A'}' to '${subtask.incidentDivision?.name || 'N/A'}' of Subtask (${subtaskNamePrefix})`;
          break;
        case 'task_list_id':
          text = `Task List has been updated from '${oldSubtaskPlain?.task_list?.['name'] || 'Standalone'}' to '${subtaskPlain?.task_list?.['name'] || 'Standalone'}' of Subtask (${subtaskNamePrefix})`;
          break;
        case 'start_date':
          text = `Start Date has been updated from '${oldValue ? formatDateTimeWithTimezone(oldValue, timezone) : 'N/A'}' to '${newValue ? formatDateTimeWithTimezone(newValue, timezone) : 'N/A'}' of Subtask (${subtaskNamePrefix})`;
          break;
        case 'deadline':
          text = `Deadline has been updated from '${oldValue ? formatDateTimeWithTimezone(oldValue, timezone) : 'N/A'}' to '${newValue ? formatDateTimeWithTimezone(newValue, timezone) : 'N/A'}' of Subtask (${subtaskNamePrefix})`;
          break;
        case 'department_id':
          if (newValue === null) {
            text = `Department '${oldSubtask.department?.name || 'N/A'}' has been unassigned from the Subtask (${subtaskNamePrefix})`;
          } else if (oldValue === null) {
            text = `Department '${subtask.department?.name || 'N/A'}' has been assigned to the Subtask (${subtaskNamePrefix})`;
          } else {
            text = `Department has been updated from '${oldSubtask.department?.name || 'N/A'}' to '${subtask.department?.name || 'N/A'}' of Subtask (${subtaskNamePrefix})`;
          }
          break;
        default:
          text = `Updated the ${humanizeTitleCase(property)} from '${oldValue || 'N/A'}' to '${newValue}' of Subtask (${subtaskNamePrefix})`;
          break;
      }

      changelogs.push({
        old_value: oldValue,
        column: property,
        new_value: newValue,
        formatted_log_text: text,
        change_logable_id: subtaskPlain.parent_id,
        change_logable_type: PolymorphicType.TASK,
        parent_changed_at: new Date(),
        editor_type: PolymorphicType.USER,
        editor_id: editor.editor_id,
        editor_name: editor.editor_name,
      });
    }

    return changelogs;
  }

  public static taskStatusSequence: Literal = Sequelize.literal(`(
    CASE 
      WHEN "Task"."status" = 'Blocked' THEN 0
      WHEN "Task"."status" = 'Open' THEN 1
      WHEN "Task"."status" = 'In Progress' THEN 2
      WHEN "Task"."status" = 'Completed' THEN 3
    END
  )`);

  public static _taskStatusSequence: Literal = Sequelize.literal(`(
    CASE 
      WHEN "tasks"."status" = 'Blocked' THEN 0
      WHEN "tasks"."status" = 'Open' THEN 1
      WHEN "tasks"."status" = 'In Progress' THEN 2
      WHEN "tasks"."status" = 'Completed' THEN 3
    END
  )`);
}
