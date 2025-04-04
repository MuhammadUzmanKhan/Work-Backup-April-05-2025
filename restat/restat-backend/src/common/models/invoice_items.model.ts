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
import { Invoices } from "./invoices.model";
import { BillingCycle } from "src/types/payments";

@Table({ tableName: "invoice_items", paranoid: true, timestamps: true })
export class InvoiceItems extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Invoices)
  @Column({ type: UUID })
  invoiceId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  name: string;

  @AllowNull(true)
  @Column({
    type: DataType.ENUM(...Object.values(BillingCycle)),
    defaultValue: BillingCycle.MONTHLY
  })
  billingCycle: BillingCycle;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  quantity: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  unitPrice: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  totalPrice: number;

  @BelongsTo(() => Invoices)
  invoice: Invoices;
}
