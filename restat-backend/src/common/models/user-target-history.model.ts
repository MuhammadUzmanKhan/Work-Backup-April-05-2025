import { UUID, UUIDV4 } from "sequelize";
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AllowNull
} from "sequelize-typescript";
import { Users } from "./users.model";
import { INTEGER, TEXT } from "sequelize";
import { DATE } from "sequelize";

@Table({ tableName: "user-target-history", timestamps: true })
export class UserTargetHistory extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  userId: string;

  @Column({ type: TEXT })
  type: string;

  @Column({ type: INTEGER })
  target: number;

  @Column({ type: DATE })
  validFrom: Date;

  @AllowNull(true)
  @Column({ type: DATE })
  validTo: Date;

}
