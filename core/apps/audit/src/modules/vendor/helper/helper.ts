import { GroupedVendorData, StatsForShift } from './interface';

export const groupByVendor = (
  dataForVendorOrPosition: StatsForShift[],
): GroupedVendorData[] => {
  const groupedData: { [key: number]: GroupedVendorData } = {};

  dataForVendorOrPosition.forEach((data) => {
    const { parent_id, parent_name, staff_count, checked_in, id, name } = data;

    if (!groupedData[parent_id]) {
      groupedData[parent_id] = {
        parent_id,
        parent_name,
        staff_count: 0,
        checked_in: 0,
        shifts: [],
      };
    }

    // Add the shift to the vendor's children array
    groupedData[parent_id].shifts.push({ id, name, staff_count, checked_in });

    // Update totals
    groupedData[parent_id].staff_count += staff_count;
    groupedData[parent_id].checked_in += checked_in;
  });

  // Convert groupedData object to an array and sort by parent_name
  return Object.values(groupedData).sort((VendorA, VendorB) =>
    VendorA.parent_name.localeCompare(VendorB.parent_name),
  );
};
