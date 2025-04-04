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
import { WeatherProvider } from '.';

@Table({
  schema: 'weather',
  tableName: 'weather_rules',
  underscored: true,
  timestamps: true,
})
export class WeatherRule extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: STRING })
  temp: string;

  @Column({ type: STRING })
  wind_spd: string;

  @Column({ type: STRING })
  wind_cdir: string;

  @Column({ type: STRING })
  description: string;

  @ForeignKey(() => WeatherProvider)
  @Column({ type: INTEGER })
  weather_provider_id: number;

  @BelongsTo(() => WeatherProvider)
  weather_provider: WeatherProvider;
}
