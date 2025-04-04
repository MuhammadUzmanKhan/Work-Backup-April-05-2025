import React, { useEffect, useMemo, useState } from "react";
import { apis } from "../../../services";
import {
  BidTypes,
  DateProps,
  ProfileSource,
} from "../../../services/types/common";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../../services/redux/store";
import { debounce } from "../../../services/utils/debounce";
import { setUsers } from "../../../services/redux/features/all-company-users/all-company-users.slice";
import { setProfiles } from "../../../services/redux/features/all-upwork-profiles/profiles.slice";
import {
  setJobs,
  setJobsCount,
  setJobsPerPage,
} from "../../../services/redux/features/jobs/jobs.slice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { customNotification } from "../../../components";
import {
  Space,
  Pagination,
  PaginationProps,
  Table,
} from "antd";
import { getJobsTableHeadings } from "../../../services/constants/contracts";
import { BidDetails, IBidDetails } from "../../../services/types/bids";
import NoDataFound from "../../../components/no-data-found";
import { setTotalContractsCounts, setTotalLeadsCount, setTotalProposalsCount } from "../../../services/redux/features/deals/deal.slice";

interface IContractTabProps {
  setProposalsModal: (data: IBidDetails) => void
  setShowLeadLogs: ({ show, id }: { show: boolean, id: string }) => void
  setShowCommentsLogs: ({ show, id }: { show: boolean, id: string }) => void
}

const Contracts: React.FC<IContractTabProps> = React.memo(({
  setProposalsModal, setShowCommentsLogs, setShowLeadLogs
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [bidder, setBidder] = useState<string[]>([]);
  const [profile, setProfile] = useState<string[]>([]);

  const dispatch = useDispatch();
  const navigation = useNavigate();

  const deals = useSelector((state: RootState) => state.deals.deals);
  const jobs = useSelector((state: RootState) => state.jobs.jobs);
  const jobsCount = useSelector((state: RootState) => state.jobs.jobsCount);
  const jobsPerPage = useSelector((state: RootState) => state.jobs.jobsPerPage);
  const bidders = useSelector(
    (state: RootState) => state.companyAllUsers.users
  );
  const upworkProfiles = useSelector(
    (state: RootState) => state.companyUpworkProfiles.profiles
  );

  const hasFilters =
    searchParams &&
    Array.from(searchParams.keys()).some(
      (key) => !["activeTab", "page", "per_page"].includes(key)
    );

  const fetchBiddersProfilesData = async () => {
    try {
      if (!bidders) {
        const { data: users } = await apis.getAllCompanyUsers();
        dispatch(setUsers(users?.users));
      }
      if (!upworkProfiles) {
        const { data: profiles } = await apis.getAllCompanyUpworkProfiles(
          ProfileSource.UPWORK
        );
        dispatch(setProfiles(profiles.profiles));
      }
    } catch (error: any) {
      console.error(error);
      customNotification.error(
        error?.response?.data?.message || "An Error Occurred"
      );
    }
  };

  const fetchData = async (
    { search,
      profile,
      bidder,
      page,
      date,
      perPage,
      slug
    }:
      {
        search?: string,
        profile?: string[],
        bidder?: string[],
        page?: number,
        date?: DateProps,
        perPage?: number,
        slug?: string
      }
  ) => {
    try {
      setLoading(true);

      const { data } = await apis.getBiddersBidOrAdminBids(
        {
          search,
          profile: profile?.join(","),
          status: BidTypes.CONTRACTS,
          page,
          bidder: bidder?.join(","),
          slug,
          dates: date?.selected
            ? {
              startDate: date.startDate || null,
              endDate: date.endDate || null,
              selected: date.selected
            } : undefined,

          perPage
        }
      );

      setPage(data?.page);
      dispatch(setJobs(data?.data));
      dispatch(setJobsCount(data?.dataCount));
      dispatch(setJobsPerPage(data?.dataPerPage));


      dispatch(setTotalProposalsCount(data?.counts?.proposals ?? 0));
      dispatch(setTotalLeadsCount(data?.counts?.leads ?? 0));
      dispatch(setTotalContractsCounts(data?.counts?.contracts ?? 0));

    } catch (error: any) {
      dispatch(setJobs([]));
      dispatch(setJobsCount(0));
      dispatch(setJobsPerPage(0));
      customNotification.error(
        error?.response?.data?.message || "An Error Occurred!"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateUrlParams = (params: { [key: string]: string }) => {
    setSearchParams((prevParams) => {
      const newParams = {
        ...Object.fromEntries(prevParams.entries()),
        ...params,
      };

      Object.keys(newParams).forEach((key) => {
        if (
          !newParams[key] ||
          (key === "page" && newParams[key] === "1") ||
          (key === "per_page" && newParams[key] === "20")
        ) {
          delete newParams[key];
        }
      });

      return new URLSearchParams(newParams);
    });
  };

  const debouncedSearch = useMemo(() => {
    return debounce(
      (
        {
          query,
          profile,
          bidder,
        }: {
          query: string,
          profile: string[],
          bidder: string[],
        }
      ) => {
        if (query.length >= 3) {
          fetchData({ search: query, profile, bidder });
        }
      },
      300
    );
  }, []);

  const onPaginationChange: PaginationProps["onChange"] = (pageNumber) => {
    setPage(pageNumber);
    pageNumber === 1 && updateUrlParams({ page: "" });
  };

  const onPerPageChange: PaginationProps["onShowSizeChange"] = (
    _,
    pageSize
  ) => {
    dispatch(setJobsPerPage(pageSize));
    updateUrlParams({ per_page: pageSize.toString() });
  };

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    const queryProfile = searchParams.get("upwork_profile")
      ? searchParams.get("upwork_profile")?.split(",")
      : [];
    const queryBidder = searchParams.get("business_developer")
      ? searchParams.get("business_developer")?.split(",")
      : [];
    const queryStartDate = searchParams.get("startDate");
    const queryEndDate = searchParams.get("endDate");
    const queryPage = searchParams.get("page");
    const queryPerPage = searchParams.get("per_page");

    if (querySearch.length >= 3) setSearch(querySearch);
    setProfile(queryProfile || []);
    setBidder(queryBidder || []);
    if (queryPage) setPage(parseInt(queryPage));
    if (queryPerPage) dispatch(setJobsPerPage(parseInt(queryPerPage)));


    if (
      querySearch.length >= 3 ||
      queryProfile ||
      queryBidder ||
      (queryStartDate && queryEndDate) ||
      queryPage ||
      queryPerPage
    ) {
      fetchData(
        {
          search: querySearch,
          profile: queryProfile || [],
          bidder: queryBidder || [],
          page: queryPage ? parseInt(queryPage) : 1,
          date: {
            startDate: queryStartDate ? new Date(queryStartDate) : null,
            endDate: queryEndDate ? new Date(queryEndDate) : null,
            selected: queryStartDate && queryEndDate ? true : false,
          },
          perPage: queryPerPage ? parseInt(queryPerPage) : 20
        }
      );
    } else {
      fetchData({ profile, bidder, page, perPage: jobsPerPage });
    }
  }, [searchParams]);

  useEffect(() => {
    if (jobsPerPage && jobsPerPage !== 20) {
      updateUrlParams({ per_page: jobsPerPage.toString() });
    }
    if (page !== 1) {
      updateUrlParams({ page: page.toString() });
    }
  }, [jobsPerPage, page]);

  useEffect(() => {
    if (search.length >= 3) {
      debouncedSearch({ query: search, profile, bidder });
    }
  }, [search, profile, bidder]);

  useEffect(() => {
    if (search.length > 0 && search.length < 3) {
      fetchData({ profile, bidder });
    }
  }, [profile, bidder]);

  useEffect(() => {
    fetchBiddersProfilesData();
  }, []);

  const handleJobsViewIcon = (data: BidDetails) => setProposalsModal({ show: true, data });
  const handleViewLeadLogsIcon = (data: BidDetails) => setShowLeadLogs({ show: true, id: data?.id ?? "" });
  const handleViewCommentsLogsIcon = (data: BidDetails) => setShowCommentsLogs({ show: true, id: data?.id ?? "" });

  return (jobs && jobs.length > 0) || loading ? (
    <div className="inner-content flex-1 flex flex-col sticky">
      <div className="flex-1 bottom-0 w-full flex flex-col">
        <div style={{ height: "calc(100vh - 180px)", overflow: "scroll" }}>
          <Table
            className="custom-table-v1"
            columns={getJobsTableHeadings({
              handleJobsViewIcon,
              handleViewLeadLogsIcon,
              handleViewCommentsLogsIcon,
              navigation,
            })}
            dataSource={jobs}
            pagination={false}
            scroll={{ x: 1500, y: "calc(100vh - 280px)" }}
            size="large"
            loading={loading}
          />
        </div>

        {jobsCount ? (
          <Space
            direction="horizontal"
            size={12}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Pagination
              showQuickJumper
              total={jobsCount}
              defaultCurrent={page}
              current={page}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
              onChange={onPaginationChange}
              defaultPageSize={jobsPerPage}
              pageSize={jobsPerPage}
              onShowSizeChange={onPerPageChange}
            />
          </Space>
        ) : null}
      </div>
    </div>
  ) : !loading ? (
    <NoDataFound
      primaryText={
        !deals
          ? "No Deals Found"
          : !jobs || jobs.length === 0
            ? hasFilters
              ? "No Data Found against this Filter"
              : "No Deals Found"
            : "No Data Found"
      }
      secondaryText={
        !deals
          ? "Sync your first Upwork deal now!"
          : !jobs || jobs.length === 0
            ? hasFilters
              ? "Try adjusting your filters to find the desired results"
              : "Sync your first Upwork deal now!"
            : "Try adjusting your filters to find the desired results"
      }
    />

  ) : null;
})

export default Contracts;
