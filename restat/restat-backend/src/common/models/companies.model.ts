import { STRING, UUID, UUIDV4, ENUM, TEXT } from "sequelize";
import {
  AllowNull,
  BeforeCreate,
  BelongsToMany,
  Column,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { DATE } from "sequelize";
import { EmployeeRange } from "src/types/enum";
import { Workspaces } from "./workspaces.model";
import { Contacts } from "./contacts.model";
import { ContactExperience } from "./contact-experience.model";
import ShortUniqueId from "short-unique-id";

@Table({ tableName: "company", paranoid: true, timestamps: true })
export class Companies extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  workspaceId: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @Column({
    type: STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => {
      const slug = new ShortUniqueId().randomUUID(8);
      return slug;
    },
  })
  slug: string;

  @AllowNull(true)
  @Column({ type: STRING })
  location: string;

  @AllowNull(true)
  @Column({ type: DATE })
  foundedYear: Date;

  @AllowNull(true)
  @Column({ type: STRING })
  fundedInfo: string;

  @AllowNull(true)
  @Column({ type: STRING })
  businessType: string;

  @AllowNull(true)
  @Column({ type: STRING })
  colorThemeId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  categories: string[];

  @AllowNull(true)
  @Column({
    type: ENUM(...Object.values(EmployeeRange)),
    defaultValue: EmployeeRange.NULL
  })
  numberOfEmployees: EmployeeRange;

  @AllowNull(true)
  @Column({ type: STRING })
  address: string;

  @AllowNull(true)
  @Column({ type: STRING })
  country: string;

  @AllowNull(true)
  @Column({ type: STRING })
  state: string;

  @AllowNull(true)
  @Column({ type: STRING })
  website: string;


  @AllowNull(true)
  @Column({ type: TEXT })
  socialMediaUrls: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hubspotCompanyId: string;

  @AllowNull(true)
  @Column({ type: STRING, defaultValue: 'LINKEDIN' })
  source: string;

  @BelongsToMany(() => Contacts, () => ContactExperience)
  contact: Contacts[];

  @HasMany(() => ContactExperience)
  experiences: ContactExperience[];

  @BeforeCreate
  static async generateSlug(instance: Companies) {
    let slug: string;
    let isUnique = false;
    let attempts = 0;
    let slugLength = 8;

    do {
      slug = new ShortUniqueId().randomUUID(slugLength);
      const existingSlug = await Companies.findOne({ where: { slug } });
      if (!existingSlug) {
        isUnique = true;
      } else {
        attempts++;
        if (attempts >= 3) {
          slugLength += 1;
        }
      }
    } while (!isUnique);

    instance.slug = slug;
  }

}
