import { Injectable } from '@nestjs/common';
import {
  AuditNote,
  AuditShift,
  AuditStaff,
  User,
  VendorPosition,
} from '@ontrack-tech-group/common/models';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import { EventIdQueryDto } from '@ontrack-tech-group/common/dto';
import { PusherService } from '@ontrack-tech-group/common/services';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { isVendorExist } from '@Modules/vendor/helper';
import { isShiftExist } from '@Modules/shift/helper';
import { isPositionExist } from '@Modules/vendor-position/helper';
import { ShiftService } from '@Modules/shift/shift.service';
import { VendorV2Service } from '@Modules/vendor/vendor.v2.service';
import { VendorPositionV2Service } from '@Modules/vendor-position/vendor-position.v2.service';
import { GetPositionDataQueryParamsDto } from '@Modules/vendor-position/dto/get-position-table-data';

import {
  fetchStaffStats,
  fetchUniqueShiftsSerializer,
  filterVendorsByShiftId,
  getSumRatesForStaff,
  staffDataSerializer,
} from './helper/helper';
import { StaffStatsDto, StaffStatsSummaryDto } from './dto/staff-stats.dto';
import {
  GetStats,
  GetStatsSummary,
  Shift,
  StaffStats,
  getStaffByIds,
  isManyStaffExist,
  sendBulkStaffUpdate,
  sendUploadStaffUpdate,
  shiftWhere,
} from './helper';
import { deleteStaff, getVendorStaffShift } from './queries';
import { BulkStaffUpdateDto, AddRemoveStaffDto } from './dto';

@Injectable()
export class StaffV2Service {
  constructor(
    private readonly pusherService: PusherService,
    private readonly shiftService: ShiftService,
    private readonly vendorV2Service: VendorV2Service,
    private readonly vendorPositionV2Service: VendorPositionV2Service,
  ) {}

  async getVendorStats(
    staffStatsDto: StaffStatsDto,
    user: User,
  ): Promise<GetStats> {
    const { event_id, vendor_id, dates, priority } = staffStatsDto;
    const [, , timezone] = await withCompanyScope(user, event_id);

    const vendorData = await getVendorStaffShift(
      timezone,
      event_id,
      vendor_id,
      dates,
      priority,
    );

    /*
      "fetchUniqueShiftsSerializer": this method will
      fetch all unqiue shifts into an array
    */
    const uniqueShifts = fetchUniqueShiftsSerializer(vendorData);

    const shifts = uniqueShifts.map(
      (shift: Shift & { statsData?: StaffStats }) => {
        const shiftProcessedData = filterVendorsByShiftId(vendorData, shift.id);

        // addint all stats data based on relevant shift as a child "statsData"
        return { ...shift, statsData: fetchStaffStats(shiftProcessedData) };
      },
    );

    return {
      shifts,
      all: { ...fetchStaffStats(vendorData), vendors: vendorData.length },
    };
  }

  async getStatsSummary(
    staffStatsSummaryDto: StaffStatsSummaryDto,
    user: User,
  ): Promise<GetStatsSummary> {
    const { event_id, dates, priority } = staffStatsSummaryDto;

    const [, , timezone] = await withCompanyScope(user, event_id);

    const vendorData = await getVendorStaffShift(
      timezone,
      event_id,
      undefined,
      dates,
      priority,
    );

    return { ...fetchStaffStats(vendorData), vendors: vendorData.length };
  }

  async getTotalStaffStats(totalStaffDto: StaffStatsSummaryDto, user: User) {
    const { dates, event_id } = totalStaffDto;

    let shiftDates: string[] | undefined = dates;

    if (!shiftDates?.length) {
      shiftDates = await this.shiftService.getAllShiftDates(event_id, user);
    }

    const statsData: GetStatsSummary[] = (await Promise.all(
      shiftDates.map((date) =>
        this.getStatsSummary({ dates: [date], event_id }, user),
      ),
    )) as GetStatsSummary[];

    let statDataToReturn = {};

    statsData.map((stat, index) => {
      statDataToReturn = {
        ...statDataToReturn,
        [shiftDates[index]]: {
          currentCheckedInStaff: stat.currentCheckedInStaff,
          checkedInStaff: stat.checkedInStaff,
          checkedOutStaff: stat.checkedOutStaff,
          staffNotCheckedIn: stat.staffNotCheckedIn,
          totalStaffCount: stat.totalStaffCount,
          vendors: stat.vendors,
        },
      };
    });

    return statDataToReturn;
  }

  async getCommonVendors(
    commonVendorsDto: GetPositionDataQueryParamsDto,
    user: User,
  ) {
    const { dates, event_id } = commonVendorsDto;

    let eventDates: string[] | undefined = dates;

    if (!eventDates?.length) {
      eventDates = await this.shiftService.getAllShiftDates(event_id, user);
    }

    const commonVendors: VendorPosition[][] = await Promise.all(
      eventDates.map((date) => {
        return this.vendorPositionV2Service.getVendorPositionListingStats(
          { ...commonVendorsDto, dates: [date], event_id },
          user,
        );
      }),
    );

    let vendors: Record<string, any> = {};

    for (let index = 0; index < commonVendors.length; index++) {
      commonVendors[index].map((typedVendor: any) => {
        const vendor = typedVendor as VendorPosition & { vendor_name: string };

        vendors = {
          ...vendors,
          [vendor.vendor_name]: {
            ...vendors[vendor.vendor_name],
            [vendor.name]: {
              ...vendors[vendor.vendor_name]?.[vendor.name],
              [eventDates[index]]: vendor,
            },
          },
        };
      });
    }

    return vendors;
  }

  async getNotesByStaffId(staff_id: number) {
    // Validate if the staff exists
    return await AuditNote.findAll({
      attributes: { exclude: ['updated_at', 'user_id'] },
      where: { staff_id },
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
      ],
    });
  }

  async updateBatchData(
    eventIdQueryDto: EventIdQueryDto,
    bulkStaffUpdateDto: BulkStaffUpdateDto,
  ) {
    const { staff_ids, priority, is_flagged } = bulkStaffUpdateDto;
    const { event_id } = eventIdQueryDto;

    await isManyStaffExist(staff_ids);

    await AuditStaff.update(
      { priority, is_flagged },
      {
        where: {
          id: staff_ids,
        },
      },
    );

    const _staff = await getStaffByIds(staff_ids, event_id, {
      useMaster: true,
    });

    sendBulkStaffUpdate(this.pusherService, _staff, event_id);

    return {
      message: RESPONSES.updatedSuccessfully('Staff'),
    };
  }

  async addDeleteStaff(addRemoveBulkStaffDto: AddRemoveStaffDto, user: User) {
    const { quantity, event_id, vendor_id, shift_id, position_id, rate } =
      addRemoveBulkStaffDto;

    const [, , timezone] = await withCompanyScope(user, event_id);

    await isVendorExist(vendor_id);
    await isShiftExist(shift_id);
    await isPositionExist(position_id);

    if (quantity > 0) {
      const bulkStaffData = [];

      for (let int = 0; int < quantity; int++) {
        bulkStaffData.push({
          vendor_id,
          shift_id,
          rate,
          addition: true,
          vendor_position_id: position_id,
        });
      }

      const createdStaff = await AuditStaff.bulkCreate(bulkStaffData);

      sendUploadStaffUpdate(
        this.pusherService,
        event_id,
        createdStaff,
        timezone,
      );

      return { message: RESPONSES.createdSuccessfully('Staff') };
    } else {
      return await deleteStaff(
        addRemoveBulkStaffDto,
        this.pusherService,
        timezone,
      );
    }
  }

  async orderAndDeliveredByDate(
    staffStatsSummaryDto: StaffStatsSummaryDto,
    user: User,
  ) {
    const { event_id, dates } = staffStatsSummaryDto;

    const [, , timezone] = await withCompanyScope(user, event_id);

    const staffData = await AuditStaff.findAll({
      attributes: ['id', 'rate', 'checked_in', 'checked_out', 'addition'],
      include: [
        {
          model: AuditShift,
          where: shiftWhere({ event_id, dates, timezone }),
          required: true,
          as: 'shift',
        },
      ],
      order: [[{ model: AuditShift, as: 'shift' }, 'start_date', 'ASC']],
    });

    const processedData = staffDataSerializer(staffData, timezone);

    return getSumRatesForStaff(processedData, timezone);
  }
}
