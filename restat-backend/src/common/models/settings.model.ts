import { BOOLEAN, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Users } from "./users.model";
import { SOURCE } from "../constants/source";
import { STRING } from "sequelize";
import { INTEGER } from "sequelize";
import { Workspaces } from "./workspaces.model";

@Table({ tableName: "settings", paranoid: true, timestamps: true })
export class Settings extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  userId: string; 

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  companyId: string; 

  @AllowNull(true)
  @Column({ type: BOOLEAN, defaultValue: false })
  autoClose: boolean;

  @AllowNull(true)
  @Column({ type: STRING, defaultValue: SOURCE.UPWORK })
  defaultTab: SOURCE;

  @AllowNull(true)
  @Column({ type: INTEGER, defaultValue: 900000 })
  sessionTimeout: number;

  @BelongsTo(() => Workspaces)
  company: Workspaces

  @BelongsTo(() => Users)
  user: Users

}
