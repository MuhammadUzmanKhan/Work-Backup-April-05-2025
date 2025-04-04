import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  ForeignKey,
  DataType,
  HasMany,
} from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";
import { StripeProrationLogs } from "./stripe-proration-logs.model";

@Table({ tableName: "stripe-subscriptions", paranoid: true, timestamps: true })
export class StripeSubscriptions extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  companyId: string;

  @AllowNull(false)
  @Column({ type: STRING })
  stripeSubscriptionId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  planId: string;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  maxUsers: number;
  
  @AllowNull(true)
  @Column({ type: DataType.DATE })
  startDate: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  endDate: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  currentPeriodStart: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  currentPeriodEnd: Date;

  @HasMany(() => StripeProrationLogs)
  stripeProrationLogs: StripeProrationLogs[];
}
