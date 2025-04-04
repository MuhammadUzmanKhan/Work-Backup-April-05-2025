import React, { useEffect, useMemo, useState } from "react";
import { apis } from "../../../services";
import {
  BidTypes,
  DateProps,
  ProfileSource,
} from "../../../services/types/common";
import { useDispatch, useSelector } from "react-redux";
import {
  setbids,
  setBidsCount,
  setbidsPerPage,
} from "../../../services/redux/features/bids/bids.slice";
import { RootState } from "../../../services/redux/store";
import { debounce } from "../../../services/utils/debounce";
import { setUsers } from "../../../services/redux/features/all-company-users/all-company-users.slice";
import { setProfiles } from "../../../services/redux/features/all-upwork-profiles/profiles.slice";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Space,
  Pagination,
  PaginationProps,
  Table,
} from "antd";
import { getProposalAccountTableHeadings } from "../../../services/constants/proposals";
import { BidDetails, IBidDetails } from "../../../services/types/bids";
import { customNotification } from "../../../components";
import NoDataFound from "../../../components/no-data-found";
import { setTotalContractsCounts, setTotalProposalsCount, setTotalLeadsCount } from "../../../services/redux/features/deals/deal.slice";
interface IProposalsTabProps {
  setProposalsModal: (data: IBidDetails) => void
  setShowLeadLogs: ({ show, id }: { show: boolean, id: string }) => void
  setShowCommentsLogs: ({ show, id }: { show: boolean, id: string }) => void
}

const Bids: React.FC<IProposalsTabProps> = React.memo(
  ({
    setProposalsModal, setShowCommentsLogs, setShowLeadLogs
  }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [page, setPage] = useState<number>(1);
    const [search, setSearch] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [bidder, setBidder] = useState<string[]>([]);
    const [profile, setProfile] = useState<string[]>([]);

    const dispatch = useDispatch();
    const navigation = useNavigate();

    const deals = useSelector((state: RootState) => state.deals.deals);
    const bids = useSelector((state: RootState) => state.bids.bids);
    const bidsCount = useSelector((state: RootState) => state.bids.bidsCount);

    const hasFilters =
      searchParams &&
      Array.from(searchParams.keys()).some(
        (key) => !["activeTab", "page", "per_page"].includes(key)
      );

    const bidsPerPage = useSelector((state: RootState) => state.bids.bidsPerPage);
    const bidders = useSelector(
      (state: RootState) => state.companyAllUsers.users
    );
    const upworkProfiles = useSelector(
      (state: RootState) => state.companyUpworkProfiles.profiles
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
          error?.response?.data?.message ?? "An Error Occurred"
        );
      }
    };
    const handleProposalsViewIcon = (data: BidDetails) => setProposalsModal({ show: true, data });
    const handleViewLeadLogsIcon = (data: BidDetails) => setShowLeadLogs({ show: true, id: data?.id ?? "" });
    const handleViewCommentsLogsIcon = (data: BidDetails) => setShowCommentsLogs({ show: true, id: data?.id ?? "" });


    const fetchData = async (
      { search,
        profile,
        bidder,
        page,
        date,
        perPage,
        id,
      }:
        {
          search?: string,
          profile?: string[],
          bidder?: string[],
          page?: number,
          perPage?: number,
          id?: string
          date?: DateProps
        }
    ) => {
      try {
        setLoading(true);
        const { data } = await apis.getBiddersBidOrAdminBids({
          search,
          profile: profile?.join(","),
          status: BidTypes.PROPOSALS,
          page,
          bidder: bidder?.join(","),
          slug: id,
          dates: date?.selected
            ? {
              startDate: date.startDate || null,
              endDate: date.endDate || null,
              selected: date.selected
            }
            : undefined,
          perPage,
        });

        setPage(data?.page);
        dispatch(setbids(data?.data));
        dispatch(setBidsCount(data?.dataCount));
        dispatch(setbidsPerPage(data?.dataPerPage));

        dispatch(setTotalProposalsCount(data?.counts?.proposals ?? 0));
        dispatch(setTotalLeadsCount(data?.counts?.leads ?? 0));
        dispatch(setTotalContractsCounts(data?.counts?.contracts ?? 0));
      } catch (err: any) {
        dispatch(setbids([]));
        dispatch(setBidsCount(0));
        dispatch(setbidsPerPage(0));
        customNotification.error(
          err?.response?.data?.message ??
          "An error occured in getting the bids! Please try again later"
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
        ({ query,
          profile,
          bidder,
        }:
          {
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

    const onPaginationChange: PaginationProps['onChange'] = (pageNumber) => {
      setPage(pageNumber);
      updateUrlParams({ page: pageNumber.toString() });
    };

    const onPerPageChange: PaginationProps["onShowSizeChange"] = (
      _,
      pageSize
    ) => {
      dispatch(setbidsPerPage(pageSize));
      updateUrlParams({ per_page: pageSize?.toString() });
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
      if (queryPerPage) dispatch(setbidsPerPage(parseInt(queryPerPage)));

      if (
        querySearch.length >= 3 ||
        (queryProfile && queryProfile.length > 0) ||
        (queryBidder && queryBidder.length > 0) ||
        (queryStartDate && queryEndDate) ||
        queryPage ||
        queryPerPage
      ) {
        fetchData({
          search: querySearch,
          profile: queryProfile || [],
          bidder: queryBidder || [],
          page: queryPage ? parseInt(queryPage, 10) : 1,
          date: {
            startDate: queryStartDate ? new Date(queryStartDate) : null,
            endDate: queryEndDate ? new Date(queryEndDate) : null,
            selected: !!(queryStartDate && queryEndDate),
          },
          perPage: queryPerPage ? parseInt(queryPerPage, 10) : bidsPerPage,
        });
      }
      else {
        fetchData({ search: "", profile, bidder, page, perPage: bidsPerPage });
      }
    }, [searchParams]);

    useEffect(() => {
      if (bidsPerPage !== 20) {
        updateUrlParams({ per_page: bidsPerPage?.toString() });
      }
      if (page !== 1) {
        updateUrlParams({ page: page.toString() });
      }
    }, [bidsPerPage, page]);

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

    return (bids && bids.length > 0) || loading ? (
      <div className="inner-content flex-1 flex flex-col sticky">
        <div className="flex-1 bottom-0 w-full flex flex-col">
          <div
            style={{ height: "calc(100vh - 180px)", overflow: "scroll" }}
            className="custom-wrapper"
          >
            <Table
              className="custom-table-v1"
              columns={getProposalAccountTableHeadings({
                handleProposalsViewIcon,
                handleViewLeadLogsIcon,
                handleViewCommentsLogsIcon,
                navigation,
              })}
              dataSource={bids}
              pagination={false}
              scroll={{ x: 1500, y: "calc(100vh - 280px)" }}
              loading={loading}
            />
          </div>
        </div>
        {bidsCount ? (
          <Space direction="horizontal" size={12} className="justify-center">
            <Pagination
              showQuickJumper
              total={bidsCount}
              defaultCurrent={page}
              current={page}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
              onChange={onPaginationChange}
              defaultPageSize={bidsPerPage}
              pageSize={bidsPerPage}
              onShowSizeChange={onPerPageChange}
            />
          </Space>
        ) : null}
      </div>
    ) : !loading ? (
      <NoDataFound
        primaryText={
          !deals
            ? "No Deals Found"
            : !bids || bids.length === 0
              ? hasFilters
                ? "No Data Found against this Filter"
                : "No Deals Found"
              : "No Data Found"
        }
        secondaryText={
          !deals
            ? "Sync your first Upwork deal now!"
            : !bids || bids.length === 0
              ? hasFilters
                ? "Try adjusting your filters to find the desired results"
                : "Sync your first Upwork deal now!"
              : "Try adjusting your filters to find the desired results"
        }
      />

    ) : null;
  })

export default Bids;
