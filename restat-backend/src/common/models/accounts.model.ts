import {
  Column,
  Model,
  Table,
  PrimaryKey,
  AllowNull,
  HasMany,
  DataType,
} from "sequelize-typescript";
import { Jobs } from "./jobs.model";
import { BOOLEAN, STRING, UUID, UUIDV4 } from "sequelize";
import { SOURCE } from "../constants/source";

@Table({ tableName: "accounts", paranoid: true, timestamps: true })
export class Accounts extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(true)
  @Column({ type: STRING })
  name: string;

  @AllowNull(true)
  @Column({ type: STRING })
  company: string;

  @AllowNull(true)
  @Column({ type: STRING })
  timeZone: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hubspotContactId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hubspotCompanyId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  locationCountry: string;

  @AllowNull(true)
  @Column({ type: STRING })
  locationState: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyProposals: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyInterviews: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyJobsPosted: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyTotalSpent: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyHoursBilled: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyOpenJobs: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyHires: string;

  @AllowNull(true)
  @Column({ type: STRING })
  historyHired: string;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  historyMemberJoined: Date;

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
  email: string;

  @AllowNull(true)
  @Column({ type: STRING })
  phoneNumber: string;

  @AllowNull(true)
  @Column({ type: STRING })
  address: string;

  @AllowNull(true)
  @Column({ type: STRING, defaultValue: SOURCE.UPWORK })
  source: SOURCE;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  upWorkRating: number;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  numReviewsUpwork: number;

  @AllowNull(true)
  @Column({ type: DataType.DATE })
  deletedAt: Date;
  
  @AllowNull(true)
  @Column({ type: STRING })
  numberOfEmployees: string;

  @AllowNull(true)
  @Column({ type: STRING })
  designation: string;

  @AllowNull(true)
  @Column({ type: STRING })
  industry: string;

  @AllowNull(true)
  @Column({ type: STRING })
  companyAge: string;

  @AllowNull(true)
  @Column({ type: STRING })
  funding: string;

  @AllowNull(true)
  @Column({ type: STRING })
  currentInterview: string;

  @AllowNull(true)
  @Column({ type: BOOLEAN, defaultValue: false })
  decisionMaker: boolean;

  @AllowNull(true)
  @Column({ type: DataType.JSON })
  socialMediaHandles: { [key: string]: string };

  @AllowNull(true)
  @Column({ type: STRING })
  specialInterest: string;

  @AllowNull(true)
  @Column({ type: DataType.JSON })
  clientsExperience: {
    totalYears: string;
    jobTitles: string[];
    organizationName: string[];
  };

  @HasMany(() => Jobs)
  jobs: Jobs[];
}
