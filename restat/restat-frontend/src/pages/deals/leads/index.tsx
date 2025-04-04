import React, { useEffect, useMemo, useState } from "react";
import { apis } from "../../../services";
import {
  BidTypes,
  DateProps,
  Filters_Type,
  ProfileSource,
} from "../../../services/types/common";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "../../../services/redux/store";
import { debounce } from "../../../services/utils/debounce";
import { setUsers } from "../../../services/redux/features/all-company-users/all-company-users.slice";
import { setProfiles } from "../../../services/redux/features/all-upwork-profiles/profiles.slice";
import {
  setLeads,
  setLeadsCount,
  setLeadsPerPage,
} from "../../../services/redux/features/leads/leads.slice";
import { useNavigate, useSearchParams } from "react-router-dom";
import { customNotification } from "../../../components";
import {
  Space,
  Pagination,
  PaginationProps,
  Table,
} from "antd";
import { getLeadsTableHeadings } from "../../../services/constants/leads";
import { BidDetails, IBidDetails } from "../../../services/types/bids";
import NoDataFound from "../../../components/no-data-found";
import { setTotalContractsCounts, setTotalLeadsCount, setTotalProposalsCount } from "../../../services/redux/features/deals/deal.slice";

interface ILeadsTabProps {
  setProposalsModal: (data: IBidDetails) => void
  setShowLeadLogs: ({ show, id }: { show: boolean, id: string }) => void
  setShowCommentsLogs: ({ show, id }: { show: boolean, id: string }) => void
}


const Leads: React.FC<ILeadsTabProps> = React.memo((
  { setProposalsModal, setShowCommentsLogs, setShowLeadLogs }
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<Filters_Type[]>([]);
  const [bidder, setBidder] = useState<string[]>([]);
  const [profile, setProfile] = useState<string[]>([]);

  const dispatch = useDispatch();
  const navigation = useNavigate();

  const hasFilters =
    searchParams &&
    Array.from(searchParams.keys()).some(
      (key) => !["activeTab", "page", "per_page"].includes(key)
    );


  const deals = useSelector((state: RootState) => state.deals.deals);
  const leads = useSelector((state: RootState) => state.leads.leads);
  const leadsCount = useSelector((state: RootState) => state.leads.leadsCount);
  const leadsPerPage = useSelector(
    (state: RootState) => state.leads.leadsPerPage
  );
  const bidders = useSelector(
    (state: RootState) => state.companyAllUsers.users
  );

  const upworkProfiles = useSelector(
    (state: RootState) => state.companyAllUpworkProfiles.profiles
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
    {
      search,
      profile,
      bidder,
      page,
      date,
      perPage,
      leadType,
      id,
    }: {
      search?: string,
      profile?: string[],
      bidder?: string[],
      page?: number,
      date?: DateProps,
      perPage?: number,
      leadType?: Filters_Type[],
      id?: string
    }
  ) => {
    try {
      setLoading(true);

      const { data } = await apis.getBiddersBidOrAdminBids(
        {
          search,
          profile: profile && profile.join(","),
          status: BidTypes.LEADS,
          page,
          bidder: bidder && bidder.join(","),
          slug: id,
          dates: date?.selected
            ? {
              startDate: date.startDate || null,
              endDate: date.endDate || null,
              selected: date.selected
            }
            : undefined,
          perPage,
          type: leadType?.join(",")
        }
      );

      setPage(data?.page);
      dispatch(setLeads(data?.data));
      dispatch(setLeadsCount(data?.dataCount));
      dispatch(setLeadsPerPage(data?.dataPerPage));

      dispatch(setTotalProposalsCount(data?.counts?.proposals ?? 0));
      dispatch(setTotalLeadsCount(data?.counts?.leads ?? 0));
      dispatch(setTotalContractsCounts(data?.counts?.contracts ?? 0));
    } catch (err: any) {
      dispatch(setLeads([]));
      dispatch(setLeadsCount(0));
      dispatch(setLeadsPerPage(0));
      customNotification.error(
        err?.response?.data?.message ||
        "An error occured in getting the leads! Please try again later"
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
        query: string,
        profile: string[],
        bidder: string[],

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
    updateUrlParams({ page: pageNumber.toString() });
  };

  const onPerPageChange: PaginationProps["onShowSizeChange"] = (
    _,
    pageSize
  ) => {
    dispatch(setLeadsPerPage(pageSize));
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
    const queryType = searchParams.get("type")
      ? searchParams
        .get("type")
        ?.split(",")
        .map((type) => Filters_Type[type as keyof typeof Filters_Type])
      : [];
    const queryStartDate = searchParams.get("startDate");
    const queryEndDate = searchParams.get("endDate");
    const queryPage = searchParams.get("page");
    const queryPerPage = searchParams.get("per_page");

    if (querySearch.length >= 3) setSearch(querySearch);
    setProfile(queryProfile || []);
    setBidder(queryBidder || []);
    setType(queryType as Filters_Type[]);
    if (queryPage) setPage(parseInt(queryPage));
    if (queryPerPage) dispatch(setLeadsPerPage(parseInt(queryPerPage)));

    if (
      querySearch.length >= 3 ||
      queryProfile?.length ||
      0 ||
      queryBidder?.length ||
      queryType?.length ||
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
            selected: true,
          },
          perPage: queryPerPage ? parseInt(queryPerPage) : leadsPerPage,
          leadType: type
        }
      );
    } else {
      fetchData({ profile, bidder, page, perPage: leadsPerPage, leadType: type });
    }
  }, [searchParams]);

  useEffect(() => {
    if (leadsPerPage && leadsPerPage !== 20) {
      updateUrlParams({ per_page: leadsPerPage.toString() });
    }
    if (page !== 1) {
      updateUrlParams({ page: page.toString() });
    }
  }, [leadsPerPage, page]);

  useEffect(() => {
    if (search.length >= 3) {
      debouncedSearch({ query: search, profile, bidder });
    }
  }, [search, profile, bidder]);

  useEffect(() => {
    if (search.length > 0 && search.length < 3) {
      fetchData({ profile, bidder, leadType: type });
    }
  }, [profile, bidder, type]);

  useEffect(() => {
    fetchBiddersProfilesData();
  }, []);


  const handleLeadsViewIcon = (data: BidDetails) => setProposalsModal({ show: true, data });
  const handleViewLeadLogsIcon = (data: BidDetails) => setShowLeadLogs({ show: true, id: data?.id ?? "" });
  const handleViewCommentsLogsIcon = (data: BidDetails) => setShowCommentsLogs({ show: true, id: data?.id ?? "" });

  return (leads && leads.length > 0) || loading ? (
    <div className="inner-content flex-1 flex flex-col sticky">
      <div className="flex-1 bottom-0 w-full flex flex-col">

        <div style={{ height: "calc(100vh - 180px)", overflow: "scroll" }}>
          <Table
            className="custom-table-v1"
            columns={getLeadsTableHeadings({
              handleLeadsViewIcon,
              handleViewLeadLogsIcon,
              handleViewCommentsLogsIcon,
              navigation,
            })}
            dataSource={leads}
            pagination={false}
            scroll={{ x: 1500, y: "calc(100vh - 280px)" }}
            size="large"
            loading={loading}
          />
        </div>

        {leadsCount ? (
          <Space direction="horizontal" size={12} className="justify-center">
            <Pagination
              showQuickJumper
              total={leadsCount}
              defaultCurrent={page}
              current={page}
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
              onChange={onPaginationChange}
              defaultPageSize={leadsPerPage}
              pageSize={leadsPerPage}
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
          : !leads || leads.length === 0
            ? hasFilters
              ? "No Data Found against this Filter"
              : "No Deals Found"
            : "No Data Found"
      }
      secondaryText={
        !deals
          ? "Sync your first Upwork deal now!"
          : !leads || leads.length === 0
            ? hasFilters
              ? "Try adjusting your filters to find the desired results"
              : "Sync your first Upwork deal now!"
            : "Try adjusting your filters to find the desired results"
      }
    />
  ) : null;
})

export default Leads;
