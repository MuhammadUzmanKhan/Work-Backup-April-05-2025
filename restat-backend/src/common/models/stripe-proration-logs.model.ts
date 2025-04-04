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
import { StripeSubscriptions } from "./stripe-subscription.model";
import { StripeUserSubscriptions } from "./stripe-user-subscription.model";

@Table({ tableName: "stripe-proration-logs", paranoid: true, timestamps: true })
export class StripeProrationLogs extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => StripeUserSubscriptions)
  @Column({ type: UUID })
  stripeUserSubscriptionId: string;

  @ForeignKey(() => StripeSubscriptions)
  @Column({ type: UUID })
  subscriptionId: string;

  @AllowNull(false)
  @Column({ type: STRING })
  eventType: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  eventDate: Date;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER })
  proratedAmount: number;
}
