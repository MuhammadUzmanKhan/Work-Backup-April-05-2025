import {
  Column,
  Model,
  Table,
  PrimaryKey,
  AllowNull,
  DataType,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  HasMany,
  BeforeCreate,
} from "sequelize-typescript";
import { Jobs } from "./jobs.model";
import { BOOLEAN, STRING, UUID, UUIDV4 } from "sequelize";
import { SOURCE } from "../constants/source";
import { Workspaces } from "./workspaces.model";
import { Skills } from "./skills.model";
import { ContactSkills } from "./contact-skills.model";
import { Institutions } from "./institutions.model";
import { ContactEducation } from "./contact-education.model";
import { InternalServerErrorException } from "@nestjs/common";
import { Op } from "sequelize";
import { LinkedinReferences } from "./linkedin-reference";
import { Bids } from "./bids.model";
import { ContactExperience } from "./contact-experience.model";
import { Companies } from "./companies.model";
import ShortUniqueId from "short-unique-id";

@Table({ tableName: "contacts", paranoid: true, timestamps: true })
export class Contacts extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @Column({ type: STRING })
  source: SOURCE;

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

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  workspaceId: string;

  @ForeignKey(() => Jobs)
  @Column({ type: UUID })
  jobId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  name: string;

  @AllowNull(true)
  @Column({ type: STRING })
  email: string;

  @AllowNull(true)
  @Column({ type: STRING })
  phoneNumber: string;

  @AllowNull(true)
  @Column({ type: STRING })
  address: string;

  @AllowNull(true)
  @Column({ type: STRING })
  locationState: string;

  @AllowNull(true)
  @Column({ type: STRING })
  locationCountry: string;

  @AllowNull(true)
  @Column({ type: BOOLEAN, defaultValue: false })
  decisionMaker: boolean;

  @AllowNull(true)
  @Column({ type: DataType.JSON })
  socialMediaLinks: { name: string, url: string }[];

  @AllowNull(true)
  @Column({ type: STRING })
  designation: string;

  @AllowNull(true)
  @Column({ type: STRING })
  paymentMethod: string;

  @AllowNull(true)
  @Column({ type: STRING })
  rating: string;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  upworkPlus: boolean;

  @AllowNull(true)
  @Column({ type: STRING })
  historyTotalSpent: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyOpenJobs: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyJobsPosted: string

  @AllowNull(true)
  @Column({ type: STRING })
  historyInterviews: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyHoursBilled: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  historyMemberJoined: Date;

  @AllowNull(true)
  @Column({ type: STRING })
  historyProposals: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyHires: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyHired: string;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  upWorkRating: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  numReviewsUpwork: number;

  @AllowNull(true)
  @Column({ type: STRING })
  timeZone: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hubspotContactId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  currentInterview: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyHireRate: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyAvgHourlyRate: string;

  // LinkedIn
  @AllowNull(true)
  @Column({ type: STRING })
  linkedinProfileLink: string;

  @AllowNull(true)
  @Column({ type: STRING })
  linkedinConnections: string;

  @AllowNull(true)
  @Column({ type: STRING })
  linkedinFollowers: string;

  @AllowNull(true)
  @Column({ type: STRING })
  profileHeadline: string;

  @AllowNull(true)
  @Column({ type: STRING })
  location: string;

  @AllowNull(true)
  @Column({ type: STRING })
  birthday: string;

  @AllowNull(true)
  @Column({ type: DataType.ARRAY(STRING) })
  websites: string[];

  @BelongsTo(() => Workspaces)
  workspace: Workspaces;

  @BelongsTo(() => Jobs)
  job: Jobs;

  @BelongsToMany(() => Institutions, () => ContactEducation)
  institutions: Institutions[];

  @HasMany(() => ContactEducation)
  education: ContactEducation[];

  @BelongsToMany(() => Skills, () => ContactSkills)
  skills: Skills[];

  @HasMany(() => ContactSkills)
  contactSkills: ContactSkills[];

  @BelongsToMany(() => Companies, () => ContactExperience)
  companies: Companies[];
  
  @HasMany(() => ContactExperience)
  contactExperiences: ContactExperience[];

  @HasMany(() => LinkedinReferences)
  linkedInReference: LinkedinReferences

  @HasMany(() => Bids)
  bid: Bids

  async getContactSkills(contactId: string): Promise<ContactSkills[]> {
    const contactSkills = await ContactSkills.findAll({ where: { contactId } })
    return contactSkills
  }

  async deleteContactSkills(skills: ContactSkills[]) {
    try {
      const contactSkillsToDelete = await ContactSkills.findAll({
        where: { id: skills.map((skill) => skill.id) },
      })

      if (!contactSkillsToDelete.length) {
        return {
          message: "Nothing to delete!",
        };
      }

      await ContactSkills.destroy({
        where: {
          id: contactSkillsToDelete.map((skill) => skill.id),
        },
      });

      return {
        message: "Successully deleted the skills.",
        deletedTags: contactSkillsToDelete,
      };
    } catch (err) {
      console.error('Error occurred in deleteContactSkills', err)
      throw new InternalServerErrorException(err)
    }
  }

  async assignContactSkills(skills: Skills[]) {
    const skillIds = skills.map(skill => skill.id);
  
    const existingContactSkills = await ContactSkills.findAll({
      where: {
        contactId: this.id,
        skillId: { [Op.in]: skillIds },
      },
    });
  
    const existingIds = new Set(existingContactSkills.map(contactSkill => contactSkill.skillId));
  
    const bulkInsertSkills = skills
      .filter(skill => !existingIds.has(skill.id))
      .map(skill => ({
        contactId: this.id,
        skillId: skill.id,
      }));
  
    if (!bulkInsertSkills.length) return;
  
    return await ContactSkills.bulkCreate(bulkInsertSkills);
  }
  
  @BeforeCreate
  static async generateSlug(instance: Bids) {
    let slug: string;
    let isUnique = false;
    let attempts = 0;
    let slugLength = 8;

    do {
      slug = new ShortUniqueId().randomUUID(slugLength);
      const existingSlug = await Contacts.findOne({ where: { slug } });
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
