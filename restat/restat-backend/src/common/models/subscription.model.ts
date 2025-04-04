import { UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  ForeignKey,
  DataType,
  BelongsTo,
  HasOne,
} from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";
import { PaymentPlans } from "./payment-plans.model";
import { SubscriptionDetails } from "./subscription-details.model";
import { BillingCycle } from "src/types/payments";

@Table({ tableName: "subscriptions", paranoid: true, timestamps: true })
export class Subscriptions extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  workspaceId: string;

  @ForeignKey(() => PaymentPlans)
  @Column({ type: UUID })
  planId: string;

  @AllowNull(true)
  @Column({
    type: DataType.ENUM(...Object.values(BillingCycle)),
    defaultValue: BillingCycle.MONTHLY
  })
  billingCycle: BillingCycle;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  stripeSubscriptionId: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  billingDate: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  nextBillingDate: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  currentPeriodEnd: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  trialEndDate: Date;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT })
  nextExpectedAmount: number;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT })
  paidAmount: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  allowedUsers: number;

  @BelongsTo(() => PaymentPlans)
  plan: PaymentPlans

  @HasOne(() => SubscriptionDetails, {
    onDelete: 'CASCADE',
  })
  details: SubscriptionDetails

  // @AllowNull(true)
  // @Column({ type: DataType.DATE })
  // currentPeriodStart: Date;

  // @AllowNull(true)
  // @Column({ type: DataType.DATE })
  // currentPeriodEnd: Date;

  // @AllowNull(true)
  // @Column({ type: STRING })
  // stripeSubscriptionId: string;
}
