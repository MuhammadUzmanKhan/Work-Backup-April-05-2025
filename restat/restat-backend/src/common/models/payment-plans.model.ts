import { STRING, UUID, UUIDV4, INTEGER, BOOLEAN, JSONB } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  DataType,
} from "sequelize-typescript";
import { TrialDurationEnum } from "src/types/payments";

@Table({ tableName: "payment_plans", paranoid: true, timestamps: true })
export class PaymentPlans extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @Column({ type: STRING })
  stripeProductId: string;

  @Column({ type: INTEGER })
  index: number;

  @Column({ type: STRING })
  name: string;

  @AllowNull(true)
  @Column({ type: STRING })
  description: string;

  @Column({ type: INTEGER })
  basePrice: number;

  @AllowNull(true)
  @Column({ type: INTEGER })
  maxUsers: number;

  @AllowNull(true)
  @Column({ type: INTEGER })
  includedUsers: number;

  @AllowNull(true)
  @Column({ type: INTEGER })
  extraUserPrice: number;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  isTrial: boolean;

  @AllowNull(true)
  @Column({
    type: DataType.ENUM(...Object.values(TrialDurationEnum)),
  })
  trialDuration: TrialDurationEnum;

  @AllowNull(true)
  @Column({ type: JSONB })
  features: { name: string; available: boolean }[];
}
