import { INTEGER, Op, Transaction } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  AfterCreate,
  AfterDestroy,
  AfterBulkCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { ChangeLog, Task, User } from '.';
import { Editor, PolymorphicType } from '../constants';
import {
  createChangeLog,
  handleAfterCommit,
  sendChangeLogUpdate,
} from '../helpers';

@Table({
  tableName: 'user_tasks',
  underscored: true,
  timestamps: true,
})
export class UserTask extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Task)
  @Column({ type: INTEGER })
  task_id: number;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Task)
  task: Task;

  @AfterCreate
  static async assignTaskChangeLog(
    userTask: UserTask,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const formattedUserTask = await this.getUserAndTasks([userTask.id]);
        const { user, task } = formattedUserTask[0];

        const isSubtask = task.parent_id !== null;
        const formatted_log_text = isSubtask
          ? `Subtask (${task.name}) has been assigned to '${user.name}'`
          : `Task has been assigned to '${user.name}'`;

        const changelog = {
          formatted_log_text,
          change_logable_id: isSubtask ? task.parent_id : task.id,
          change_logable_type: PolymorphicType.TASK,
          column: 'user',
          editor_type: PolymorphicType.USER,
          old_value: null,
          new_value: user.name,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.TASK);
      });
    }
  }

  @AfterBulkCreate
  static async bulkAssignTaskChangeLog(
    userTasks: UserTask[],
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Get all user-task IDs
        const userTaskIds = userTasks.map((userTask) => userTask.id);

        // Fetch multiple user-task objects
        const formattedUserTasks = await this.getUserAndTasks(userTaskIds);

        // Create change logs for each user-task assignment
        const changeLogs = formattedUserTasks.map(({ user, task }) => {
          const isSubtask = task.parent_id !== null;
          const formatted_log_text = isSubtask
            ? `Subtask (${task.name}) has been assigned to '${user.name}'`
            : `Task has been assigned to '${user.name}'`;

          return {
            formatted_log_text,
            change_logable_id: isSubtask ? task.parent_id : task.id,
            change_logable_type: PolymorphicType.TASK,
            column: 'user',
            editor_type: PolymorphicType.USER,
            old_value: null,
            new_value: user.name,
            editor_id: editor.editor_id,
            commented_by: editor.editor_name,
          };
        });

        // Bulk insert the change logs
        if (changeLogs.length) {
          const bulkChangeLogs = await ChangeLog.bulkCreate(changeLogs);

          // Send change log updates for each log
          for (const changelog of bulkChangeLogs) {
            await sendChangeLogUpdate(changelog, editor, PolymorphicType.TASK);
          }
        }
      });
    }
  }

  @BeforeUpdate
  static async updateAssignTaskChangeLog(
    userTask: UserTask,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const formattedUserTask = await this.getUserAndTasks([userTask.id]);
        const { user, task } = formattedUserTask[0];

        const isSubtask = task.parent_id !== null;
        const formatted_log_text = isSubtask
          ? `Subtask (${task.name}) has been assigned to '${user.name}'`
          : `Task has been assigned to '${user.name}'`;

        const changelog = {
          formatted_log_text,
          change_logable_id: isSubtask ? task.parent_id : task.id,
          change_logable_type: PolymorphicType.TASK,
          column: 'user',
          editor_type: PolymorphicType.USER,
          old_value: null,
          new_value: user.name,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.TASK);
      });
    }
  }

  @AfterDestroy
  static async unassingTaskChangeLog(
    userTask: UserTask,
    options: {
      transaction?: Transaction;
      editor?: Editor;
    },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    const formattedUserTask = await this.getUserAndTasks([userTask.id]);
    const { user, task } = formattedUserTask[0];

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        const isSubtask = task.parent_id !== null;
        const formatted_log_text = isSubtask
          ? `Subtask (${task.name}) has been unassigned from '${user.name}'`
          : `Task has been unassigned from '${user.name}'`;

        const changelog = {
          formatted_log_text,
          change_logable_id: isSubtask ? task.parent_id : task.id,
          change_logable_type: PolymorphicType.TASK,
          column: 'user',
          editor_type: PolymorphicType.USER,
          old_value: `${user.name}`,
          new_value: null,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.TASK);
      });
    }
  }

  static async getUserAndTasks(ids: number[]) {
    return await UserTask.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ['id'],
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
        {
          model: Task,
          attributes: ['id', 'name', 'parent_id'],
        },
      ],
      useMaster: true,
    });
  }
}
