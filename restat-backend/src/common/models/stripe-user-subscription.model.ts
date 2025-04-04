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
import { Users } from "./users.model";
import { StripeSubscriptions } from "./stripe-subscription.model";
import { StripeProrationLogs } from "./stripe-proration-logs.model";

@Table({ tableName: "stripe-user-subscriptions", paranoid: true, timestamps: true })
export class StripeUserSubscriptions extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  userId: string;

  @ForeignKey(() => StripeSubscriptions)
  @Column({ type: UUID })
  subscriptionId: string;

  @AllowNull(false)
  @Column({ type: STRING })
  status: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  addedAt: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  removedAt: Date;

  @HasMany(() => StripeProrationLogs)
  stripeProrationLogs: StripeProrationLogs[];
}
