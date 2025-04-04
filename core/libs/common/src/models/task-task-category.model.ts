import { INTEGER, Transaction, Op } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  AfterBulkCreate,
  AfterDestroy,
} from 'sequelize-typescript';
import { ChangeLog, Task, TaskCategory } from '.';
import {
  createChangeLog,
  handleAfterCommit,
  sendChangeLogUpdate,
} from '../helpers';
import { Editor, PolymorphicType } from '../constants';

@Table({
  tableName: 'task_task_categories',
  underscored: true,
  timestamps: true,
})
export class TaskTaskCategory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Task)
  @Column({ type: INTEGER })
  task_id: number;

  @ForeignKey(() => TaskCategory)
  @Column({ type: INTEGER })
  task_category_id: number;

  @BelongsTo(() => Task)
  task: Task;

  @BelongsTo(() => TaskCategory)
  task_category: TaskCategory;

  @AfterBulkCreate
  static async bulkLinkCategoryChangeLog(
    taskTaskCategories: TaskTaskCategory[],
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Use the helper function to fetch Task-TaskCategory details
        const taskTaskCategoryIds = taskTaskCategories.map(({ id }) => id);

        const formattedTaskTaskCategoryDetails =
          await getTaskTaskCategory(taskTaskCategoryIds);

        // Create change logs using the task and category names
        const changeLogs = formattedTaskTaskCategoryDetails.map(
          ({ task, task_category }) => {
            const isSubtask = task.parent_id !== null;

            const formatted_log_text = isSubtask
              ? `Category '${task_category?.name}' has been assigned to SubTask (${task?.name})`
              : `Category '${task_category?.name}' has been assigned to Task`;

            return {
              formatted_log_text,
              change_logable_id: isSubtask ? task.parent_id : task.id,
              change_logable_type: PolymorphicType.TASK,
              column: 'category',
              editor_type: PolymorphicType.USER,
              old_value: null,
              new_value: task_category?.name,
              editor_id: editor.editor_id,
              commented_by: editor.editor_name,
            };
          },
        );

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

  @AfterDestroy
  static async bulkUnlinkCategoryChangeLog(
    taskTaskCategory: TaskTaskCategory,
    options: { transaction?: Transaction; editor?: Editor },
  ) {
    const { editor, transaction } = options;

    if (!editor) return;

    // Use helper to fetch task and category details
    const formattedTaskCategory = await getTaskTaskCategory([
      taskTaskCategory.id,
    ]);
    const { task, task_category } = formattedTaskCategory[0];

    if (transaction) {
      await handleAfterCommit(transaction, async () => {
        // Create change logs for task-task category unassignment
        const isSubtask = task.parent_id !== null;

        const formatted_log_text = isSubtask
          ? `Category '${task_category?.name}' has been unassigned from SubTask (${task?.name})`
          : `Category '${task_category?.name}' has been unassigned from Task`;

        const changelog = {
          formatted_log_text,
          change_logable_id: isSubtask ? task.parent_id : task.id,
          change_logable_type: PolymorphicType.TASK,
          column: 'category',
          editor_type: PolymorphicType.USER,
          old_value: task_category?.name,
          new_value: null,
          editor_id: editor.editor_id,
          commented_by: editor.editor_name,
        };

        await createChangeLog(changelog, editor, PolymorphicType.TASK);
      });
    }
  }
}

async function getTaskTaskCategory(ids: number[]) {
  return await TaskTaskCategory.findAll({
    where: {
      id: { [Op.in]: ids },
    },
    include: [
      {
        model: Task,
        attributes: ['name', 'id', 'parent_id'],
      },
      {
        model: TaskCategory,
        attributes: ['name'],
      },
    ],
    useMaster: true,
  });
}
