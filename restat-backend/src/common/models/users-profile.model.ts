import { UUID, UUIDV4, STRING } from "sequelize";
import {
    Column,
    PrimaryKey,
    Table,
    Model,
    AllowNull,
    ForeignKey,
    BelongsToMany,
    BelongsTo,
    HasMany
} from "sequelize-typescript";
import { Themes } from './themes.model';
import { UsersProfileCategories } from "./users-profile-categories.model";
import { Categories } from "./categories.model";
import { Users } from "./users.model";

@Table({ tableName: "users_profile", paranoid: true, timestamps: true })
export class UsersProfile extends Model {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    location: string;

    @ForeignKey(() => Themes)
    @AllowNull(false)
    @Column({ type: UUID })
    colorThemeId: string;

    @BelongsTo(() => Themes)
    theme: Themes;

    @BelongsToMany(() => Categories, () => UsersProfileCategories)
    categories: Categories[];

    @HasMany(() => UsersProfileCategories)
    userProfileCatagories: UsersProfileCategories[];

    @ForeignKey(() => Users)
    @AllowNull(false)
    @Column({ type: UUID })
    userId: string;

    async assignUsersProfileCategories({ categories }: { categories: string[] }) {
        const bulkInsertUserProfileCategories: { profileId: string; categoryId: string; }[] = categories.map(category => { return { profileId: this.id, categoryId: category } })
        await UsersProfileCategories.bulkCreate(bulkInsertUserProfileCategories);
    }
}
