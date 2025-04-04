import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  HasMany,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Company, Event, UserCompanyRoleRegion } from '.';

@Table({ tableName: 'regions', underscored: true, timestamps: true })
export class Region extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  aws_region: string;

  @Column({ type: STRING })
  bucket_name: string;

  @ForeignKey(() => Region)
  @Column({ type: INTEGER })
  parent_id: number;

  @HasMany(() => Region, { foreignKey: 'parent_id' })
  subRegions: Region[];

  @BelongsTo(() => Region, { foreignKey: 'parent_id' })
  region: Region;

  @HasMany(() => Company)
  companies: Company[];

  @HasMany(() => UserCompanyRoleRegion)
  usersCompaniesRolesRegions: UserCompanyRoleRegion[];

  @HasMany(() => Event)
  events: Event[];
}
