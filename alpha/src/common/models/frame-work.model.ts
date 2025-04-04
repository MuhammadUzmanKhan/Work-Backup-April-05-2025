import { UUIDV4, TEXT } from 'sequelize';
import { UUID, STRING } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AllowNull,
  Index,
  HasMany,
} from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import { ProjectFrameWork } from './index';

@Table({
  tableName: 'frame_works',
  underscored: true,
  timestamps: true,
  paranoid: true,
})
export class FrameWork extends Model {
  private readonly configService: ConfigService;

  @Index
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @AllowNull(false)
  @Column({ type: STRING })
  name: string;

  @AllowNull(false)
  @Column({ type: TEXT })
  description?: string;

  @Column({ type: STRING })
  url?: string;

  @HasMany(() => ProjectFrameWork, { onDelete: 'CASCADE' })
  project_frame_works: ProjectFrameWork[];
}
