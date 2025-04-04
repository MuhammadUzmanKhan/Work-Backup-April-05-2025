import { UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  Column,
  Model,
  PrimaryKey,
  Table,
  ForeignKey,
  DataType,
  HasMany
} from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";
import { InvoiceItems } from "./invoice_items.model";

@Table({ tableName: "invoices", paranoid: true, timestamps: true })
export class Invoices extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  workspaceId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  orderId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  transactionId: string;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  invoiceNo: string;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  totalAmount: number;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  billingPeriodStart: Date;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  billingPeriodEnd: Date;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN })
  isPaid: boolean;

  @HasMany(() => InvoiceItems, {
    onDelete: 'CASCADE',
  })
  items: InvoiceItems[];

}
