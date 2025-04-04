import { STRING, INTEGER } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  BelongsTo,
  ForeignKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Company, WeatherProvider } from '.';

@Table({
  schema: 'weather',
  tableName: 'company_weather_providers',
  underscored: true,
  timestamps: true,
})
export class CompanyWeatherProvider extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  api_key: string;

  @Column({ type: STRING })
  api_secret: string;

  @ForeignKey(() => WeatherProvider)
  @Column({ type: INTEGER })
  weather_provider_id: number;

  @ForeignKey(() => Company)
  @Column({ type: INTEGER })
  company_id: number;

  @BelongsTo(() => WeatherProvider)
  weather_provider: WeatherProvider;

  @BelongsTo(() => Company)
  company: Company;
}
