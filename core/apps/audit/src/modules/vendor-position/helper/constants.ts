// Total number of staff members, counted by their unique IDs and cast to an integer
export const TOTAL_STAFF_COUNT = 'COUNT("staff"."id")::INTEGER';

// Total number of staff members who have checked in (non-null "checked_in" field), cast to an integer
export const TOTAL_CHECKED_IN_STAFF = `COUNT(CASE WHEN "staff"."checked_in" IS NOT NULL THEN "staff"."id" END)::INTEGER`;

// Current number of staff members who are checked in but have not checked out
export const CURRENT_CHECKED_IN_STAFF = `COUNT(CASE WHEN "staff"."checked_in" IS NOT NULL AND "staff"."checked_out" IS NULL THEN "staff"."id" END)::INTEGER`;

// Total number of staff members who have both checked in and checked out
export const CHECKED_OUT = `COUNT(CASE WHEN "staff"."checked_in" IS NOT NULL AND "staff"."checked_out" IS NOT NULL THEN "staff"."id" END)::INTEGER`;

// Numeric calculation for the percentage of total staff who have checked in
// Ensures division uses numeric types to avoid truncation
export const TOTAL_CHECKED_IN_PERCENTAGE_NUMERIC = `(${TOTAL_CHECKED_IN_STAFF}::NUMERIC / NULLIF(${TOTAL_STAFF_COUNT}, 0)) * 100`;

// Formatted percentage string for the total checked-in staff percentage
export const TOTAL_CHECKED_IN_PERCENTAGE = `COALESCE(
  TO_CHAR(${TOTAL_CHECKED_IN_PERCENTAGE_NUMERIC}, 'FM999999990.00') || '%',
  '0.00%'
)`;

// Numeric calculation for the percentage of checked-in staff who have checked out
// Divides the count of checked-out staff by the count of checked-in staff (handling division by zero with NULLIF)
export const TOTAL_CHECKED_OUT_PERCENTAGE_NUMERIC = `(${CHECKED_OUT}::NUMERIC / NULLIF(${TOTAL_CHECKED_IN_STAFF}, 0)) * 100`;

// Formatted percentage string for the total checked-out staff percentage
export const TOTAL_CHECKED_OUT_PERCENTAGE = `COALESCE(
  TO_CHAR(${TOTAL_CHECKED_OUT_PERCENTAGE_NUMERIC}, 'FM999999990.00') || '%',
  '0.00%'
)`;
