import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DatePicker, Select, Tabs } from 'antd';
import moment from "moment";

import { setConnectionsCountByState, setConnectsCount, setConnectsCountByBusinessDeveloper, setConnectsCountByProfile, setIndustryConnectsCount, setMonthlyConnectionData, setProspectsCount } from "../../services/redux/features/bidder-bids-count/linkedin-connects-count-slice";
import { setUsers } from "../../services/redux/features/all-company-users/all-company-users.slice";
import { DateProps, ROLE, UsersObject } from "../../services/types/common";
import { RootState } from "../../services/redux/store";
import { TABS, apis, defaultDates, useLoader } from "../../services";
import Layout from "../../components/layout";
import {
  setbidsCount,
  setTotalBidsCount,
  setBidsCountByProfile,
  setSecuredJobsCount,
  setBidsCountByCategory,
  setBidsCountByState,
  setLeadsCount,
  setTotalLeadsCount,
  setBidsCountByBidders,
  setInvitesCount,
  setBidsMonthlyReport,
  setInviteJobs,
  setDirectCount,
  setDirectContractsCount,
  setTotalContractsCount,
  setBidByResponseHourlyReport,
  setFunnelStats,
} from "../../services/redux/features/bidder-bids-count/bidder-bids-count-slice";
import { customNotification, TabsLabel } from '../../components';
import useDateFilter from "../../services/hooks/quick-date-filters";
import LinkedinTab from "./linkedin-tab";
import UpworkTab from "./upwork-tab";
import './dashboard.scss'
import dayjs from "dayjs";
import { DATE_OPTIONS } from "../../services/types/general";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";


const { RangePicker } = DatePicker;

const Dashboard = React.memo(({ user }: { user: UsersObject }) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeKey, setActiveKey] = useState<TABS | string>(searchParams.get("tab")! || TABS.UPWORK);
  const [date, setDate] = useState<DateProps>({
    startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : defaultDates.defaultStartDate,
    endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : defaultDates.defaultEndDate,
    selected: true,
  });

  const { dateOptions, handleDateOptionChange, handleCancelDateClick, getDateRangeOption } = useDateFilter(setDate);
  const [bidderId, setBidderId] = useState<string>((searchParams.get("business_developer") as string) ?? null);

  const { on, off, loading } = useLoader();

  const bidders = useSelector(
    (state: RootState) => state.companyAllUsers.users
  );

  const updateUrlParams = (params: { [key: string]: string; }) => {
    setSearchParams((prevParams) => {
      const newParams = { ...Object.fromEntries(prevParams.entries()), ...params };

      Object.keys(newParams).forEach((key) => {
        if (!newParams[key]) {
          delete newParams[key];
        }
      })

      return new URLSearchParams(newParams);
    });
  };

  const fetchBiddersProfilesData = async () => {
    try {
      if ((user.role === ROLE.COMPANY_ADMIN || user.role === ROLE.OWNER) && !bidders) {
        const { data: users } = await apis.getAllCompanyUsers();
        dispatch(setUsers(users?.users));
      }
    } catch (err: any) {
      console.error(err);
      customNotification.error(err?.response?.data?.message || 'An error occured in getting the dashboard! Please try again later')
    }
  };

  const getBidsCount = async (
    dateSelected: boolean = false,
    bidderId?: string
  ) => {
    try {
      on();
      const { data: bids } = await apis.countBiddersBids(
        dateSelected ? date : undefined,
        bidderId
      );
      dispatch(setbidsCount(bids?.bidsCount));
      dispatch(setTotalBidsCount(bids?.totalBidsCount));
      dispatch(setLeadsCount(bids?.leadsCount));
      dispatch(setTotalLeadsCount(bids?.totalLeadsCount));
      dispatch(setSecuredJobsCount(bids?.securedJobsCount));
      dispatch(setInvitesCount(bids?.invitesCount));
      dispatch(setInviteJobs(bids?.inviteJobs));
      dispatch(setDirectCount(bids?.directCount));
      dispatch(setDirectContractsCount(bids?.directContractsCount));
      dispatch(setTotalContractsCount(bids?.totalContractsCount));
      dispatch(setBidsCountByProfile(bids?.bidsCountByProfile ?? []));
      dispatch(setBidsCountByBidders(bids?.bidsCountByBidders ?? []));
      dispatch(setBidsCountByCategory(bids?.bidsCountByCategory ?? []));
      dispatch(setBidsCountByState(bids?.bidsCountByState ?? []));
      dispatch(setBidsMonthlyReport(bids?.bidsMonthlyReport ?? []));
      dispatch(setBidByResponseHourlyReport(bids?.bidsHourlyReport ?? []));
      dispatch(setFunnelStats(bids?.funnelStats ?? {}));

    } catch (err: any) {
      console.error(err);
      customNotification.error(err?.response?.data?.message || 'An error occured in getting the dashboard! Please try again later')
    } finally {
      off();
    }
  };

  const getLinkedinCount = async (
    dateSelected: boolean = false,
    bidderId?: string
  ) => {
    try {
      on();
      const { data } = await apis.getLinkedinStats(
        dateSelected ? date : undefined,
        bidderId
      );

      dispatch(setConnectsCount(data?.connectsCount ?? 0));
      dispatch(setProspectsCount(data?.prospectsCount ?? 0));
      dispatch(setConnectsCountByBusinessDeveloper(data?.connectsCountByBusinessDeveloper ?? []));
      dispatch(setIndustryConnectsCount(data?.industryConnectsCounts ?? []));
      dispatch(setConnectionsCountByState(data?.connectionsCountByState ?? []));
      dispatch(setConnectsCountByProfile(data?.connectsCountByProfile ?? []));
      dispatch(setMonthlyConnectionData(data?.monthlyConnectionData ?? []));
    } catch (err: any) {
      console.error(err);
      customNotification.error(err?.response?.data?.message || 'An error occured in getting the dashboard! Please try again later')
    } finally {
      off();
    }
  };

  const handleCancelGroupBidder = () => {
    setBidderId("");
    if (activeKey === TABS.UPWORK) getBidsCount(date.selected)
    else if (activeKey === TABS.LINKEDIN) getLinkedinCount(date.selected)
  };

  const handleChangeBidder = async (bidderId: string) => {
    setBidderId(bidderId);
    updateUrlParams({ business_developer: bidderId });
    if (activeKey === TABS.UPWORK) await getBidsCount(date.selected, bidderId)
    else if (activeKey === TABS.LINKEDIN) getLinkedinCount(date.selected, bidderId)
  };

  const handleDateRangeChange = (_: any, values: string[]) => {
    if (values[0] === '') {
      setDate({
        startDate: null,
        endDate: null,
        selected: false
      })
    } else {
      const newStartDate = moment(values[0]).toDate();
      const newEndDate = moment(values[1]).toDate();
      setDate({
        startDate: newStartDate,
        endDate: newEndDate,
        selected: true,
      });
    }
  }


  useEffect(() => {
    fetchBiddersProfilesData();
  }, []);

  useEffect(() => {
    if (activeKey === TABS.UPWORK) {
      getBidsCount(date.selected, bidderId);
    }
    else if (activeKey === TABS.LINKEDIN) {
      getLinkedinCount(date.selected, bidderId)
    }
    updateUrlParams({
      tab: activeKey,
      startDate: date.selected && date.startDate ? moment(date?.startDate).format('YYYY-MM-DD') : '',
      endDate: date.selected && date.endDate ? moment(date?.endDate).format('YYYY-MM-DD') : '',
    });
  }, [date, activeKey]);

  useEffect(() => {
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const tab = searchParams.get("tab");

    if (searchParams.has('business_developer')) {
      const bidderId = searchParams.get('business_developer');
      setBidderId(bidderId!);
      updateUrlParams({ business_developer: bidderId! });
    }

    if (
      startDateParam &&
      endDateParam &&
      !moment(startDateParam).isSame(moment(date.startDate).format('YYYY-MM-DD')) &&
      !moment(endDateParam).isSame(moment(date.endDate).format('YYYY-MM-DD'))
    ) {
      setDate({
        startDate: new Date(startDateParam),
        endDate: new Date(endDateParam),
        selected: true
      });
    }
    if (tab) setActiveKey(tab)
  }, [searchParams]);

  useEffect(() => {
    dispatch(setHeaderData({
      title: "Dashboard",
      tabs: (<Tabs
        defaultActiveKey={TABS.UPWORK}
        onChange={(key) => setActiveKey(key)}
        activeKey={activeKey}
        items={[
          {
            key: TABS.UPWORK,
            label: <TabsLabel
              title="Upwork"
              count={null}
              activeKey={activeKey === TABS.UPWORK ? TABS.UPWORK : null}
            />,
          },
          {
            key: TABS.LINKEDIN,
            label: <TabsLabel
              title="Linkedin"
              count={null}
              activeKey={activeKey === TABS.LINKEDIN ? TABS.LINKEDIN : null}
            />,
          }
        ]}
      />),
      date: {
        range: (
          <RangePicker
            value={
              [
                date.startDate ? dayjs(date.startDate) : null,
                date.endDate ? dayjs(date.endDate) : null
              ]
            }
            onChange={handleDateRangeChange}
            format="MMM DD, YYYY"
          />
        ),
        status: (
          <Select
            allowClear
            style={{ minWidth: '170px' }}
            placeholder="Select a date option"
            optionFilterProp="label"
            onChange={handleDateOptionChange}
            onClear={handleCancelDateClick}
            defaultValue={DATE_OPTIONS.THIS_MONTH}
            options={dateOptions}
            loading={loading}
            value={getDateRangeOption(date.startDate, date.endDate) || undefined}
          />
        )
      },
      select: (user?.role === ROLE.COMPANY_ADMIN || user?.role === ROLE.OWNER) && <Select
        allowClear
        showSearch
        style={{ minWidth: '220px' }}
        placeholder="Select Business Developer"
        optionFilterProp="label"
        value={bidderId}
        onChange={handleChangeBidder}
        onClear={handleCancelGroupBidder}
        options={bidders?.map((bidder: any) => ({ label: bidder?.name, value: bidder?.id }))}
        loading={loading}
      />
    }))
  }, [bidders, activeKey, date, bidderId, loading]);

  return (
    <Layout>
      {activeKey === TABS.UPWORK ? <UpworkTab
        bidderId={bidderId}
        user={user}
        loading={loading}
      /> :
        <LinkedinTab
          loading={loading}
          user={user}
        />
      }
    </Layout>
  );
});

export default Dashboard;