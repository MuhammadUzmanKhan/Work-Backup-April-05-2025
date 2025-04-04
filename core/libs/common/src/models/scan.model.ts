import { STRING, INTEGER, BOOLEAN, Sequelize, Transaction } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  ForeignKey,
  AutoIncrement,
  BelongsTo,
  HasOne,
  AfterUpdate,
  AfterCreate,
} from 'sequelize-typescript';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Camper,
  Day,
  Department,
  Event,
  FuelType,
  Incident,
  Inventory,
  Location,
  Reservation,
  Route,
  Shift,
  User,
  Zone,
} from '.';
import { ScanType } from '../constants';

@Table({
  tableName: 'scans',
  underscored: true,
  timestamps: true,
})
export class Scan extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @Column({ type: INTEGER })
  scan_type: number;

  @Column({ type: STRING })
  inventory_type: string;

  @ForeignKey(() => Inventory)
  @Column({ type: INTEGER })
  inventory_id: number;

  @Column({ type: INTEGER })
  scanner_id: number;

  @Column({ type: INTEGER })
  quantity: number;

  @Column({ type: BOOLEAN })
  last_scan: boolean;

  @ForeignKey(() => FuelType)
  @Column({ type: INTEGER })
  fuel_type_id: number;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @ForeignKey(() => Reservation)
  @Column({ type: INTEGER })
  reservation_id: number;

  @ForeignKey(() => Event)
  @Column({ type: INTEGER })
  event_id: number;

  @Column({ type: INTEGER })
  accessory_id: number;

  @Column({ type: INTEGER })
  parent_id: number;

  @ForeignKey(() => Department)
  @Column({ type: INTEGER })
  department_id: number;

  @ForeignKey(() => Day)
  @Column({ type: INTEGER })
  day_id: number;

  @ForeignKey(() => Shift)
  @Column({ type: INTEGER })
  shift_id: number;

  @Column({ type: BOOLEAN })
  hours_calculated: boolean;

  @ForeignKey(() => Route)
  @Column({ type: INTEGER })
  route_id: number;

  @Column({ type: BOOLEAN })
  ingress: boolean;

  @Column({ type: INTEGER })
  passenger_count: number;

  @ForeignKey(() => Zone)
  @Column({ type: INTEGER })
  zone_id: number;

  @ForeignKey(() => Camper)
  @Column({ type: INTEGER })
  camper_id: number;

  @Column({ type: INTEGER })
  camper_count: number;

  @Column({ type: STRING })
  last_time: string;

  @ForeignKey(() => Incident)
  @Column({ type: INTEGER })
  incident_id: number;

  @Column({ type: BOOLEAN })
  enabled: boolean;

  @BelongsTo(() => Event)
  event: Event;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Day)
  day: Day;

  @BelongsTo(() => Inventory)
  inventory: Inventory;

  @BelongsTo(() => Incident, {
    as: 'dispatched_incident',
    foreignKey: 'incident_id',
  })
  dispatched_incident: Incident;

  @HasOne(() => Incident)
  incident: Incident;

  @BelongsTo(() => Shift)
  shift: Shift;

  @BelongsTo(() => Route)
  route: Route;

  @BelongsTo(() => FuelType)
  fuel_type: FuelType;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsTo(() => Reservation)
  reservation: Reservation;

  @BelongsTo(() => Camper)
  camper: Camper;

  @HasOne(() => Location, {
    foreignKey: 'locationable_id',
    scope: { locationable_type: 'Scan' },
    onDelete: 'CASCADE',
    as: 'location',
  })
  location: Location;

  @BelongsTo(() => Zone)
  zone: Zone;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  created_by: number;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    constraints: false,
  })
  creator: User;

  public static getScanTypeByKey = `(CASE
    WHEN "scans"."scan_type" IS NOT NULL THEN
      CASE
           ${Object.entries(ScanType)
             .map(
               ([, value], index) =>
                 `WHEN "scans"."scan_type" = ${index} THEN '${value}'`,
             )
             .join('\n')}
           END
    ELSE NULL
  END)`;

  public static _getScanTypeByKey = `(CASE
    WHEN "Scan"."scan_type" IS NOT NULL THEN
      CASE
           ${Object.entries(ScanType)
             .map(
               ([, value], index) =>
                 `WHEN "Scan"."scan_type" = ${index} THEN '${value}'`,
             )
             .join('\n')}
           END
    ELSE NULL
  END)`;

  public static getFormattedScanTypeByKey = Sequelize.literal(`(CASE
    WHEN "Scan"."scan_type" IS NOT NULL THEN
      CASE
           ${Object.entries(ScanType)
             .map(([, value], index) => {
               return `WHEN "Scan"."scan_type" = ${index} THEN '${
                 value == 'at_scene'
                   ? 'On Scene'
                   : value == 'in_route'
                     ? 'Transport'
                     : value
                         .replace(/_/g, ' ')
                         .replace(/\b\w/g, (letter: string) =>
                           letter.toUpperCase(),
                         )
               }'`;
             })
             .join('\n')}
      END
    ELSE NULL
  END)`);

  public static getFormattedScanTypeByKeyForUsers = Sequelize.literal(`(CASE
    WHEN "scans"."scan_type" IS NOT NULL THEN
      CASE
           ${Object.entries(ScanType)
             .map(
               ([, value], index) =>
                 `WHEN "scans"."scan_type" = ${index} THEN '${
                   value == 'at_scene'
                     ? 'On Scene'
                     : value
                         .replace(/_/g, ' ')
                         .replace(/\b\w/g, (letter: string) =>
                           letter.toUpperCase(),
                         )
                 }'`,
             )
             .join('\n')}
      END
    ELSE NULL
  END)`);

  public static searchFormattedScanTypeByKey = (keyword: string) =>
    Sequelize.literal(`(CASE
    WHEN "Scan"."scan_type" IS NOT NULL THEN
      CASE
           ${Object.entries(ScanType)
             .map(
               ([, value], index) =>
                 `WHEN "Scan"."scan_type" = ${index} THEN '${value
                   .replace(/_/g, ' ')
                   .replace(/\b\w/g, (letter: string) =>
                     letter.toUpperCase(),
                   )}'`,
             )
             .join('\n')}
      END
    ELSE NULL
  END ILIKE '%${keyword.toLowerCase()}%')`);

  public static getDispatchScanType = `(CASE
    WHEN "Scan"."scan_type" IS NOT NULL THEN
      CASE
        WHEN "Scan"."scan_type" = 33 THEN 'arrived'
        WHEN "Scan"."scan_type" = 38 THEN 'on_scene'
        WHEN "Scan"."scan_type" = 40 THEN 'transport'
        WHEN "Scan"."scan_type" = 41 THEN 'responding'
        WHEN "Scan"."scan_type" = 42 THEN 'done'
        WHEN "Scan"."scan_type" = 37 THEN 'dispatched'
      END
    ELSE NULL
  END)`;

  @AfterUpdate
  @AfterCreate
  static async sendRequestForDashAppHooks(
    scan: Scan,
    options: { transaction?: Transaction },
  ) {
    let is_new = false;
    const httpService = new HttpService();
    const transaction = options.transaction;

    if (scan['_options'].isNewRecord) is_new = true;

    if (transaction) {
      transaction.afterCommit(async () => {
        const body = {
          is_new,
        };

        const url = `${process.env['RAILS_BASE_URL']}/hooks/${scan.id}`;
        const headerOptions = {
          headers: {
            'site-token': process.env['SITE_TOKEN'],
          },
        };

        try {
          const response = await firstValueFrom(
            httpService.post(url, body, headerOptions),
          );

          if (response.status === 200 || response.status === 201) {
            return response.data;
          }
        } catch (error) {
          console.log(error);
        }
      });
    }
  }
}
