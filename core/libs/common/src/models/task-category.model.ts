import { INTEGER, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Company, TaskTaskCategory } from '.';

@Table({
  tableName: 'task_categories',
  underscored: true,
  timestamps: true,
})
export class TaskCategory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @HasMany(() => TaskTaskCategory, { foreignKey: 'task_category_id' })
  task_task_categories: TaskTaskCategory[];

  @BelongsTo(() => Company)
  company: Company;
}
