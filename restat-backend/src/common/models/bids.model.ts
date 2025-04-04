import { STRING, UUID, UUIDV4 } from "sequelize";
import {
  AllowNull,
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { BOOLEAN } from "sequelize";
import { Jobs } from "./jobs.model";
import { Users } from "./users.model";
import { BidStatus } from "src/types/enum";
import { TEXT } from "sequelize";
import { Profiles } from "./profiles.model";
import ShortUniqueId from "short-unique-id";
import { Comments } from "./comments.model";
import { Contacts } from "./contacts.model";

@Table({
  tableName: "bids",
  paranoid: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["upworkProposalURL"]
    }
  ],
})
export class Bids extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

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

  @ForeignKey(() => Jobs)
  @Column({ type: UUID })
  jobId: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  userId: string;

  @ForeignKey(() => Profiles)
  @Column({ type: UUID })
  bidProfileId: string;

  @ForeignKey(() => Contacts)
  @Column({ type: UUID })
  contactId: string;

  @AllowNull(true)
  @Column({ type: TEXT })
  coverLetter: string;

  @AllowNull(true)
  @Column({ type: STRING })
  bidProfileFreelancer: string;

  @AllowNull(true)
  @Column({ type: STRING })
  bidProfileAgency: string;

  @AllowNull(true)
  @Column({ type: STRING })
  bidProfileBusinessManager: string;

  @AllowNull(false)
  @Column({ type: TEXT })
  upworkProposalURL: string;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  boosted: boolean;

  @AllowNull(true)
  @Column({ type: DataType.STRING })
  connects: string;

  @AllowNull(true)
  @Column({ type: STRING })
  proposedProfile: string;

  @AllowNull(true)
  @Column({ type: STRING })
  proposedRate: string;

  @AllowNull(true)
  @Column({ type: STRING })
  receivedAmount: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  responseDate: Date;

  @AllowNull(true)
  @Column({ type: STRING, defaultValue: BidStatus.PENDING })
  status: BidStatus;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  bidResponse: boolean;

  @AllowNull(true)
  @Column({ type: DataType.ARRAY(DataType.TEXT) })
  bidQuestionAnswers: string[];

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  dateTime: Date;

  @AllowNull(true)
  @Column({ type: BOOLEAN })
  invite: boolean;

  // This is the id of the job object that gets saved in local storage and the we save it in mongoDB database, it will be referenced to the object in that database
  @AllowNull(true)
  @Column({ type: STRING })
  jobObjId: String;

  @AllowNull(true)
  @Column({ type: STRING })
  clickupTaskId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hubspotDealId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hub_id: string;

  @AllowNull(false)
  @Column({ type: BOOLEAN, defaultValue: false })
  isManual: boolean;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  contractDate: Date;

  @BelongsTo(() => Jobs)
  job: Jobs;

  @BelongsTo(() => Profiles)
  bidProfile: Profiles;

  @BelongsTo(() => Users)
  user: Users;

  @HasMany(() => Comments)
  comments: Comments[];

  @BelongsTo(() => Contacts)
  contact: Contacts;

  @BeforeCreate
  static async generateSlug(instance: Bids) {
    let slug: string;
    let isUnique = false;
    let attempts = 0;
    let slugLength = 8;

    do {
      slug = new ShortUniqueId().randomUUID(slugLength);
      const existingSlug = await Bids.findOne({ where: { slug } });
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
