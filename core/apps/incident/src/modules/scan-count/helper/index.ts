import { Op, Sequelize } from 'sequelize';
import moment from 'moment-timezone';
import { Request, Response } from 'express';
import {
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  CsvOrPdf,
  ERRORS,
  PusherChannels,
  PusherEvents,
  Options,
} from '@ontrack-tech-group/common/constants';
import { ScanCount } from '@ontrack-tech-group/common/models';
import { isEventExist } from '@ontrack-tech-group/common/helpers';
import {
  getReportsFromLambda,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { _ERRORS } from '@Common/constants';
import { GetAllScanCounts } from '../dto';

export const getScanCountsWhere = (
  event_id: number,
  getAllScanCounts: GetAllScanCounts,
  time_zone: string,
) => {
  const { logged_time } = getAllScanCounts;
  const _where = {};

  if (logged_time) {
    const startDate = moment
      .tz(logged_time, time_zone)
      .startOf('day')
      .utc()
      .toDate();
    const endDate = moment
      .tz(logged_time, time_zone)
      .endOf('day')
      .utc()
      .toDate();
    _where['logged_time'] = { [Op.between]: [startDate, endDate] };
  }

  _where['event_id'] = event_id;

  return _where;
};

export const generateCsvOrPdfForScanCounts = async (
  params: GetAllScanCounts,
  scanCounts: ScanCount[],
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  if (params.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedStaffListingForCsv =
      getFormattedScanCountsDataForCsv(scanCounts);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedStaffListingForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="scan_counts.csv"');
    return res.send(response.data);
  } else if (params.csv_pdf === CsvOrPdf.PDF) {
    throw new NotImplementedException(
      ERRORS.REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT,
    );
  }
};

export const getFormattedScanCountsDataForCsv = (scanCounts: ScanCount[]) => {
  return scanCounts.map((scanCounts: ScanCount) => {
    const _scanCounts = scanCounts.get({ plain: true });
    return {
      'Logged Time': _scanCounts.logged_time || '--',
      'Logged Count': _scanCounts.logged_count || '--',
      Note: _scanCounts.note || '--',
    };
  });
};

export const checkEventDates = async (event_id, logged_time) => {
  const loggedTime = new Date(logged_time);

  const { start_date, end_date } = await isEventExist(event_id);

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  if (
    !(
      loggedTime.getTime() >= startDate.getTime() &&
      loggedTime.getTime() <= endDate.getTime()
    )
  ) {
    throw new UnprocessableEntityException(
      _ERRORS.LOGGED_TIME_IS_NOT_BETWEEN_EVENT_START_DATE_AND_END_DATE,
    );
  }
};

export const getScanCountById = async (id: number, options?: Options) => {
  return await ScanCount.findOne({
    where: { id },
    attributes: [
      'id',
      'logged_count',
      'logged_time',
      'note',
      'user_id',
      'logged_time',
      [
        Sequelize.literal(
          `(SELECT "name" FROM "users" WHERE "id" = "ScanCount"."user_id")`,
        ),
        'creator_name',
      ],
      'created_at',
    ],
    ...options,
  });
};

export function sendUpdatedScanCount(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.SCAN_COUNT}-${event_id}`,
    [PusherEvents.INCIDENT],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}
