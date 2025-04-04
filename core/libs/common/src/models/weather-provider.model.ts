import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { CompanyWeatherProvider, Event, User, WeatherRule } from '.';

@Table({
  schema: 'weather',
  tableName: 'weather_providers',
  underscored: true,
  timestamps: true,
})
export class WeatherProvider extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  name: string;

  @Column({ type: STRING })
  url: string;

  @Column({ type: STRING })
  request_status: string;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  requested_by: number;

  @BelongsTo(() => User)
  users: User;

  @HasMany(() => CompanyWeatherProvider)
  company_weather_providers: CompanyWeatherProvider[];

  @HasMany(() => Event)
  events: Event[];

  @HasOne(() => WeatherRule)
  weather_rules: WeatherRule[];
}
