import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  ForeignKey,
  DataType,
} from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";

@Table({ tableName: "stripe-billings", paranoid: true, timestamps: true })
export class StripeBillings extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  companyId: string;

  @AllowNull(false)
  @Column({ type: STRING })
  invoiceId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  planId: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  transactionDate: Date;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  amount: Number;

  @AllowNull(true)
  @Column({ type: STRING })
  currency: string;

  @AllowNull(true)
  @Column({ type: STRING })
  description: string;

  @AllowNull(true)
  @Column({ type: STRING })
  status: string;

  @AllowNull(true)
  @Column({ type: STRING })
  stripeChargeId: string;
}
