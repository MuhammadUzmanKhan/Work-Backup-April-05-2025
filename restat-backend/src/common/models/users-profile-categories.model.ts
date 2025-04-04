import { UUID, UUIDV4 } from "sequelize";
import {
    Column,
    PrimaryKey,
    Table,
    Model,
    ForeignKey,
    BelongsTo
} from "sequelize-typescript";
import { Categories } from "./categories.model";
import { UsersProfile } from "./users-profile.model";

@Table({ tableName: "user_profile_categories", timestamps: true })
export class UsersProfileCategories extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @ForeignKey(() => UsersProfile)
    profileId: string;

    @ForeignKey(() => Categories)
    categoryId: string;

    @BelongsTo(() => UsersProfile)
    userProfile: UsersProfile;

    @BelongsTo(() => Categories)
    catagory: Categories;

}
