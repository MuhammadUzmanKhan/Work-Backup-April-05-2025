import { BOOLEAN, UUID, UUIDV4 } from "sequelize";
import {
    Column,
    PrimaryKey,
    Table,
    Model,
    AllowNull,
    Default,
    BelongsTo,
    ForeignKey,
} from "sequelize-typescript";
import { Workspaces } from "./workspaces.model";

@Table({ tableName: "configurations", timestamps: true })
export class Configurations extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    dashboard!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    settings!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    clickUp!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    hubSpot!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    upwork!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    stripe!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    businessData!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    companies!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    upworkProfiles!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    team!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    contacts!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    contactUs!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    deals!: boolean;

    @AllowNull(false)
    @Default(true)
    @Column({ type: BOOLEAN })
    portfolios!: boolean;

    @BelongsTo(() => Workspaces)
    company!: Workspaces;

    @ForeignKey(() => Workspaces)
    @Column({ type: UUID })
    companyId!: string;
}
