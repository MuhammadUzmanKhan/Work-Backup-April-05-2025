import { UUID } from "sequelize";
import { JSON } from "sequelize";
import { STRING } from "sequelize";
import { UUIDV4 } from "sequelize";
import { AllowNull, Column, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { ThemeColors } from "src/types/themes";
import { UsersProfile } from "./users-profile.model";

@Table({ tableName: "themes", paranoid: true, timestamps: true })
export class Themes extends Model {

    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    name: string;

    @AllowNull(false)
    @Column({ type: JSON })
    colors: ThemeColors

    @HasMany(() => UsersProfile)
    user: UsersProfile[];
}
