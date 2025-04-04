import { UUID, UUIDV4, STRING } from "sequelize";
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AllowNull,
  HasMany,
  BelongsTo,
  ForeignKey,
  DataType,
  HasOne
} from "sequelize-typescript";
import { Users } from "./users.model";
import { Portfolios } from "./portfolios.model";
import { Invitations } from "./invitations.model";
import { Profiles } from "./profiles.model";
import { StripeSubscriptions } from "./stripe-subscription.model";
import { StripeBillings } from "./stripe-billing.model";
import { Configurations } from "./configurations.model";
import { Settings } from "./settings.model";
import { Industries } from "./industries.model";

@Table({ tableName: "workspaces", paranoid: true, timestamps: true })
export class Workspaces extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  websiteUrl: string;

  @Column({ type: STRING })
  logoUrl: string;

  @Column({ type: STRING })
  companySize: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  ownerId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  colorThemeId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  categories: string[];

  @AllowNull(true)
  @Column({ type: STRING })
  location: string;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER })
  maxUsers: number;

  @ForeignKey(() => StripeSubscriptions)
  @Column({ type: UUID })
  stripeSubscriptionId: string;

  @AllowNull(true)
  @Column({ type: STRING })
  status: string;

  @AllowNull(true)
  @Column({ type: STRING })
  phoneNumber: string;

  @AllowNull(true)
  @Column({ type: STRING })
  hubspotCompanyId: string;

  @BelongsTo(() => Users)
  owner: Users

  @HasMany(() => Industries)
  industries: Industries[];

  @HasMany(() => Users)
  users: Users[];

  @HasMany(() => Invitations)
  invitations: Invitations[];

  @HasMany(() => Profiles)
  companiesProfiles: Profiles[];

  @HasMany(() => Portfolios)
  portfolios: Portfolios[];

  @HasMany(() => StripeSubscriptions)
  stripeSubscriptions: StripeSubscriptions[];

  @HasMany(() => StripeBillings)
  stripeBillings: StripeBillings[];

  @HasOne(() => Configurations, {
    onDelete: 'CASCADE',
  })
  configuration!: Configurations;

  @HasOne(() => Settings, {
    onDelete: 'CASCADE',
  })
  settings: Settings
}
