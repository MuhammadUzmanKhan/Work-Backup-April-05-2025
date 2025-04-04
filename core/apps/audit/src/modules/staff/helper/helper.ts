import moment from 'moment';
import momentTimezone from 'moment-timezone';
import { NotFoundException } from '@nestjs/common';
import { AuditStaff, Vendor } from '@ontrack-tech-group/common/models';
import { RESPONSES } from '@ontrack-tech-group/common/constants';

import { Shift, Staff, StaffStats, VendorInterface } from './interface';

export const fetchUniqueShiftsSerializer = (
  data: VendorInterface[],
): Shift[] => {
  const shifts = data.flatMap((vendor) =>
    vendor.staff.map((staffData) => staffData.shift),
  );

  // Ensure uniqueness based on the `id` field
  const uniqueShifts = Array.from(
    new Map(shifts.map((shift) => [shift.id, shift])).values(),
  );

  return uniqueShifts;
};

const calculateCurrentRate = (
  staff: Staff,
  shift: Shift,
  timezone: string,
): number => {
  if (staff.checked_in) {
    const checkedIn = momentTimezone.tz(staff.checked_in, timezone);
    const now = momentTimezone.tz(timezone);
    const rate = staff.rate;
    let durationInHours = 0;

    if (!staff.checked_out) {
      if (checkedIn.clone().add(24, 'hours').isAfter(now)) {
        // Case when checked_out is null and within 24 hours
        durationInHours = moment.duration(now.diff(checkedIn)).asHours();
      } else {
        // Case when checked_out is null and beyond 24 hours
        const shiftEndDate = momentTimezone.tz(shift.end_date, timezone);
        durationInHours = moment
          .duration(shiftEndDate.diff(checkedIn))
          .asHours();
      }
    } else {
      // Case when checked_out is not null
      const checkedOut = momentTimezone.tz(staff.checked_out, timezone);
      durationInHours = moment.duration(checkedOut.diff(checkedIn)).asHours();
    }

    return durationInHours * rate;
  } else {
    return 0;
  }
};

export const vendorDataSerializer = (
  allData: Vendor[],
  timezone: string,
): VendorInterface[] => {
  return allData.map((vendor) => {
    const staffWithRates = vendor.staff.map((staffInstance) => {
      const staff = staffInstance.dataValues;
      const shift = staff.shift.dataValues;

      const end_date = moment(shift.end_date);
      const start_date = moment(shift.start_date);

      const totalRate =
        moment.duration(end_date.diff(start_date)).asHours() * staff.rate;
      const currentRate = calculateCurrentRate(staff, shift, timezone);

      return {
        ...staffInstance.toJSON(),
        currentRate,
        totalRate,
      };
    });

    // Separate deleted and non-deleted staff
    const activeStaff = staffWithRates.filter(
      (staff) => staff.deleted_at === null,
    );

    const deletedStaff = staffWithRates.filter(
      (staff) => staff.deleted_at !== null,
    );

    return {
      ...vendor.toJSON(),
      staff: activeStaff, // Non-deleted staff
      deletedStaff, // Deleted staff
    };
  });
};

export const staffDataSerializer = (
  allData: AuditStaff[],
  timezone: string,
): Staff[] => {
  return allData.map((staffInstance) => {
    const staff = staffInstance.dataValues;
    const shift = staff.shift.dataValues;

    const end_date = momentTimezone.tz(shift.end_date, timezone); // Parse end_date with moment
    const start_date = momentTimezone.tz(shift.start_date, timezone); // Parse start_date with moment

    const totalRate =
      moment.duration(end_date.diff(start_date)).asHours() * staff.rate;
    const currentRate = calculateCurrentRate(staff, shift, timezone);

    return {
      ...staffInstance.toJSON(), // Convert Sequelize instance to plain object
      currentRate,
      totalRate, // Add the computed totalRate
    };
  });
};

export const auditStaff = (allData: VendorInterface[]): Staff[] => {
  const staff: Staff[] = [];

  allData.forEach((data) => {
    data.staff.forEach((_staff_) => {
      const existingStaff = staff.find(
        (singleStaff: Staff) => singleStaff.id === _staff_.id,
      );
      if (!existingStaff) {
        staff.push(_staff_);
      }
    });
  });

  return staff;
};

export const auditDeletedStaff = (allData: VendorInterface[]): Staff[] => {
  const staff: Staff[] = [];

  allData.forEach((data) => {
    data['deletedStaff'].forEach((_staff_) => {
      const existingStaff = staff.find(
        (singleStaff: Staff) => singleStaff.id === _staff_.id,
      );
      if (!existingStaff) {
        staff.push(_staff_);
      }
    });
  });

  return staff;
};

export const getSumRates = (
  vendors: VendorInterface[],
): { totalRate: number; currentRate: number } => {
  let totalRate = 0;
  let currentRate = 0;

  vendors.forEach((vendor) => {
    totalRate += vendor.staff.reduce(
      (sum, staffMember) => sum + staffMember.totalRate,
      0,
    );
    currentRate += vendor.staff.reduce(
      (sum, staffMember) => sum + staffMember.currentRate,
      0,
    );
  });

  // Ensure the final result is rounded to two decimal places if needed
  totalRate = parseFloat(totalRate.toFixed(2));
  currentRate = parseFloat(currentRate.toFixed(2));

  return { totalRate, currentRate };
};

export const getSumRatesForStaff = (
  staffs: Staff[],
  timezone: string,
): Record<string, { totalRate: number; currentRate: number }> => {
  const ratesByShiftStartDate: Record<
    string,
    { totalRate: number; currentRate: number; addOnValue: number }
  > = {};

  staffs.forEach((staffMember) => {
    // Format the start_date to YYYY-MM-DD using Moment.js
    const shiftStartDate = momentTimezone
      .tz(staffMember.shift.start_date, timezone)
      .format('YYYY-MM-DD');

    if (!ratesByShiftStartDate[shiftStartDate]) {
      ratesByShiftStartDate[shiftStartDate] = {
        totalRate: 0,
        currentRate: 0,
        addOnValue: 0,
      };
    }
    if (staffMember.addition) {
      ratesByShiftStartDate[shiftStartDate].addOnValue += parseFloat(
        staffMember.totalRate.toFixed(2),
      );
    } else {
      ratesByShiftStartDate[shiftStartDate].totalRate += parseFloat(
        staffMember.totalRate.toFixed(2),
      );
    }

    ratesByShiftStartDate[shiftStartDate].currentRate += parseFloat(
      staffMember.currentRate.toFixed(2),
    );
  });

  return ratesByShiftStartDate;
};

export const filterVendorsByShiftId = (
  vendors: VendorInterface[],
  shiftId: number,
): VendorInterface[] => {
  return vendors
    .map((vendor) => {
      // Filter the staff for the relevant shiftId
      const filteredStaff = vendor.staff.filter(
        (staffMember) => staffMember.shift_id === shiftId,
      );

      // If the vendor has no staff with the relevant shiftId, exclude it
      if (filteredStaff.length > 0) {
        return { ...vendor, staff: filteredStaff };
      }

      return null;
    })
    .filter((vendor) => vendor !== null) as VendorInterface[]; // Exclude null values
};

export const fetchStaffStats = (
  processedData: VendorInterface[],
): StaffStats => {
  const staffs = auditStaff(processedData); // Fetching unique Staff from whole data
  const deletedStaffs = auditDeletedStaff(processedData);

  /*
    "checkedInStaff": Staff that has checked in
    but not checked out yet
  */
  const currentCheckedInStaff = staffs.filter(
    (staff) => staff.checked_in && !staff.checked_out,
  ).length;
  /*
    "currentCheckedInStaff": Staff that has checked in
    but does'nt matter checked out or not
  */
  const checkedInStaff = staffs.filter((staff) => staff.checked_in).length;
  /*
    "checkedOutStaff": Staff that has checked out
  */
  const checkedOutStaff = staffs.filter(
    (staff) => staff.checked_in && staff.checked_out,
  ).length;
  /*
    "staffNotCheckedIn": Staff that has not checked in/out
  */
  const staffNotCheckedIn = staffs.filter(
    (staff) => !staff.checked_in && !staff.checked_out,
  ).length;
  const totalStaffCount = staffs.length; // total staff count
  const totalCheckedInPercentage = totalStaffCount
    ? ((checkedInStaff / totalStaffCount) * 100).toFixed(1) + '%'
    : '0%';
  const currentCheckedInPercentage = totalStaffCount
    ? ((currentCheckedInStaff / totalStaffCount) * 100).toFixed(1) + '%'
    : '0%';
  const notCheckedInPercentage = totalStaffCount
    ? ((staffNotCheckedIn / totalStaffCount) * 100).toFixed(1) + '%'
    : '0%';
  const checkedOutPercentage =
    currentCheckedInStaff > 0
      ? ((checkedOutStaff / checkedInStaff) * 100).toFixed(1) + '%'
      : '0%';
  const totalCheckedOutPercentage = totalStaffCount
    ? ((checkedOutStaff / totalStaffCount) * 100).toFixed(1) + '%'
    : '0%';

  const additions = [...staffs, ...deletedStaffs].filter(
    (staff) => staff.addition,
  ); // staff that has been added later
  const removals = deletedStaffs.filter((staff) => staff.deleted_at); // Fetching staff that has been removed

  // Fetching rates for all data
  const allRateData = getSumRates(processedData);

  // Fetching rates for only staff that has been added later
  const rateDataForAdditions = getSumRates(
    processedData.map((vendor) => {
      const allStaff = [...vendor.staff, ...vendor.deletedStaff];

      return {
        ...vendor,
        staff: allStaff.filter((staff) => staff.addition),
      };
    }),
  );

  // Fetching rates for only staff that has been removed later
  const rateDataForRemovals = getSumRates(
    processedData.map((vendor) => {
      return {
        ...vendor,
        staff: vendor.deletedStaff.filter((staff) => staff.deleted_at),
      };
    }),
  );

  return {
    rateDataForRemovals: {
      ...rateDataForRemovals,
      variance: rateDataForRemovals.totalRate - rateDataForRemovals.currentRate,
    },
    rateDataForAdditions: {
      ...rateDataForAdditions,
      variance:
        rateDataForAdditions.totalRate - rateDataForAdditions.currentRate,
    },
    allRateData: {
      ...allRateData,
      addOnValue: rateDataForAdditions.totalRate,
      variance: allRateData.totalRate - allRateData.currentRate,
    },
    additions: additions.length,
    removals: removals.length,
    totalCheckedInPercentage,
    currentCheckedInPercentage,
    totalCheckedOutPercentage,
    notCheckedInPercentage,
    checkedOutPercentage,
    currentCheckedInStaff,
    checkedInStaff,
    checkedOutStaff,
    staffNotCheckedIn,
    totalStaffCount,
  };
};

export const isManyStaffExist = async (staff_ids: number[]) => {
  const staffs = await AuditStaff.findAll({
    where: {
      id: staff_ids,
    },
    attributes: ['id'],
  });

  if (staffs.length !== staff_ids.length)
    throw new NotFoundException(RESPONSES.notFound('Some of staff'));

  return staffs;
};
