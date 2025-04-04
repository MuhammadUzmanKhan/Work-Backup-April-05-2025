
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
} from "sequelize-typescript";
import { Subscriptions } from "./subscription.model";

@Table({ tableName: "subscription-details", paranoid: true, timestamps: true })
export class SubscriptionDetails extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Subscriptions)
  @Column({ type: UUID })
  subscriptionId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  stripeCustomerId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  stripePaymentMethodId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  cardBrand: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  cardCountry: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  cardLast4: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  cardExpMonth: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  cardExpYear: string;
  
  @BelongsTo(() => Subscriptions)
  subscription: Subscriptions
}
