/**
 * This file contains helpers that belongs to response of data including formatted response, pagination, etc.
 */

import { CsvOrPdf, SUCCESS } from '../constants';

/**
 * To Calculate the pagination attribute for META
 * @param total_count The total number of items being paginated.
 * @param total_pages The total number of pages needed to display all of the items based on the page_size.
 * @param current_page The current page number.
 * @param next_page The next page number. This can be null if there is no next page.
 * @param prev_page The previous page number. This can be null if there is no previous page.
 * @returns The function returns an object with pagination information such as total_count, total_pages, current_page, next_page, and prev_page. The next_page and prev_page properties can be null if there is no next or previous page.
 */
export const calculatePagination = (
  count: number,
  page_size: number,
  page: number,
) => {
  const currentPage = page + 1;
  const totalPages = Math.ceil(count / page_size);

  const nextPage =
    totalPages === currentPage || count === 0 || currentPage >= totalPages
      ? null
      : currentPage + 1;

  const prevPage = currentPage > 1 ? currentPage - 1 : null;

  return {
    total_count: count,
    total_pages: totalPages,
    current_page: currentPage,
    next_page: nextPage,
    prev_page: prevPage,
  };
};

/**
 * takes an object dataObj and modifies its keys based on certain conditions. It checks whether the object contains a createdAt, updatedAt, or deletedAt key. If it does, it renames these keys to created_at, updated_at, and deleted_at, respectively, and deletes the old key from the object.
 * @param dataObj
 */
export const processTimeStampHelper = (dataObj: any) => {
  if (dataObj['createdAt']) {
    dataObj['created_at'] = dataObj['createdAt'];
    delete dataObj['createdAt'];
  }
  if (dataObj['updatedAt']) {
    dataObj['updated_at'] = dataObj['updatedAt'];
    delete dataObj['updatedAt'];
  }
  if (dataObj['deletedAt']) {
    dataObj['deleted_at'] = dataObj['deletedAt'];
    delete dataObj['deletedAt'];
  }
};

/**
 * to be designed to modify timestamp-related keys in an object or an array of objects. They are likely used in conjunction with a database, where timestamps are commonly used to track when a row was created, last updated, or deleted. The code renames the timestamp keys to use a snake_case format, which may be a preference of the project
 */
export const processTimeStamp = (data: any) => {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] && processTimeStampHelper(data[i]);
    }
  } else if (data.data !== null && typeof data.data === 'object') {
    Object.keys(data.data).forEach((data) => processTimeStampHelper(data));
    return data.data;
  } else {
    processTimeStampHelper(data);
  }

  return data;
};

/**
 * To generate page and page_size
 * @param page
 * @param page_size
 * @returns [page, page_size]
 */
export const getPageAndPageSize = (
  page: string | number,
  page_size: string | number,
) => {
  const _page_size =
    page_size && !isNaN(Number(page_size)) && Number(page_size);
  const _page = page && !isNaN(Number(page)) ? Number(page) - 1 : 0;

  return [_page, _page_size];
};

/**
 * To generate default page and page_size if not given else use provided page/page_size
 * @param page
 * @param page_size
 * @returns [page, page_size]
 */
export const getPageAndPageSizeWithDefault = (
  page: number,
  page_size: number,
) => {
  const _page_size = page_size || +process.env['PAGE_LIMIT'];
  const _page = page ? +page - 1 : +process.env['PAGE'];

  return [_page, _page_size];
};

/**
 * To generate default page and page_size conditionally based on csv_pdf param if not given else use provided page/page_size
 * @param page
 * @param page_size
 * @param csv_pdf
 * @returns [page, page_size]
 */
export const getPageAndPageSizeWithCsvPdfParam = (
  page: number,
  page_size: number,
) => {
  const _page_size = page_size ? page_size : +process.env['PAGE_LIMIT'];
  const _page = page ? page && +page - 1 : +process.env['PAGE'];

  return [_page, _page_size];
};

/**
 *
 * @param data
 * @returns It will return formatted object for response having formatted timestamps in data and add pagination content in meta.
 */
export const successInterceptorResponseFormat = (data: any) => {
  return {
    data: Array.isArray(data?.data)
      ? processTimeStamp(data.data)
      : processTimeStamp(data),
    meta: {
      code: 200,
      message: SUCCESS,
      ...handlePagination(data),
      ...handleTotalCompanies(data),
      ...handleCompaniesCount(data),
      ...handleEventStatusCount(data),
      ...handleMessageGroupUsersCount(data),
      ...handleUserStatusCount(data),
      ...handleTaskStatusCount(data),
      ...handleAnyCounts(data),
      ...handlePaginationOnObject(data), // in case data type is not array but object
    },
  };
};

export const handlePagination = (data: any) => {
  if (Array.isArray(data?.data)) {
    return data.pagination;
  } else {
    return {};
  }
};

export const handlePaginationOnObject = (data: any) => {
  if (data.pagination) return data.pagination;
  else return {};
};

export const handleMessageGroupUsersCount = (data: any) => {
  if (data?.messageGroupUsersCount !== undefined) {
    return {
      messageGroupUsersCount: data.messageGroupUsersCount,
    };
  } else {
    return {};
  }
};

export const handleCompaniesCount = (data: any) => {
  if (
    data?.companiesCount !== undefined &&
    data?.subcompaniesCount !== undefined
  ) {
    return {
      companiesCount: data.companiesCount,
      subcompaniesCount: data.subcompaniesCount,
    };
  } else {
    return {};
  }
};

export const handleEventStatusCount = (data: any) => {
  if (data?.statusCount) {
    const statusCount = {};

    for (const item of data?.statusCount) {
      const status = item.status;
      const count = Number(item.count);

      if (
        status === 'completed' ||
        status === 'upcoming' ||
        status === 'in_progress' ||
        status === 'on_hold'
      ) {
        if (!statusCount[status]) {
          statusCount[status] = count;
        } else {
          statusCount[status] += count;
        }
      }
    }
    return statusCount;
  } else {
    return {};
  }
};

export const handleTotalCompanies = (data: any) => {
  if (data?.totalCompanies) {
    return { totalCompanies: data.totalCompanies };
  } else {
    return {};
  }
};

export const handleUserStatusCount = (data: any) => {
  if (data?.userStatusCount) {
    return data.userStatusCount;
  } else {
    return {};
  }
};

export const handleTaskStatusCount = (data: any) => {
  const { taskStatusCount, filteredTaskStatusCount } = data;

  if (taskStatusCount && filteredTaskStatusCount) {
    return { taskStatusCount, filteredTaskStatusCount };
  } else {
    return {};
  }
};

export const handleAnyCounts = (data: any) => {
  if (data?.counts !== undefined) {
    return {
      ...data.counts,
    };
  } else {
    return {};
  }
};
