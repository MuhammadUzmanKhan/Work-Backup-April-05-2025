import React, { useEffect, useState } from "react";
import { apis, useLoader } from "../../../services";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../services/redux/store";
import { setDeals, setDealsCount, setDealsPerPage, setTotalContractsCounts, setTotalLeadsCount, setTotalProposalsCount } from "../../../services/redux/features/deals/deal.slice";
import { BidDetails, IBidDetails } from "../../../services/types/bids";
import { Pagination, Space, Table } from "antd";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { customNotification } from "../../../components";
import { getDealsAllTabTableHeadings } from "../../../services/constants/deals-all-table";
import { PaginationProps } from "antd/lib";
import NoDataFound from "../../../components/no-data-found";
import useSyncFiltersFromParams from "../../../services/hooks/useSyncFiltersFromParams";
import { DateProps } from "../../../services/types/common";

interface IAllTabProps {
  setProposalsModal: (data: IBidDetails) => void
  setShowLeadLogs: ({ show, id }: { show: boolean, id: string }) => void
  setShowCommentsLogs: ({ show, id }: { show: boolean, id: string }) => void
}

const DealsAllTab: React.FC<IAllTabProps> = React.memo(
  ({ setProposalsModal, setShowLeadLogs, setShowCommentsLogs }) => {
    const [page, setPage] = useState<number>(1);
    const [searchParams, setSearchParams] = useSearchParams();

    const dispatch = useDispatch();
    const navigation = useNavigate();
    const { dealId } = useParams<{ dealId: string }>();
    const { loading, off, on } = useLoader();

    const deals = useSelector((state: RootState) => state.deals.deals);
    const dealsCount = useSelector((state: RootState) => state.deals.dealsCount);
    const dealsPerPage = useSelector((state: RootState) => state.deals.dealsPerPage);

    const hasFilters =
      searchParams &&
      Array.from(searchParams.keys()).some(
        (key) => !["activeTab", "page", "per_page"].includes(key)
      );
    const onPaginationChange: PaginationProps['onChange'] = (pageNumber) => {
      setPage(pageNumber);
      pageNumber === 1 && updateUrlParams({ page: "" });
    };

    const onPerPageChange: PaginationProps['onShowSizeChange'] = (_, pageSize) => {
      dispatch(setDealsPerPage(pageSize));
      updateUrlParams({ per_page: pageSize.toString() });
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

    const fetchData = async ({
      search,
      profile,
      bidder,
      page,
      perPage,
      slug,
      dates,
      status,
      clientBudgetMin,
      clientBudgetMax,
      proposedRate,
      receivedRate,
      leadStartDate,
      leadEndDate,
      proposalStartDate,
      proposalEndDate,
      contractStartDate,
      contractEndDate,
      location,
      skillset,
      type,
    }: {
      search?: string;
      profile?: string;
      bidder?: string;
      type?: string;
      page?: number;
      perPage?: number;
      slug?: string;
      dates?: DateProps;
      status?: string,
      clientBudgetMin?: number;
      clientBudgetMax?: number;
      proposedRate?: number;
      receivedRate?: number;
      leadStartDate?: Date,
      leadEndDate?: Date,
      proposalStartDate?: Date,
      proposalEndDate?: Date,
      contractStartDate?: Date,
      contractEndDate?: Date,
      location?: string;
      skillset?: string[];
    }) => {
      try {
        on();

        const { data } = await apis.getBiddersBidOrAdminBids({
          search,
          profile,
          bidder,
          page,
          perPage,
          dates,
          slug,
          status,
          clientBudgetMin,
          clientBudgetMax,
          proposedRate,
          receivedRate,
          leadStartDate: leadStartDate ? leadStartDate : undefined,
          leadEndDate: leadEndDate ? leadEndDate : undefined,
          proposalStartDate: proposalStartDate ? proposalStartDate : undefined,
          proposalEndDate: proposalEndDate ? proposalEndDate : undefined,
          contractStartDate: contractStartDate ? contractStartDate : undefined,
          contractEndDate: contractEndDate ? contractEndDate : undefined,
          location,
          skillset,
          type,
        });

        if (slug) {
          setProposalsModal({ data: data?.data[0], show: true });
          return;
        }

        dispatch(setDeals(data?.data));
        dispatch(setDealsCount(data?.dataCount));
        dispatch(setDealsPerPage(data?.dataPerPage));

        dispatch(setTotalProposalsCount(data?.counts?.proposals ?? 0));
        dispatch(setTotalLeadsCount(data?.counts?.leads ?? 0));
        dispatch(setTotalContractsCounts(data?.counts?.contracts ?? 0));

      } catch (err: any) {
        customNotification.error(
          "Error!",
          err?.response?.data?.message ||
          "An error occurred in getting the deals! Please try again later"
        );
      } finally {
        off();
      }
    };

    useSyncFiltersFromParams(searchParams);

    useEffect(() => {
      dealId && fetchData({ page: 1, slug: dealId })
    }, [dealId]);

    useEffect(() => {
      const querySearch = searchParams.get("search") || "";
      const queryType = searchParams.get("type") || "";
      const queryProfile = searchParams.get("upwork_profiles") || "";
      const queryBidder = searchParams.get("business_developer") || "";
      const queryStatus = searchParams.get("status") || "";
      const querySkillset = searchParams.get("skillset") || "";

      const queryStartDate = searchParams.get("startDate");
      const queryEndDate = searchParams.get("endDate");

      const queryClientBudgetMin = searchParams.get("client_budget_min")
        ? +searchParams.get("client_budget_min")!
        : undefined;

      const queryClientBudgetMax = searchParams.get("client_budget_max")
        ? +searchParams.get("client_budget_max")!
        : undefined;

      const queryProposedRate = searchParams.get("proposed_rate")
        ? +searchParams.get("proposed_rate")!
        : undefined;

      const queryReceivedRate = searchParams.get("received_rate")
        ? +searchParams.get("received_rate")!
        : undefined;

      const queryLocation = searchParams.get("location") || "";

      const parseDate = (dateString: string | null): Date | undefined => {
        return dateString ? new Date(dateString) : undefined;
      };

      const queryLeadStartDate = parseDate(searchParams.get("lead_start_date"));
      const queryLeadEndDate = parseDate(searchParams.get("lead_end_date"));
      const queryProposalStartDate = parseDate(searchParams.get("proposal_start_date"));
      const queryProposalEndDate = parseDate(searchParams.get("proposal_end_date"));
      const queryContractStartDate = parseDate(searchParams.get("contract_start_date"));
      const queryContractEndDate = parseDate(searchParams.get("contract_end_date"));


      const queryPage = searchParams.get("page") ? +searchParams.get("page")! : 1;
      setPage(queryPage);
      const queryPerPage = searchParams.get("per_page") ? +searchParams.get("per_page")! : 20;
      setDealsPerPage(queryPerPage);

      fetchData({
        type: queryType,
        search: querySearch,
        profile: queryProfile,
        bidder: queryBidder,
        status: queryStatus,
        skillset: querySkillset ? querySkillset.split(",") : [],
        clientBudgetMin: (queryClientBudgetMax && queryClientBudgetMin === 0) ? 1 : queryClientBudgetMin,
        clientBudgetMax: queryClientBudgetMax,
        proposedRate: queryProposedRate,
        receivedRate: queryReceivedRate,
        dates: {
          startDate: queryStartDate ? new Date(queryStartDate) : null,
          endDate: queryEndDate ? new Date(queryEndDate) : null,
          selected: true,
        },
        location: queryLocation,
        page: queryPage,
        perPage: queryPerPage,
        leadStartDate: queryLeadStartDate,
        leadEndDate: queryLeadEndDate,
        proposalStartDate: queryProposalStartDate,
        proposalEndDate: queryProposalEndDate,
        contractStartDate: queryContractStartDate,
        contractEndDate: queryContractEndDate,
      });
    }, [searchParams]);

    useEffect(() => {
      if (dealsPerPage && dealsPerPage !== 20) {
        updateUrlParams({ per_page: dealsPerPage.toString() });
      }
      if (page !== 1) {
        updateUrlParams({ page: page.toString() });
      }
    }, [dealsPerPage, page]);

    const handleProposalsViewIcon = (data: BidDetails) => setProposalsModal({ show: true, data });
    const handleViewLeadLogsIcon = (data: BidDetails) => setShowLeadLogs({ show: true, id: data?.id });
    const handleViewCommentsLogsIcon = (data: BidDetails) => setShowCommentsLogs({ show: true, id: data?.id });

    return (deals && deals.length > 0) || loading ? (
      <div className="inner-content flex-1 flex flex-col sticky">
        <div className="flex-1 bottom-0 w-full flex flex-col">
          <div style={{ height: "calc(100vh - 180px)", overflow: "scroll" }}>
            <Table
              className="custom-table-v1"
              columns={getDealsAllTabTableHeadings({
                handleProposalsViewIcon,
                handleViewLeadLogsIcon,
                handleViewCommentsLogsIcon,
                navigation,
              })}
              dataSource={deals}
              pagination={false}
              scroll={{ x: 1500, y: "calc(100vh - 280px)" }}
              size="large"
              loading={loading}
              rowClassName={() => "custom-row-height"}
            />
          </div>

          {dealsCount > 0 && (
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
                total={dealsCount}
                defaultCurrent={page}
                current={page}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
                onChange={onPaginationChange}
                onShowSizeChange={onPerPageChange}
                defaultPageSize={dealsPerPage}
                pageSize={dealsPerPage}
              />
            </Space>
          )}

        </div>
      </div>
    ) : !loading ? (
      <NoDataFound
        primaryText={
          deals && deals.length === 0
            ? hasFilters
              ? "No Data Found against this Filter"
              : "No Deals Found"
            : "No Data Found"
        }
        secondaryText={
          deals && deals.length === 0
            ? hasFilters
              ? "Try adjusting your filters to find the desired results"
              : "Sync your first Upwork deal now!"
            : "Try adjusting your filters to find the desired results"
        }
      />
    ) : null;
  }
);

export default DealsAllTab;
