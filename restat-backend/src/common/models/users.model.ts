import { UUID } from 'sequelize';
import { UUIDV4 } from 'sequelize';
import { STRING, INTEGER } from 'sequelize';
import { Column, Model, Table, PrimaryKey, IsEmail, HasOne, ForeignKey, HasMany, BelongsTo } from 'sequelize-typescript';
import { ROLES } from '../constants/roles';
import { UsersProfile } from './users-profile.model';
import { Bids } from './bids.model';
import { Workspaces } from './workspaces.model';
import { LinkedinAccountsData } from './linkedin-account-data.model';
import { Settings } from './settings.model';
import { StripeUserSubscriptions } from './stripe-user-subscription.model';
import { USERSTATUS } from '../constants/userStatus';
import { Sessions } from './sessions.model';
import { OtpVerification } from './otp-verification.model';
import { Comments } from './comments.model';

@Table({ tableName: 'users', paranoid: true, defaultScope: { attributes: { exclude: ['password'] } }, timestamps: true })
export class Users extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @IsEmail
  @Column({ type: STRING })
  email: string;

  @Column({ type: STRING })
  uid: string;

  @Column({ type: STRING })
  hubspotContactId: string;

  @Column({ type: STRING })
  provider: string;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING, defaultValue: USERSTATUS.ACTIVE })
  status: USERSTATUS;

  @Column({ type: STRING, defaultValue: ROLES.COMPANY_ADMIN })
  role: ROLES;

  @Column({ type: INTEGER, defaultValue: 0 })
  upworkTarget: string;

  @Column({ type: INTEGER, defaultValue: 0 })
  linkedinTarget: string;

  @Column({ type: STRING })
  clickupId: string;

  @Column({ type: STRING })
  clickupUsername: string;

  @Column({ type: STRING })
  clickupEmail: string;

  @Column({ type: STRING })
  clickupProfilePicture: string;

  @ForeignKey(() => Workspaces)
  @Column({ type: UUID })
  companyId: string;

  @HasOne(() => UsersProfile)
  userProfile: UsersProfile;

  @HasMany(() => Bids)
  bids: Bids[];

  @HasMany(() => LinkedinAccountsData)
  linkedinAccountsData: LinkedinAccountsData[]

  @HasMany(() => StripeUserSubscriptions)
  stripeUserSubscriptions: StripeUserSubscriptions[]

  @BelongsTo(() => Workspaces)
  company: Workspaces

  @HasOne(() => Settings)
  settings: Settings;

  @HasMany(() => Sessions)
  sessions: Sessions[];

  @HasMany(() => OtpVerification)
  otpVerification: OtpVerification[];

  @HasMany(() => Comments)
  comments: Comments[];
}
