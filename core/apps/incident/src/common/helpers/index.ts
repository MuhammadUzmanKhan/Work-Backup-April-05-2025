import { UnprocessableEntityException } from '@nestjs/common';
import moment from 'moment-timezone';
import {
  Event,
  Scan,
  ScanCount,
  User,
} from '@ontrack-tech-group/common/models';
import {
  humanizeTitleCase,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  ChangeLogService,
  CommunicationService,
} from '@ontrack-tech-group/common/services';
import {
  CellNumbersForAlerts,
  MessageableType,
  PolymorphicType,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { _ERRORS } from '@Common/constants';

export const checkEventOfSameCompany = async (
  user: User,
  current_event_id: number,
  clone_event_id: number,
) => {
  const [cloneCompanyId] = await withCompanyScope(user, clone_event_id);

  const [currentCompanyId] = await withCompanyScope(user, current_event_id);

  if (currentCompanyId !== cloneCompanyId)
    throw new UnprocessableEntityException(_ERRORS.NOT_BELONGS_TO_SAME_COMPANY);

  return true;
};

// TODO: Remove this function
export const dateGroupedData = (data, scan_counts?: boolean) => {
  const groupedByDate = data.reduce((acc, currentItem) => {
    if (currentItem) {
      const dateSource = scan_counts
        ? currentItem.logged_time
        : currentItem.created_at;

      const dateValue =
        dateSource instanceof Date ? dateSource.toISOString() : dateSource;

      const dateKey = dateValue.split('T')[0]; // Extract YYYY-MM-DD

      if (!acc[dateKey]) acc[dateKey] = [];

      acc[dateKey].push(currentItem);
    }
    return acc;
  }, {});

  // Sort each group's items by logged_time or created_at in descending order
  Object.keys(groupedByDate).forEach((dateKey) => {
    groupedByDate[dateKey].sort((a, b) => {
      const loggedTimeA = scan_counts
        ? moment(a.logged_time).valueOf()
        : moment(a.created_at).valueOf();
      const loggedTimeB = scan_counts
        ? moment(b.logged_time).valueOf()
        : moment(b.created_at).valueOf();
      return loggedTimeB - loggedTimeA; // Descending order
    });
  });

  const sortedKeys = Object.keys(groupedByDate).sort(
    (a, b) => moment(b).valueOf() - moment(a).valueOf(), // Descending order of created_at
  );

  // Construct a new object with sorted and formatted keys
  const sortedAndFormattedGroupedByDate = {};
  sortedKeys.forEach((key) => {
    const formattedKey = moment(key).format('MM/DD/YYYY'); // Adjusted to use Moment.js
    sortedAndFormattedGroupedByDate[formattedKey] = groupedByDate[key];
  });

  return sortedAndFormattedGroupedByDate;
};

// Helper function to group data by logged_time and format the date
export const groupByDate = (data: ScanCount[], timeZone: string) => {
  const groupedByDate = data.reduce((acc, currentItem) => {
    if (currentItem) {
      const dateValue = moment(currentItem.logged_time)
        .tz(timeZone)
        .format('MM/DD/YYYY'); // Convert to event's timezone

      if (!acc[dateValue]) acc[dateValue] = [];
      acc[dateValue].push(currentItem);
    }
    return acc;
  }, {});

  // Sort each group by logged_time in descending order
  Object.keys(groupedByDate).forEach((dateKey) => {
    groupedByDate[dateKey].sort(
      (a, b) =>
        moment(b.logged_time).valueOf() - moment(a.logged_time).valueOf(),
    );
  });

  return groupedByDate;
};

export const getEventsAndScansDays = (
  startDate,
  endDate,
  data,
  scan_count?: boolean,
) => {
  const dateRange = generateDateRange(startDate, endDate);
  const results = dateRange.map((date) => ({
    day: formatDateForDays(date),
    ...(scan_count
      ? { has_scan_counts: hasEventNotesForDate(date, data, true) }
      : { has_notes: hasEventNotesForDate(date, data) }),
  }));

  return results;
};

// Generate the list of dates in the range
const generateDateRange = (start, end) => {
  const result = [];
  const currentDate = parseAsUTC(start);

  while (currentDate <= parseAsUTC(end)) {
    result.push(new Date(currentDate)); // Clone the date to avoid mutation
    currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Increment by one day
  }
  return result;
};

// Format a Date object into "MM/DD/YYYY"
const formatDateForDays = (date) => {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = date.getUTCFullYear();
  return `${month}/${day}/${year}`;
};

const parseAsUTC = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// Helper to check if a note exists for a given date
const hasEventNotesForDate = (date, eventNotes, scanCount = false) => {
  return eventNotes.some((note) => {
    const noteDate = scanCount
      ? new Date(note.logged_time)
      : new Date(note.created_at);
    return (
      noteDate.getUTCFullYear() === date.getUTCFullYear() &&
      noteDate.getUTCMonth() === date.getUTCMonth() &&
      noteDate.getUTCDate() === date.getUTCDate()
    );
  });
};

export const getTimeDifference = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }
  const diffInMilliseconds = endDate.getTime() - startDate.getTime();
  const minutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const seconds = Math.floor((diffInMilliseconds % (1000 * 60)) / 1000);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const createChangelogForDispatchStaff = async (
  currentUser: User,
  incident_id: number,
  department_id: number,
  event_id: number,
  user: User,
  changeLogService: ChangeLogService,
) => {
  const scans = await Scan.findAll({
    where: { event_id, incident_id, department_id, user_id: user.id },
    attributes: [[Scan.getDispatchScanType, 'scan_type']],
    order: [['created_at', SortBy.DESC]],
    limit: 2,
  });

  let newValueText = (scans[0]?.['scan_type'] as unknown as string) || null;

  let oldValueText = (scans[1]?.['scan_type'] as unknown as string) || null;

  if (!newValueText) return;

  let formatted_log_text = '';

  const userName = humanizeTitleCase(user.name);

  newValueText = humanizeTitleCase(newValueText);

  if (!oldValueText) formatted_log_text = `${userName} Added — ${newValueText}`;
  else {
    oldValueText = humanizeTitleCase(oldValueText);
    formatted_log_text = `${userName} Status Change — from ${oldValueText} to ${newValueText}`;
  }

  changeLogService.createChangeLog({
    id: incident_id,
    type: PolymorphicType.INCIDENT,
    column: 'dispatched',
    formatted_log_text,
    editor_id: currentUser.id,
    editor_type: PolymorphicType.USER,
    old_value: oldValueText,
    new_value: newValueText,
    commented_by: currentUser.name, // TODO: remove this
    additional_values: { user_name: userName },
  });
};

export const formatEventCamelCaseForPdfs = (event: Event) => {
  const {
    event_location: location,
    start_date: startDate,
    end_date: endDate,
  } = event;
  return {
    ...event,
    location,
    startDate,
    endDate,
  };
};

export const sendPushNotificationAndSMS = async (
  messageBody: string,
  notificationBody: string,
  userNumbers: CellNumbersForAlerts[],
  communicationService: CommunicationService,
  messageableType?: MessageableType,
) => {
  // Send Push Notification to Mobile.
  try {
    await communicationService.communication(
      { notificationBody },
      'send-push-notification',
    );

    // Send SMS
    await communicationService.communication(
      {
        messageBody,
        userNumbers,
        messageableType,
      },
      'send-message',
    );
  } catch (e) {
    console.error('Push notification error:', e);
  }
};

export const customSearch = (name: string, keyword: string) => {
  const _name = name.toLowerCase();
  const keywordLower = keyword.toLowerCase();

  // Check if any word in the 'name' contains the keyword
  return _name.split(' ').some((word) => word.includes(keywordLower));
};

const getInitialAndEndDate = (data, scanCount: boolean) => {
  const dates = data.map((item) => {
    const date = scanCount
      ? new Date(item['logged_time'])
      : new Date(item['created_at']);
    return date.toISOString().split('T')[0]; // This gives you 'YYYY-MM-DD'
  });

  const dateTimestamps = dates.map((date) => new Date(date).getTime());

  const minTimestamp = Math.min(...dateTimestamps);
  const maxTimestamp = Math.max(...dateTimestamps);

  const minDate = new Date(minTimestamp).toISOString().split('T')[0];
  const maxDate = new Date(maxTimestamp).toISOString().split('T')[0];

  return { minDate, maxDate };
};

// TODO: Remove this function
export const getEventNotesAndScansDaysData = (
  data,
  filteredData,
  scan?: boolean,
) => {
  const eventNotesData = filteredData;

  const { minDate, maxDate } = getInitialAndEndDate(data, scan);

  const eventNotesOrScansDateData = getEventsAndScansDays(
    minDate,
    maxDate,
    data,
    scan,
  );

  const days = new Set(eventNotesData.map((event) => event.day));

  // Check if scanDateData entries exist in eventData
  eventNotesOrScansDateData.forEach((eventNotesOrScanDateData) => {
    if (!days.has(eventNotesOrScanDateData.day)) {
      // If not found, add it to eventData
      eventNotesData.push(eventNotesOrScanDateData);
    }
  });

  eventNotesData.sort((a, b) => {
    const dateA = new Date(a.day).getTime();
    const dateB = new Date(b.day).getTime();
    return dateA - dateB;
  });

  return eventNotesData;
};

// Generate the list of dates in the range (in the event's timezone)
export const generateDateRangeForScans = (start, end, time_zone = 'UTC') => {
  const result = [];
  const currentDate = moment.tz(start, time_zone).startOf('day'); // Convert start date to event's timezone

  while (currentDate.isSameOrBefore(moment.tz(end, time_zone).startOf('day'))) {
    result.push(currentDate.clone()); // Store as moment object
    currentDate.add(1, 'days'); // Move to next day
  }
  return result;
};
