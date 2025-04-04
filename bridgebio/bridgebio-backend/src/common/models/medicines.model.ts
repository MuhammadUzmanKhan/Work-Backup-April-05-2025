import {
    Table,
    Column,
    Model,
    Index,
    PrimaryKey,
    AllowNull,
    HasMany
} from 'sequelize-typescript';
import { UUID, TEXT, BOOLEAN, JSONB } from 'sequelize';
import { UUIDV4 } from 'sequelize';
import { StrategyAndTreatment } from "./strategy-and-treatment";
@Table({
    tableName: 'medicines',
    timestamps: true,
    paranoid: true
})
export class Medicines extends Model<Medicines> {
    @Index
    @PrimaryKey
    @Column({
        type: UUID,
        defaultValue: UUIDV4
    })
    id: string;

    @AllowNull(false)
    @Column({ type: TEXT })
    disease: string;
   
    @AllowNull(false)
    @Column({ type: TEXT })
    therapy: string;

    @AllowNull(false)
    @Column({
        type: BOOLEAN,
        defaultValue: false
    })
    published: boolean;

    @AllowNull(true)
    @Column({
        type: JSONB,
        defaultValue: {}
    })
    additionalConfiguration: object;

    @HasMany(() => StrategyAndTreatment )
    StrategyAndTreatment: StrategyAndTreatment[];
}
