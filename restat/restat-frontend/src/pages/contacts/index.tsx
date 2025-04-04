import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import Layout from "../../components/layout";
import { IModal, apis, routes } from "../../services";
import {
  DateProps,
  SOURCE,
  ProfileSource,
  UsersObject,
  LINKEDIN_SUBTYPE,
} from "../../services/types/common";
import {
  setContacts,
  setContactsCount,
  setContactsPerPage,
} from "../../services/redux/features/contacts/contacts-slice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import { debounce } from "../../services/utils/debounce";
import { setUsers } from "../../services/redux/features/all-company-users/all-company-users.slice";
import { setLinkedInProfiles, setProfiles } from "../../services/redux/features/all-upwork-profiles/profiles.slice";
import { Cascader, CascaderProps, Space, Input, Pagination, PaginationProps, Table, Select, DatePicker, Button, notification } from "antd";
import { getContactsTableHeadings } from "../../services/constants/contacts";
import AccountLogDrawer from "../../components/drawer/account-log-drawer";
import ContactDetailsModal from "../../components/modals/contact-modal";
import { ActionButton, customNotification } from "../../components";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useDateFilter from "../../services/hooks/quick-date-filters";
import dayjs from "dayjs";
import moment from "moment";
import { DATE_OPTIONS } from "../../services/types/general";
import { setLinkedinIndustries } from "../../services/redux/features/linkedin/linkedin.slice";
import type { NotificationArgsProps } from 'antd';
import { generateExcel } from "../../services/utils/export-to-excel";
import { DownloadOutlined } from "@ant-design/icons";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";

type NotificationPlacement = NotificationArgsProps['placement'];


const Contacts = React.memo(({ user }: { user: UsersObject }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [showLeadLogs, setShowLeadLogs] = useState<IModal>({ show: false, id: '' })
  const [detailModal, setDetailModal] = useState<IModal>({ show: false, slug: '' })
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState<string>("");
  const [source, setSource] = useState<SOURCE[]>([]);
  const [linkedInType, setLinkedinType] = useState<LINKEDIN_SUBTYPE[]>([]);
  const [selectedUpworkProfiles, setSelectedUpworkProfiles] = useState<string[]>([]);
  const [selectedLinkedinProfiles, setSelectedLinkedinProfiles] = useState<string[]>([]);
  const [bidder, setBidder] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState<DateProps>({
    startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : null,
    endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : null,
    selected: searchParams.get("startDate") && searchParams.get("endDate") ? true : false,
  });

  const cascaderFilterArray = ['source', 'upwork_profile', 'linkedin_profile', 'business_developer', 'industries']

  const dispatch = useDispatch();
  const navigate = useNavigate()
  const { contactSlug } = useParams()

  const { Search } = Input
  const { RangePicker } = DatePicker;

  const { dateOptions, handleDateOptionChange, handleCancelDateClick, getDateRangeOption } = useDateFilter(setDate);

  const contacts = useSelector((state: RootState) => state.contacts.contacts);
  const contactsCount = useSelector(
    (state: RootState) => state.contacts.contactsCount
  );
  const contactsPerPage = useSelector(
    (state: RootState) => state.contacts.contactsPerPage
  );

  const bidders = useSelector(
    (state: RootState) => state.companyAllUsers.users
  );
  const upworkProfiles = useSelector((state: RootState) => state.companyAllUpworkProfiles.profiles);
  const linkedInProfiles = useSelector((state: RootState) => state.companyAllUpworkProfiles.linkedInProfiles);
  const linkedinIndustries = useSelector((state: RootState) => state.linkedin.linkedinIndustries);

  const updateUrlParams = (params: { [key: string]: string; }) => {
    setSearchParams((prevParams) => {
      const newParams = { ...Object.fromEntries(prevParams.entries()), ...params };

      Object.keys(newParams).forEach((key) => {
        if (!newParams[key] ||
          (key === "page" && newParams[key] === "1") ||
          (key === "per_page" && newParams[key] === "20")
        ) {
          delete newParams[key];
        }
      })

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

  const fetchData = async (
    { search, upworkProfile, linkedinProfile, bidder, source, linkedInType, industries, page, perPage, date }: {
      search: string,
      linkedInType: LINKEDIN_SUBTYPE[],
      source: SOURCE[],
      upworkProfile: string[],
      linkedinProfile: string[],
      bidder: string[],
      industries: string[],
      date: DateProps,
      page: number,
      perPage: number
    }
  ) => {
    try {
      setLoading(true);
      const { data } = await apis.getAllContacts(
        {
          search,
          source: source?.join(),
          linkedInType: linkedInType?.join(),
          upworkProfile: upworkProfile?.join(),
          linkedinProfile: linkedinProfile?.join(),
          bidder: bidder?.join(),
          dates: date.selected ? date : undefined,
          industries: industries?.join(),
          page,
          perPage
        }
      );

      setPage(data?.page)
      dispatch(setContacts(data?.contacts));
      dispatch(setContactsCount(data?.contactsCount));
      dispatch(setContactsPerPage(data?.contactsPerPage));
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      customNotification.error(err?.response?.data?.message || 'An error occured in fetching accounts! Please try again later')
    } finally {
      setLoading(false);
    }
  };

  const fetchBiddersProfilesData = async () => {
    try {
      if (!bidders) {
        const { data: users } = await apis.getAllCompanyUsers();
        dispatch(setUsers(users?.users));
      }
      const { data: profiles } = await apis.getAllCompanyUpworkProfiles(ProfileSource.UPWORK)
      dispatch(setProfiles(profiles.profiles))

      if (!linkedInProfiles.length) {
        const { data: profilesLinkedin } = await apis.getAllCompanyUpworkProfiles(ProfileSource.LINKEDIN)
        dispatch(setLinkedInProfiles(profilesLinkedin.profiles))
      }
    } catch (err: any) {
      customNotification.error(err?.response?.data?.message || 'An error occured! Please try again later')
    }
  };

  const fetchLinkedinIndustries = async () => {
    try {
      if (!linkedinIndustries.length) {
        const { data } = await apis.getLinkedinIndustries();
        dispatch(setLinkedinIndustries(data?.industries || []));
      }
    } catch (error: any) {
      console.error(error)
      customNotification.error(error?.response?.data?.message || 'An Error Occurred In Fetching Industries.')
    }
  };

  const debouncedSearch = useMemo(() => {
    return debounce(
      (
        query: string,
        source: SOURCE[],
        linkedInType: LINKEDIN_SUBTYPE[],
        upworkProfile: string[],
        linkedinProfile: string[],
        bidder: string[],
        page: number,
        contactsPerPage: number,
        industries: string[],
        date: DateProps
      ) => {
        if (query.length >= 3) {
          fetchData({
            search: query,
            source,
            linkedInType,
            upworkProfile,
            linkedinProfile,
            bidder,
            industries,
            page,
            perPage: contactsPerPage,
            date
          });
        }
      },
      300
    );
  }, []);

  const onChangeCascader: CascaderProps<any>['onChange'] = (value) => {

    if (!value.length) {
      setSource([])
      setLinkedinType([])
      setSelectedUpworkProfiles([])
      setSelectedLinkedinProfiles([])
      setBidder([])
      setIndustries([])
      setSearchParams((prevParams) => {
        const params = Object.fromEntries(prevParams.entries());
        delete params.source;
        delete params.linkedInType;
        delete params.upwork_profile
        delete params.linkedin_profile;
        delete params.business_developer;
        delete params.industries;
        return { ...params };
      });
      return
    }

    const grouped: { [key: string]: string[] } = value.reduce((acc, row, i) => {
      if (i === 0) {
        acc['source'] = []
        acc['linkedin_type'] = []
        acc['upwork_profile'] = []
        acc['linkedin_profile'] = []
        acc['business_developer'] = []
        acc['industries'] = []
      }

      if (row[0] === 'source') {
        if (row?.length === 3) {
          acc['linkedin_type'].push(row[2])
        }
        acc['source'].push(row[1])
      }
      if (row[0] === 'upwork_profile') {
        acc['upwork_profile'].push(row[1])
      }
      if (row[0] === 'linkedin_profile') {
        acc['linkedin_profile'].push(row[1])
      }
      if (row[0] === 'business_developer') {
        acc['business_developer'].push(row[1])
      }
      if (row[0] === 'industries') {
        acc['industries'].push(row[1])
      }

      return acc
    }, {})

    if (page > 1) {
      setPage(1);
    }

    if (grouped?.source) setSource(grouped.source as Array<SOURCE>)
    if (grouped?.linkedin_type) setLinkedinType(grouped.linkedin_type as Array<LINKEDIN_SUBTYPE>)
    if (grouped?.upwork_profile) setSelectedUpworkProfiles(grouped.upwork_profile as Array<string>)
    if (grouped?.linkedin_profile) setSelectedLinkedinProfiles(grouped.linkedin_profile as Array<string>)
    if (grouped?.business_developer) setBidder(grouped.business_developer as Array<string>)
    if (grouped?.industries) setIndustries(grouped.industries as Array<string>)

    updateUrlParams(
      Object.keys(grouped).map(key => ({ [key]: grouped[key].join(',') })).reduce((acc, row) => ({ ...acc, ...row }), {})
    )
  };

  const onPaginationChange: PaginationProps['onChange'] = (pageNumber) => {
    setPage(pageNumber)
    pageNumber === 1 && updateUrlParams({ page: "" });
  };

  const onPerPageChange: PaginationProps['onShowSizeChange'] = (_, pageSize) => {
    dispatch(setContactsPerPage(pageSize));
    updateUrlParams({ per_page: pageSize.toString() });
  }

  const handleViewLogsIcon = (id: string) => setShowLeadLogs({ show: true, id });
  const handleViewDetailsIcon = (slug: string) => {
    navigate(`${routes.contacts}/${slug}`)
    setDetailModal({ show: true, slug })
  }
  const handleCloseModal = () => {
    navigate(`${routes.contacts}`)
    setDetailModal({ show: false, id: '' })
  }

  const handleDateRangeChange = (_: any, values: string[]) => {
    if (values[0] === '') {
      setDate({
        startDate: null,
        endDate: null,
        selected: false
      });
    } else {
      setDate({
        startDate: moment(values[0]).toDate(),
        endDate: moment(values[1]).toDate(),
        selected: true
      });
    }
  }

  const openNotification = (placement: NotificationPlacement) => {
    notification.info({
      message: "Preparing Excel file",
      description: "Your Excel file is being prepared. Please wait...",
      duration: 0, // keeps the notification until manually closed or replaced
      placement
    });
  };

  useEffect(() => {
    const querySearch = searchParams.get("search") || "";
    const querySource = searchParams.get("source") ? searchParams.get("source")?.split(",") : [];
    const queryLinkedInType = searchParams.get("linkedin_type") ? searchParams.get("linkedin_type")?.split(",") : [];
    const upwork_profile = searchParams.get("upwork_profile") ? searchParams.get("upwork_profile")?.split(",") : [];
    const linkedin_profile = searchParams.get("linkedin_profile") ? searchParams.get("linkedin_profile")?.split(",") : [];
    const queryBusinessDeveloper = searchParams.get("business_developer") ? searchParams.get("business_developer")?.split(",") : [];
    const queryIndustries = searchParams.get("industries") ? searchParams.get("industries")?.split(",") : [];
    const queryStartDate = searchParams.get("startDate");
    const queryEndDate = searchParams.get("endDate");
    const queryPage = searchParams.get("page");
    const queryPerPage = searchParams.get("per_page");

    if (querySearch.length >= 3) setSearch(querySearch);
    if (querySource?.length) setSource(querySource as Array<SOURCE>);
    if (queryLinkedInType?.length) setLinkedinType(queryLinkedInType as Array<LINKEDIN_SUBTYPE>);
    if (upwork_profile?.length) setSelectedUpworkProfiles(upwork_profile);
    if (linkedin_profile?.length) setSelectedLinkedinProfiles(linkedin_profile);
    if (queryBusinessDeveloper?.length) setBidder(queryBusinessDeveloper);
    if (queryIndustries?.length) setIndustries(queryIndustries);
    if (queryPage) setPage(parseInt(queryPage));
    if (queryPerPage) dispatch(setContactsPerPage(parseInt(queryPerPage)));

    if (
      queryStartDate &&
      queryEndDate &&
      !moment(queryStartDate).isSame(moment(date.startDate).format('YYYY-MM-DD')) &&
      !moment(queryEndDate).isSame(moment(date.endDate).format('YYYY-MM-DD'))
    ) {
      setDate({
        startDate: new Date(queryStartDate),
        endDate: new Date(queryEndDate),
        selected: true
      });
    }

    if (
      querySearch.length >= 3 ||
      (querySource && querySource.length) ||
      (queryLinkedInType && queryLinkedInType.length) ||
      (upwork_profile && upwork_profile.length) ||
      (linkedin_profile && linkedin_profile.length) ||
      (queryIndustries && queryIndustries.length) ||
      (queryBusinessDeveloper && queryBusinessDeveloper.length) ||
      (queryStartDate && queryEndDate) ||
      queryPage ||
      queryPerPage
    ) {
      fetchData({
        search: querySearch,
        source: querySource as Array<SOURCE>,
        linkedInType: queryLinkedInType as Array<LINKEDIN_SUBTYPE>,
        upworkProfile: upwork_profile || [],
        linkedinProfile: linkedin_profile || [],
        bidder: queryBusinessDeveloper || [],
        industries: queryIndustries || [],
        date: {
          startDate: queryStartDate ? new Date(queryStartDate) : null,
          endDate: queryEndDate ? new Date(queryEndDate) : null,
          selected: true
        },
        page: queryPage ? parseInt(queryPage) : 1,
        perPage: queryPerPage ? parseInt(queryPerPage) : contactsPerPage
      });
    } else {
      fetchData({ search: "", source, linkedInType, upworkProfile: selectedUpworkProfiles, linkedinProfile: selectedLinkedinProfiles, bidder, industries, page, perPage: contactsPerPage, date });
    }
  }, [searchParams])

  useEffect(() => {
    updateUrlParams({
      startDate: date.selected && date.startDate ? moment(date?.startDate).format('YYYY-MM-DD') : '',
      endDate: date.selected && date.endDate ? moment(date?.endDate).format('YYYY-MM-DD') : '',
    })
  }, [date.startDate, date.endDate])

  useEffect(() => {
    if (contactsPerPage !== 20) {
      updateUrlParams({ per_page: contactsPerPage.toString() });
    }
    if (page !== 1) {
      updateUrlParams({ page: page.toString() });
    }
  }, [contactsPerPage, page]);

  useEffect(() => {
    if (search.length >= 3) {
      debouncedSearch(search, source, linkedInType, selectedUpworkProfiles, selectedLinkedinProfiles, bidder, page, contactsPerPage, industries, date);
    }
  }, [search, source, linkedInType, selectedUpworkProfiles, selectedLinkedinProfiles, bidder, industries, page, contactsPerPage, date]);

  useEffect(() => {
    if (search.length > 0 && search.length < 3) {
      fetchData({ search: "", source, linkedInType, upworkProfile: selectedUpworkProfiles, linkedinProfile: selectedLinkedinProfiles, bidder, industries, page, perPage: contactsPerPage, date });
    }
  }, [source, linkedInType, selectedUpworkProfiles, selectedLinkedinProfiles, bidder, industries, page, contactsPerPage, date]);

  useEffect(() => {
    fetchBiddersProfilesData();
    fetchLinkedinIndustries();
  }, []);

  useEffect(() => {
    if (contactSlug) {
      handleViewDetailsIcon(contactSlug);
    }
  }, [contactSlug]);

  useEffect(() => {
    dispatch(setHeaderData({
      title: "Contacts",
      actionButtons: [
        <ActionButton
          text="Export"
          tooltip="Export Contacts to Excel"
          onClick={() => handleDownload(contacts)}
          icon={<DownloadOutlined />}
        />,
      ],
      search: <Search
        size="middle"
        placeholder="Search anything"
        onChange={onChangeSearch}
        loading={loading}
        value={search}
      />,
      date: {
        range: <RangePicker
          value={
            [
              date.startDate ? dayjs(date.startDate) : null,
              date.endDate ? dayjs(date.endDate) : null
            ]
          }
          onChange={handleDateRangeChange}
          format="MMM DD, YYYY"
        />
        ,
        status: <Select
          allowClear
          style={{ minWidth: '170px' }}
          placeholder="Select a date option"
          optionFilterProp="label"
          onChange={handleDateOptionChange}
          onClear={handleCancelDateClick}
          defaultValue={DATE_OPTIONS.ALL_DATA}
          options={dateOptions}
          loading={loading}
          value={getDateRangeOption(date.startDate, date.endDate) || undefined}
        />
      },
      select: <Cascader
        allowClear
        options={options}
        expandTrigger="hover"
        dropdownStyle={{ maxHeight: 450, overflow: 'auto' }}
        style={{ minWidth: '320px' }}
        placeholder="Please select"
        placement="bottomLeft"
        onChange={onChangeCascader}
        multiple
        maxTagCount="responsive"
        defaultValue={
          Object.keys(Object.fromEntries(searchParams.entries())).map(key => {
            if (key === 'linkedin_type' && cascaderFilterArray.includes(key)) {
              return ['source', 'LINKEDIN', Object.fromEntries(searchParams.entries())[key]]
            } else if (cascaderFilterArray.includes(key)) {
              return [key, Object.fromEntries(searchParams.entries())[key]]
            } else {
              return []
            }
          })
        }
      />
    }));
  }, [bidders, upworkProfiles, linkedInProfiles, linkedinIndustries, search, date, loading]);

  const options = useMemo(() => [
    {
      value: 'source',
      label: <b style={{ color: '#08c', fontWeight: 'bold' }}>Source</b>,
      children: Object.keys(SOURCE).length && [
        ...Object.keys(SOURCE).map((type: any) => ({
          label: type,
          value: type,
          children: type === 'LINKEDIN'
            ? Object.keys(LINKEDIN_SUBTYPE).map((subType: any) => ({
              label: subType,
              value: subType
            }))
            : []
        }))
      ],
    },
    upworkProfiles?.length && {
      value: 'upwork_profile',
      label: <b style={{ color: '#08c', fontWeight: 'bold' }}>Upwork Profile</b>,
      children: upworkProfiles?.length && [
        ...upworkProfiles.map((profile: any) => ({ label: profile?.name || profile?.profileName, value: profile?.id }))
      ],
    },
    linkedInProfiles?.length && {
      value: 'linkedin_profile',
      label: <b style={{ color: '#08c', fontWeight: 'bold' }}>LinkedIn Profile</b>,
      children: linkedInProfiles?.length && [
        ...linkedInProfiles.map((profile: any) => ({ label: profile?.name || profile?.profileName, value: profile?.id }))
      ],
    },
    bidders?.length && {
      value: 'business_developer',
      label: <b style={{ color: '#08c', fontWeight: 'bold' }}>Business Developer</b>,
      children: bidders?.length && [
        ...bidders.map((profile: any) => ({ label: profile?.name, value: profile?.id }))
      ],
    },
    linkedinIndustries?.length && {
      value: 'industries',
      label: <b style={{ color: '#08c', fontWeight: 'bold' }}>Industry</b>,
      children: linkedinIndustries?.length && [
        ...linkedinIndustries.map((industry: any) => ({ label: industry?.name, value: industry?.id }))
      ],
    },
  ].filter(Boolean), [upworkProfiles, bidders, linkedInProfiles, linkedinIndustries])

  const handleDownload = async (contacts: any) => {
    openNotification('bottomRight');

    const excelBlob = await generateExcel({
      search,
      source,
      linkedInType,
      upworkProfile: selectedUpworkProfiles,
      linkedinProfile: selectedLinkedinProfiles,
      bidder,
      industries,
      date
    });
    notification.destroy();
    if (!excelBlob) {
      notification.error({
        message: "We encountered an unexpected error while exporting your file, please try again later!"
      })
    }

    notification.success({
      message: "Excel Ready",
      description: "Your Excel file is ready to download.",
      btn: (
        <Button
          type="primary"
          style={{ backgroundColor: "#1A4895" }}
          onClick={() => {
            const url = window.URL.createObjectURL(excelBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Restat_Contacts_Export_${new Date().toISOString().split("T")[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          Download Now
        </Button>
      )
    });
  };

  return (
    <>
      <Layout>
        <div className="flex justify-between items-center flex-col gap-3">
          <Table
            className="custom-table"
            columns={getContactsTableHeadings(handleViewLogsIcon, handleViewDetailsIcon)}
            dataSource={contacts ?? []}
            pagination={false}
            scroll={{ x: 1500, y: 'calc(100vh - 16.3rem)' }}
            size="large"
            loading={loading}
          />
          {contactsCount ? <Space direction="horizontal" size={12} className="justify-center">
            <Pagination
              showQuickJumper
              total={contactsCount}
              defaultCurrent={page}
              current={page}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              onChange={onPaginationChange}
              defaultPageSize={contactsPerPage}
              pageSize={contactsPerPage}
              onShowSizeChange={onPerPageChange}
            />
          </Space> : null}
        </div>
        {
          showLeadLogs.show && (
            <AccountLogDrawer
              onClose={() => setShowLeadLogs({ show: false, id: '' })}
              open={showLeadLogs.show}
              id={showLeadLogs?.id!}
            />
          )
        }
      </Layout>
      <ContactDetailsModal modal={detailModal} handleCloseModal={handleCloseModal} />
    </>
  );
});

export default Contacts;
