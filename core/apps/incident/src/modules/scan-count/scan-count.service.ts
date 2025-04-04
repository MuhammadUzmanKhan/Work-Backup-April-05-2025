import { Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import moment from 'moment-timezone';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { User, ScanCount } from '@ontrack-tech-group/common/models';
import { successInterceptorResponseFormat } from '@ontrack-tech-group/common/helpers';
import { isEventExist } from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import { SocketTypesStatus } from '@ontrack-tech-group/common/constants';
import { _ERRORS, SocketTypes } from '@Common/constants';
import { groupByDate, generateDateRangeForScans } from '@Common/helpers';
import {
  CreateScanCountDto,
  GetAllScanCounts,
  UpdateScanCountDto,
} from './dto';
import {
  generateCsvOrPdfForScanCounts,
  getScanCountById,
  getScanCountsWhere,
  sendUpdatedScanCount,
} from './helper';

@Injectable()
export class ScanCountService {
  constructor(
    private readonly httpService: HttpService,
    private pusherService: PusherService,
  ) {}

  async createScanCount(createScanCountDto: CreateScanCountDto, user: User) {
    const { id } = user;
    const { event_id } = createScanCountDto;

    const createdScanCount = await ScanCount.create({
      ...createScanCountDto,
      user_id: id,
    });

    const scanCount = await getScanCountById(+createdScanCount.id, {
      useMaster: true,
    });

    sendUpdatedScanCount(
      { scanCount },
      event_id,
      SocketTypesStatus.CREATE,
      SocketTypes.SCAN_COUNT,
      true,
      this.pusherService,
    );

    return scanCount;
  }

  async getAllScanCounts(
    getAllScanCounts: GetAllScanCounts,
    req: Request,
    res: Response,
  ) {
    const { event_id, csv_pdf } = getAllScanCounts;
    const { time_zone } = await isEventExist(event_id);

    const scanCount = await ScanCount.findAll({
      where: getScanCountsWhere(event_id, getAllScanCounts, time_zone),
      attributes: [
        [Sequelize.literal('CAST("ScanCount"."id" AS INTEGER)'), 'id'],
        'logged_count',
        'note',
        'user_id',
        'logged_time',
        'created_at',
        [
          Sequelize.literal(
            `(SELECT "name" FROM "users" WHERE "id" = "ScanCount"."user_id")`,
          ),
          'creator_name',
        ],
      ],
      order: [['logged_time', 'DESC']],
    });

    const dateGroupData = groupByDate(
      scanCount.map((scans) => scans.get({ plain: true })),
      time_zone,
    );

    if (csv_pdf) {
      return await generateCsvOrPdfForScanCounts(
        getAllScanCounts,
        scanCount,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: dateGroupData,
      }),
    );
  }

  async getAllScanCountsDays(event_id: number) {
    const { start_date, end_date, time_zone } = await isEventExist(event_id);

    const scanCounts = await ScanCount.findAll({
      where: { event_id },
      attributes: ['id', 'logged_time'],
      raw: true,
    });

    const eventDays = generateDateRangeForScans(
      start_date,
      end_date,
      time_zone,
    );

    // Convert scan counts to event's time zone and store in a Set for fast lookup
    const scanCountDates = new Set(
      scanCounts.map((scan) =>
        moment
          .tz(scan.logged_time, time_zone)
          .startOf('day')
          .format('YYYY-MM-DD'),
      ),
    );

    // Add missing scan dates to the `days` array
    scanCountDates.forEach((date) => {
      const convertedDate = moment.tz(date, time_zone).toDate();
      if (!eventDays.some((d) => moment(d).isSame(convertedDate, 'day'))) {
        eventDays.push(convertedDate);
      }
    });

    // 3️⃣ Sort dates once (no need to sort multiple times)
    eventDays.sort((a, b) => moment(a).valueOf() - moment(b).valueOf());

    // 4️⃣ Efficiently generate response using Set for faster lookups
    const scanCountDays = eventDays.map((day) => ({
      day: moment(day).format('MM/DD/YYYY'),
      has_scan_counts: scanCountDates.has(moment(day).format('YYYY-MM-DD')),
    }));

    return scanCountDays;
  }

  async updateScanCount(
    user: User,
    id: number,
    updateScanCount: UpdateScanCountDto,
  ) {
    const { event_id } = updateScanCount;
    const scanCount = await ScanCount.findByPk(id);

    if (!scanCount) throw new NotFoundException(_ERRORS.SCAN_COUNT_NOT_FOUND);

    const note = `Corrected by: ${user.name}`;

    await scanCount.update({
      ...updateScanCount,
      note,
    });

    const updatedScanCount = await getScanCountById(id, {
      useMaster: true,
    });

    sendUpdatedScanCount(
      { updatedScanCount },
      event_id,
      SocketTypesStatus.UPDATE,
      SocketTypes.SCAN_COUNT,
      false,
      this.pusherService,
    );

    return updateScanCount;
  }
}
