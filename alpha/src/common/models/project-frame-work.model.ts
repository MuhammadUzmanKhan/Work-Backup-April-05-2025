import { UUID, UUIDV4 } from 'sequelize';
import {
  BelongsTo,
  Column,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Project, FrameWork } from './index';

@Table({
  tableName: 'project_frame_work',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class ProjectFrameWork extends Model {
  @Index
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Project)
  @Column({ type: UUID, defaultValue: UUIDV4 })
  project_id: string;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => FrameWork)
  @Column({ type: UUID, defaultValue: UUIDV4 })
  frame_work_id: string;

  @BelongsTo(() => FrameWork)
  frame_work: FrameWork;
}
