import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  BelongsToMany,
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";
import { Links } from "./links.model";
import { Tags } from "./tags.model";
import { PortfoliosTags } from "./portfolios-tags.model";
import { TEXT } from "sequelize";
import { Op } from "sequelize";
@Table({ tableName: "portfolios", paranoid: true, timestamps: true })
export class Portfolios extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @AllowNull(true)
  @Column({ type: TEXT })
  description: string;

  @AllowNull(false)
  @Column({ type: STRING })
  type: string;

  @AllowNull(true)
  @Column({ type: STRING })
  clickupId: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  companyId: string;

  @BelongsToMany(() => Tags, () => PortfoliosTags)
  tags: Tags[];

  @HasMany(() => Links)
  links: Links[];

  @HasMany(() => PortfoliosTags)
  porfoliosTags: PortfoliosTags[];

  async assignPortfoloTags(tags: any[], createdAt?: Date, updatedAt?: Date) {
    const bulkInsertPortfolioTags: { tagId: string, portfolioId: string, createdAt: Date, updatedAt: Date }[] = []
    const theTags = tags.map((tag) => tag.id);
    const existingJobTags = await PortfoliosTags.findAll({
      where: {
        portfolioId: this.id,
        tagId: { [Op.in]: theTags },
      },
    });
    const existingTagIds = existingJobTags.map((jobTag) => jobTag.tagId);
    for (const tag of tags) {
      if (!existingTagIds.includes(tag.id)) {
        bulkInsertPortfolioTags.push({
          portfolioId: this.id,
          tagId: tag.id,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        });
      }
    }
    if (bulkInsertPortfolioTags.length > 0) {
      return await PortfoliosTags.bulkCreate(bulkInsertPortfolioTags);
    }
  }

  async getPortfolioTags(portfolioId: string) {
    const portfolioTags = await PortfoliosTags.findAll({ where: { portfolioId } })
    return portfolioTags
  }

  async deletePortfolioTags(tags: any[]) {
    try {
      const tagsToDelete = await PortfoliosTags.findAll({
        where: { id: tags.map((tag) => tag.id) },
      })
      if (tagsToDelete.length === 0) {
        return {
          message: "error",
          error: "No matching tags found!",
        };
      }

      await PortfoliosTags.destroy({
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
        deletionError: "An error occurred while deleting tags",
      }
    }
  }
}
