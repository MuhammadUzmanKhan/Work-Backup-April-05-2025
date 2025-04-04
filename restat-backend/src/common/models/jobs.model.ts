import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Tags } from "./tags.model";
import { JobsTags } from "./jobs-tags.model";
import { Accounts } from "./accounts.model";
import { Bids } from "./bids.model";
import { TEXT } from "sequelize";
import { BOOLEAN } from "sequelize";
import { Op } from "sequelize";

@Table({ tableName: "jobs", paranoid: true, timestamps: true })
export class Jobs extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(true)
  @Column({ type: STRING })
  category: string;

  @ForeignKey(() => Accounts)
  @Column({ type: UUID })
  accountId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  connects: number;

  @AllowNull(true)
  @Column({ type: STRING })
  title: string;

  @AllowNull(true)
  @Column({ type: TEXT })
  description: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  postedDate: Date;

  @AllowNull(true)
  @Column({ type: STRING })
  experienceLevel: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hourlyRange: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hourly: string;

  @AllowNull(true)
  @Column({ type: STRING })
  projectLength: string;

  @AllowNull(false)
  @Column({ type: STRING })
  url: string;

  @AllowNull(true)
  @Column({ type: STRING })
  type: string;

  @AllowNull(true)
  @Column({ type: STRING })
  featured: boolean;

  @AllowNull(true)
  @Column({ type: STRING })
  proposeYourTerms: string;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  inviteOnly: boolean;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  deletedAt: Date;

  @BelongsToMany(() => Tags, () => JobsTags)
  tags: Tags[];

  @HasMany(() => JobsTags)
  jobsTags: JobsTags[];

  @HasMany(() => Bids)
  bids: Bids[];

  @BelongsTo(() => Accounts)
  account: Accounts

  async assignJobTags(workspaceId: string, tags: Tags[]) {
    const bulkInsertJobTags: {
      jobId: string;
      tagId: string;
      workspaceId: string;
    }[] = [];

    const theTags = tags.map((tag) => tag.id);

    const existingJobTags = await JobsTags.findAll({
      where: {
        workspaceId,
        jobId: this.id,
        tagId: { [Op.in]: theTags },
      },
    });

    const existingTagIds = existingJobTags.map((jobTag) => jobTag.tagId);
    for (const tag of tags) {
      if (!existingTagIds.includes(tag.id)) {
        bulkInsertJobTags.push({
          jobId: this.id,
          tagId: tag.id,
          workspaceId
        });
      }
    }
    
    if (bulkInsertJobTags.length > 0) {
      await JobsTags.bulkCreate(bulkInsertJobTags);
    }
  }

  async getJobTags(workspaceId: string, jobId: string) {
    const jobTags = await JobsTags.findAll({
      where: { jobId, workspaceId },
    });
    return jobTags;
  }

  async deleteJobTags(tags: any[]) {
    try {
      const tagsToDelete = await JobsTags.findAll({
        where: { id: tags.map((tag) => tag.id) },
      });
      if (tagsToDelete.length === 0) {
        return {
          message: "error",
          error: "No matching tags found!",
        };
      }

      await JobsTags.destroy({
        where: {
          id: tagsToDelete.map((tag) => tag.id),
        },
      });

      return {
        message: "success",
        deletedTags: tagsToDelete,
      };
    } catch (err) {
      return {
        message: "error",
        deletionError: err,
      };
    }
  }
}
