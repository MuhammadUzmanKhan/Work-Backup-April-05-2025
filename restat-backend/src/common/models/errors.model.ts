import { TEXT } from "sequelize";
import { UUID, UUIDV4 } from "sequelize";
import { AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Users } from "./users.model";

@Table({ tableName: "errors", paranoid: true, timestamps: true })
export class Errors extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Column({ type: TEXT })
    error: string;

    @ForeignKey(() => Users)
    @Column({ type: UUID, allowNull: true })
    userId: string;

    @BelongsTo(() => Users)
    user: Users;
  
}
