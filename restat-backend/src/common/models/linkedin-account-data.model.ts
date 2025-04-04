import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  BeforeCreate,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BOOLEAN } from "sequelize";
import { Users } from "./users.model";
import { DATE } from "sequelize";
import { Profiles } from "./profiles.model";
import { Industries } from "./industries.model";
import { Institutions } from "./institutions.model";
import { Education } from "./education.model";
import { Skills } from "./skills.model";
import { LinkedinAccountSkills } from "./linkedin-account-skills.model";
import { Op } from "sequelize";
import { Experience } from "./experience.model";
import ShortUniqueId from 'short-unique-id';

@Table({
  tableName: "linkedin-accounts-data",
  paranoid: true,
  timestamps: true,
})
export class LinkedinAccountsData extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4, primaryKey: true })
  id: string;

  @ForeignKey(() => Profiles)
  @Column({ type: UUID })
  linkedinProfileId: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  userId: string;

  @ForeignKey(() => Industries)
  @Column({ type: UUID })
  industryId: string;

  @Column(
    {
      type: STRING,
      allowNull: true,
      unique: true,
      defaultValue: () => {
        const slug = new ShortUniqueId().randomUUID(8);
        return slug;
      },
    }
  )
  slug: string;

  @Column({ type: STRING })
  hubspotContactId: string;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  isConnected: boolean;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @AllowNull(true)
  @Column({ type: STRING })
  connections: string;

  @AllowNull(true)
  @Column({ type: STRING })
  followers: string;

  @AllowNull(true)
  @Column({ type: STRING })
  location: string;

  @AllowNull(true)
  @Column({ type: STRING })
  profileHeadline: string;

  @AllowNull(true)
  @Column({ type: DATE })
  connectTime: Date;

  @AllowNull(true)
  @Column({ type: STRING })
  address: string;

  @AllowNull(true)
  @Column({ type: STRING })
  birthday: string;

  @AllowNull(true)
  @Column({ type: STRING })
  connected: string;

  @AllowNull(true)
  @Column({ type: STRING })
  email: string;

  @AllowNull(true)
  @Column({ type: STRING })
  linkedinProfileLink: string;

  @AllowNull(true)
  @Column({ type: STRING })
  phone: string;

  @AllowNull(true)
  @Column({ type: STRING })
  twitter: string;

  @AllowNull(true)
  @Column({ type: STRING })
  anyOtherAccount: string;

  @AllowNull(true)
  @Column({ type: STRING })
  website: string;

  @AllowNull(true)
  @Column({ type: DataType.ARRAY(STRING) })
  websites: string[];

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  deletedAt: Date;

  @BelongsToMany(() => Institutions, () => Education)
  institutions: Institutions[];

  @HasMany(() => Education)
  education: Education[];

  @BelongsToMany(() => Skills, () => LinkedinAccountSkills)
  skills: Skills[];

  @HasMany(() => LinkedinAccountSkills)
  linkedinAccountSkills: LinkedinAccountSkills[];

  @HasMany(() => Experience)
  experiences: Experience[];

  @BelongsTo(() => Industries)
  industry: Industries

  @BelongsTo(() => Users)
  user: Users

  @BelongsTo(() => Profiles)
  profile: Profiles

  @BeforeCreate
  static async generateSlug(instance: LinkedinAccountsData) {
    let slug: string;
    let isUnique = false;
    let attempts = 0;
    let slugLength = 8;

    do {
      slug = new ShortUniqueId().randomUUID(slugLength);
      const existingSlug = await LinkedinAccountsData.findOne({ where: { slug } });
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

  async assignLinkedinAccountSkills(skills: any[], createdAt?: Date, updatedAt?: Date) {
    const bulkInsertSkills: { linkedinAccountId: string, skillId: string, createdAt: Date, updatedAt: Date }[] = []
    const theSkills = skills.map((skill) => skill.id);
    const existingLinkedinAccountSkills = await LinkedinAccountSkills.findAll({
      where: {
        linkedinAccountId: this.id,
        skillId: { [Op.in]: theSkills },
      },
    });
    const existingLinkedinAccountIds = existingLinkedinAccountSkills.map((accountSkill) => accountSkill.skillId);
    for (const skill of skills) {
      if (!existingLinkedinAccountIds.includes(skill.id)) {
        bulkInsertSkills.push({
          linkedinAccountId: this.id,
          skillId: skill.id,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        });
      }
    }
    if (bulkInsertSkills.length > 0) {
      return await LinkedinAccountSkills.bulkCreate(bulkInsertSkills);
    }
  }

  async getLinkedinAccountSkills(linkedinAccountId: string) {
    const linkedinAccountSkills = await LinkedinAccountSkills.findAll({ where: { linkedinAccountId } })
    return linkedinAccountSkills
  }

  async deleteLinkedinAccountSkills(skills: any[]) {
    try {
      const linkedinAccountSkillsToDelete = await LinkedinAccountSkills.findAll({
        where: { id: skills.map((skill) => skill.id) },
      })
      if (linkedinAccountSkillsToDelete.length === 0) {
        return {
          message: "error",
          error: "No matching skill found!",
        };
      }

      await LinkedinAccountSkills.destroy({
        where: {
          id: linkedinAccountSkillsToDelete.map((skill) => skill.id),
        },
      });

      return {
        message: "success",
        deletedTags: linkedinAccountSkillsToDelete,
      };
    } catch (err) {
      console.error(err)
      return {
        message: "error",
        deletionError: "An error occurred while deleting skills",
      }
    }
  }
}
