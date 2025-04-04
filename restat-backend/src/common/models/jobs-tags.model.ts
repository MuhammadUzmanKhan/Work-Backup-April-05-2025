import { UUID, UUIDV4 } from "sequelize";
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Jobs } from "./jobs.model";
import { Tags } from "./tags.model";
import { Workspaces } from "./workspaces.model";

@Table({ tableName: "jobs_tags", timestamps: true })
export class JobsTags extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Jobs)
  jobId: string;

  @ForeignKey(() => Tags)
  tagId: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  workspaceId: string;

  @BelongsTo(() => Jobs)
  jobs: Jobs;

  @BelongsTo(() => Tags)
  tags: Tags;

}
