import { UUID } from "sequelize";
import { STRING } from "sequelize";
import { UUIDV4 } from "sequelize";
import { AllowNull, Column, Model, PrimaryKey, Table, BelongsToMany, HasMany } from "sequelize-typescript";
import { UsersProfile } from "./users-profile.model";
import { UsersProfileCategories } from "./users-profile-categories.model";

@Table({ tableName: "categories", paranoid: true, timestamps: true })
export class Categories extends Model {

    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    name: string;

    @BelongsToMany(() => UsersProfile, () => UsersProfileCategories)
    usersProfile: UsersProfile[];

    @HasMany(() => UsersProfileCategories)
    userProfileCatagories: UsersProfileCategories[];
}
