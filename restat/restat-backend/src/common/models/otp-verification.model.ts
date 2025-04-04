import {
    Model,
    Column,
    ForeignKey,
    Table,
    DataType,
    BelongsTo,
} from 'sequelize-typescript';
import { Users } from './users.model';

@Table({ tableName: 'otp_verification', paranoid: true, timestamps: true })
export class OtpVerification extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    id: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    userId: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    otp: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    otpExpiresAt: Date;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
    })
    isVerified: boolean;

    @BelongsTo(() => Users)
    user: Users;
}
