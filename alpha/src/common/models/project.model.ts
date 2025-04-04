import { UUIDV4, TEXT, DATEONLY } from 'sequelize';
import { UUID, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AllowNull,
  Index,
  HasMany,
} from 'sequelize-typescript';
import { ProjectFrameWork, ProjectLibrary } from './index';

@Table({
  tableName: 'projects',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class Project extends Model {
  @Index
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @Column({ type: TEXT })
  git_url: string;

  @Column({ type: TEXT })
  audit_report: string;

  @Column({ type: TEXT })
  figma_link: string;

  @Column({ type: TEXT })
  pm_template: string;

  @AllowNull(false)
  @Column({ type: TEXT })
  description?: string;

  @Column({ type: TEXT })
  tech_stack: string;

  @Column({ type: DATEONLY })
  start_date: Date;

  @Column({ type: DATEONLY })
  end_date: Date;

  @HasMany(() => ProjectFrameWork, { onDelete: 'CASCADE' })
  project_technologies: ProjectFrameWork[];

  @HasMany(() => ProjectLibrary, { onDelete: 'CASCADE' })
  project_library: ProjectLibrary[];
}
