import { UUID, UUIDV4 } from "sequelize";
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Tags } from "./tags.model";
import { Portfolios } from "./portfolios.model";

@Table({ tableName: "portfolios_tags", timestamps: true })
export class PortfoliosTags extends Model<PortfoliosTags> {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Portfolios)
  portfolioId: string;

  @ForeignKey(() => Tags)
  tagId: string;

  @BelongsTo(() => Portfolios)
  portfolios: Portfolios;

  @BelongsTo(() => Tags)
  tags: Tags;
}
