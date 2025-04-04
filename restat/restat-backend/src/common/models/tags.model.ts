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
import { Source } from "src/types/enum";
import { Jobs } from "./jobs.model";
import { JobsTags } from "./jobs-tags.model";
import { Portfolios } from "./portfolios.model";
import { PortfoliosTags } from "./portfolios-tags.model";
import { Workspaces } from "./workspaces.model";

@Table({ tableName: "tags", paranoid: true, timestamps: true })
export class Tags extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @AllowNull(false)
  @Column({ type: STRING })
  source: Source;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  workspaceId: string;

  @BelongsToMany(() => Jobs, () => JobsTags)
  jobs: Jobs[];

  @HasMany(() => JobsTags)
  jobsTags: JobsTags[];

  @BelongsToMany(() => Portfolios, () => PortfoliosTags)
  portfolios: Portfolios[];

  @HasMany(() => PortfoliosTags)
  porfoliosTags: PortfoliosTags[];
}
