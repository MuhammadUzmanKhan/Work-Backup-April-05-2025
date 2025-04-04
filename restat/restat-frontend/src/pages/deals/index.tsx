import React, { ChangeEvent, useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DatePicker, Input, Select } from "antd";
import { useDispatch } from "react-redux";
import Layout from "../../components/layout";
import { ROLE, UsersObject } from "../../services/types/common";
import { ActionButton } from "../../components";
import useDateFilter from "../../services/hooks/quick-date-filters";
import DealsTabContent from "../../components/deals/deals-tab-content";
import { DealsTabsEnum } from "./types";
import DealsTabs from "../../components/deals/deals-tab";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";
import moment from "moment";
import LeadForm from "../../components/manual-leads/LeadForm";
import { BidDetails, IBidDetails } from "../../services/types/bids";
import DealLogDrawer from "../../components/drawer/deal-log-drawer";
import { CommentsDrawer } from "../../components/comments-drawer";
import BidModal from "../../components/bids";
import { routes } from "../../services";
import { setFilters } from "../../services/redux/features/page-header/filter.slice";

const Deals = React.memo(({ user }: { user: UsersObject }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [dealModal, setDealModal] = useState(false)
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [dateRangeFilter, setDateRangeFilter] = useState({
    startDate: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate") as string)
      : null,
    endDate: searchParams.get("endDate")
      ? new Date(searchParams.get("endDate") as string)
      : null,
    selected:
      searchParams.get("startDate") && searchParams.get("endDate")
        ? true
        : false,
  });
  const [proposalsModal, setProposalsModal] = useState<IBidDetails>({
    show: false,
    data: null,
  });
  const [showLeadLogs, setShowLeadLogs] = useState({
    show: false,
    id: "",
  });

  const [showCommentsLogs, setShowCommentsLogs] = useState({
    show: false,
    id: "",
  });

  const { RangePicker } = DatePicker;
  const { Search } = Input;

  const navigation = useNavigate()


  const {
    dateOptions,
    handleDateOptionChange,
    handleCancelDateClick,
    getDateRangeOption,
  } = useDateFilter(setDateRangeFilter, setPage);

  const dispatch = useDispatch();
  const activeTabFromParams = searchParams.get("activeTab") as DealsTabsEnum;

  const [activeTab, setActiveTab] = useState<DealsTabsEnum>(
    activeTabFromParams || DealsTabsEnum.ALL
  );

  const handleViewLeadLogsIcon = (data: BidDetails) => setShowLeadLogs({ show: true, id: data?.id });

  // Handle Tab Change
  const handleTabChange = (key: string) => {
    const tabKey = key as DealsTabsEnum;
    setActiveTab(tabKey);
    setPage(1);
  };

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    setPage(1);

    if (!dates || (dates[0] === null && dates[1] === null)) {
      setDateRangeFilter({
        startDate: null,
        endDate: null,
        selected: false,
      });
    } else {
      setDateRangeFilter({
        startDate: dates[0] ? dates[0].toDate() : null,
        endDate: dates[1] ? dates[1].toDate() : null,
        selected: true,
      });
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

  const onChangeSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();

    if (query.length >= 3) {
      updateUrlParams({ search: query });
    } else {
      setSearchParams((prevParams) => {
        const params = Object.fromEntries(prevParams.entries());
        delete params.search;
        return { ...params };
      });
    }

    setSearch(query);
    if (page > 1) {
      setPage(1);
    }
  };

  useEffect(() => {
    dateRangeFilter.startDate && dateRangeFilter.endDate ? updateUrlParams({
      startDate: moment(dateRangeFilter.startDate).format('YYYY-MM-DD'),
      endDate: moment(dateRangeFilter.endDate).format('YYYY-MM-DD'),
      page: '1'
    })
      : updateUrlParams({
        startDate: '',
        endDate: '',
        page: '1'
      })
  }, [dateRangeFilter])

  useEffect(() => {
    const tab = searchParams.get("activeTab")
    tab && setActiveTab(tab as DealsTabsEnum)
  }, [searchParams])

  useEffect(() => {
    activeTab && updateUrlParams({
      activeTab: activeTab === DealsTabsEnum.ALL ? '' : activeTab,
      page: '1',
    });
  }, [activeTab])

  useEffect(() => {
    dispatch(
      setHeaderData({
        title: "Deals",
        actionButtons: [ROLE.COMPANY_ADMIN, ROLE.OWNER].includes(user.role) ? [
          <ActionButton
            text="Create"
            tooltip="Click to create a custom deal"
            onClick={() => setDealModal(true)}
          />
        ] : [],
        tabs:
          <DealsTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        ,
        date: {
          range: <RangePicker
            value={[
              dateRangeFilter.startDate ? dayjs(dateRangeFilter.startDate) : null,
              dateRangeFilter.endDate ? dayjs(dateRangeFilter.endDate) : null,
            ]}
            onChange={handleDateRangeChange}
            format="MMM DD, YYYY"
          />,
          status: <Select
            allowClear
            style={{ minWidth: "170px" }}
            placeholder="Select a date option"
            optionFilterProp="label"
            onChange={handleDateOptionChange}
            onClear={handleCancelDateClick}
            defaultValue={getDateRangeOption(
              dateRangeFilter.startDate,
              dateRangeFilter.endDate
            ) || undefined}
            options={dateOptions}
            value={getDateRangeOption(
              dateRangeFilter.startDate,
              dateRangeFilter.endDate
            ) || undefined}
          />

        },
        search:
          <Search
            size="middle"
            placeholder="Search anything"
            value={search}
            onChange={onChangeSearch}
            style={{ width: "200px", alignSelf: "end" }}
          />,
        filters: true

      }))

  }, [activeTab, dateRangeFilter, search, setHeaderData, setFilters]);

  return (
    <Layout>
      <DealsTabContent
        activeTab={activeTab}
        setProposalsModal={setProposalsModal}
        setShowCommentsLogs={setShowCommentsLogs}
        setShowLeadLogs={setShowLeadLogs}
      />
      <LeadForm show={dealModal} onClose={() => setDealModal(false)} />

      {showLeadLogs.show && (
        <DealLogDrawer
          onClose={() => setShowLeadLogs({ show: false, id: "" })}
          open={showLeadLogs.show}
          id={showLeadLogs.id}
        />
      )}
      {showCommentsLogs.show && (
        <CommentsDrawer
          onClose={() => setShowCommentsLogs({ show: false, id: "" })}
          open={showCommentsLogs.show}
          bidId={showCommentsLogs.id}
        />
      )}
      {proposalsModal.show && (
        <BidModal
          title="Proposal"
          showModal={proposalsModal.show}
          bidDetails={proposalsModal.data as BidDetails}
          openDrawer={handleViewLeadLogsIcon}
          closeModal={() => {
            setProposalsModal({ show: false, data: null })
            const queryParams = window.location.search;
            if (window.location.href.includes(routes.deals)) {
              navigation(`${routes.deals}${queryParams}`);
            }
          }}
        />
      )}
    </Layout>
  );
});

export default Deals;
