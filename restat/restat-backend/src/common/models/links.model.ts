import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Portfolios } from "./portfolios.model";
import { Workspaces } from "./workspaces.model";
@Table({ tableName: "links", paranoid: true, timestamps: true })
export class Links extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(true)
  @Column({ type: STRING })
  title: string;

  @AllowNull(false)
  @Column({ type: STRING })
  url: string;

  @ForeignKey(() => Portfolios)
  @Column({ type: UUID })
  portfolioId: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  workspaceId: string;
}
