import { DateProps } from '../types/common';
import { DATE_OPTIONS } from '../types/general';

const useDateFilter = (setDate: React.Dispatch<React.SetStateAction<DateProps>>, setPage?: React.Dispatch<React.SetStateAction<number>>) => {

  const dateOptions = [
    { value: DATE_OPTIONS.TODAY, label: DATE_OPTIONS.TODAY },
    { value: DATE_OPTIONS.YESTERDAY, label: DATE_OPTIONS.YESTERDAY },
    { value: DATE_OPTIONS.THIS_WEEK, label: DATE_OPTIONS.THIS_WEEK },
    { value: DATE_OPTIONS.LAST_WEEK, label: DATE_OPTIONS.LAST_WEEK },
    { value: DATE_OPTIONS.THIS_MONTH, label: DATE_OPTIONS.THIS_MONTH },
    { value: DATE_OPTIONS.LAST_MONTH, label: DATE_OPTIONS.LAST_MONTH },
    { value: DATE_OPTIONS.THIS_YEAR, label: DATE_OPTIONS.THIS_YEAR },
    { value: DATE_OPTIONS.LAST_YEAR, label: DATE_OPTIONS.LAST_YEAR },
    { value: DATE_OPTIONS.ALL_DATA, label: DATE_OPTIONS.ALL_DATA },
  ];

  const handleChangeDate = (startDate: Date, endDate: Date) => {
    setDate({
      startDate,
      endDate,
      selected: true,
    });
  };

  const handleCancelDateClick = () => {
    setPage && setPage(1)
    setDate({
      startDate: null,
      endDate: null,
      selected: false,
    });
  };

  const handleDateOptionChange = (option: string) => {
    setPage && setPage(1)
    if (option === undefined) {
      handleCancelDateClick();
    } else {
      setPage && setPage(1)
      const today = new Date();
      let startDate = new Date();
      let endDate = new Date();

      switch (option) {
        case DATE_OPTIONS.TODAY:
          startDate = endDate = today;
          break;
        case DATE_OPTIONS.YESTERDAY:
          startDate = endDate = new Date(today.setDate(today.getDate() - 1));
          break;
        case DATE_OPTIONS.THIS_WEEK:
          const currentDay = today.getDay();
          startDate = new Date(today);
          startDate.setDate(today.getDate() - currentDay);
          endDate = today;
          break;
        case DATE_OPTIONS.LAST_WEEK:
          const lastWeekDay = today.getDay();
          startDate = new Date(today);
          startDate.setDate(today.getDate() - lastWeekDay - 7);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        case DATE_OPTIONS.THIS_MONTH:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = today;
          break;
        case DATE_OPTIONS.LAST_MONTH:
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case DATE_OPTIONS.THIS_YEAR:
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = today;
          break;
        case DATE_OPTIONS.LAST_YEAR:
          startDate = new Date(today.getFullYear() - 1, 0, 1);
          endDate = new Date(today.getFullYear() - 1, 11, 31);
          break;
        case DATE_OPTIONS.ALL_DATA:
          startDate = new Date(1970, 0, 1);
          endDate = new Date();
          break;
        default:
          handleCancelDateClick();
          return;
      }
      setDate({ startDate, endDate, selected: true });
      handleChangeDate(startDate, endDate);
    }
  };

  const getDateRangeOption = (startDate: Date | null, endDate: Date | null): string => {

    if (!startDate || !endDate) {
      return ''
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (startDate.getDate() === endDate.getDate() && startDate.getDate() === today.getDate()) {
      return DATE_OPTIONS.TODAY;
    }

    if (startDate.getDate() === yesterday.getDate() && endDate.getDate() === yesterday.getDate()) {
      return DATE_OPTIONS.YESTERDAY;
    }

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    if (startDate.getDate() === thisWeekStart.getDate() && endDate.getDate() === today.getDate()) {
      return DATE_OPTIONS.THIS_WEEK;
    }

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
    if (startDate.getDate() === lastWeekStart.getDate() && endDate.getDate() === lastWeekEnd.getDate()) {
      return DATE_OPTIONS.LAST_WEEK;
    }

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (startDate.getDate() === thisMonthStart.getDate() && endDate.getDate() === today.getDate() && startDate.getMonth() === thisMonthStart.getMonth()) {
      return DATE_OPTIONS.THIS_MONTH;
    }

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    if (startDate.getDate() === lastMonthStart.getDate() && endDate.getDate() === lastMonthEnd.getDate() && startDate.getMonth() === lastMonthStart.getMonth()) {
      return DATE_OPTIONS.LAST_MONTH;
    }

    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    if (startDate.getDate() === thisYearStart.getDate() && endDate.getDate() === today.getDate() && startDate.getFullYear() === today.getFullYear()) {
      return DATE_OPTIONS.THIS_YEAR;
    }

    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
    if (startDate.getDate() === lastYearStart.getDate() && endDate.getDate() === lastYearEnd.getDate() && startDate.getFullYear() === lastYearStart.getFullYear()) {
      return DATE_OPTIONS.LAST_YEAR;
    }

    const allDataStart = new Date(1970, 0, 1);
    const allDataEnd = new Date();
    if (startDate.getDate() === allDataStart.getDate() && endDate.getDate() === allDataEnd.getDate()) {
      return DATE_OPTIONS.ALL_DATA;
    }
    return 'Custom'
  };

  return { dateOptions, handleDateOptionChange, handleCancelDateClick, getDateRangeOption };
};

export default useDateFilter;
