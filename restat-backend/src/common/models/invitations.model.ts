import { UUID, UUIDV4, STRING, INTEGER } from "sequelize";
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AllowNull,
  ForeignKey
} from "sequelize-typescript";
import { ROLES } from "../constants/roles";
import { Workspaces } from "./workspaces.model";
import { INVITATION_STATUS } from "../constants/status";

@Table({ tableName: "invitations", timestamps: true })
export class Invitations extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @AllowNull(false)
  @Column({ type: STRING })
  email: string;

  @Column({ type: INTEGER, defaultValue: 0 })
  upworkTarget: string;

  @Column({ type: INTEGER, defaultValue: 0 })
  linkedinTarget: string;

  @AllowNull(false)
  @Column({ type: STRING })
  role: ROLES;

  @AllowNull(false)
  @Column({ type: STRING, defaultValue: INVITATION_STATUS.PENDING })
  status: INVITATION_STATUS;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  companyId: string;
}
