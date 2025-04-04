
import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Select, Checkbox, Popconfirm, Input, DatePicker } from "antd";
import { RootState } from "../../../services/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { Filters_Type, ProfileSource, Status_Type } from "../../../services/types/common";
import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import Dot from "../../../common/icons/dot";
import { formatLabel, statusFormatLabel } from "./helpers";
import { addMaxBudget, addMinBudget, addProposedRate, addRecievedRate, removeBidder, removeDates, removeLocation, removeMaxBudget, removeMinBudget, removeProfile, removeProposedRate, removeReceivedRate, removeSearch, removeSkill, removeStatus, removeType, resetFilters, setDateRanges, setFilters, setSearch } from "../../../services/redux/features/page-header/filter.slice";
import { setUsers } from "../../../services/redux/features/all-company-users/all-company-users.slice";
import { apis, routes } from "../../../services";
import { setProfiles } from "../../../services/redux/features/all-upwork-profiles/profiles.slice";
import customNotification from "../../notification";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DealsTabsEnum } from "../../../pages/deals/types";
import countries from "../../../assets/countries";
import dayjs from "dayjs";
import './index.scss'

interface IDealFilters {
  open: boolean;
  onClose: () => void;
}
const { RangePicker } = DatePicker;

const DealFilters: React.FC<IDealFilters> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Redux state
  const filters = useSelector((state: RootState) => state.filters);
  const [tagsOptions, setTagsOptions] = useState<{ label: string; value: string }[]>([]);
  const upworkProfiles = useSelector((state: RootState) => state.companyUpworkProfiles.profiles);
  const bidders = useSelector((state: RootState) => state.companyAllUsers.users);
  const [searchParams, setSearchParams] = useSearchParams();
  const { clientBudgetMin, clientBudgetMax, proposedRate, receivedRate } = useSelector(
    (state: RootState) => state.filters
  );

  const handleBudgetChange = (type: "min" | "max", value: string) => {
    const numericValue = value ? parseFloat(value) : 0;
    if (type === "min") {
      dispatch(addMinBudget(numericValue));
    } else {
      dispatch(addMaxBudget(numericValue));
    }
  };

  // Handle changes for rate range
  const handleRateChange = (type: "proposed" | "received", value: string) => {
    const numericValue = value ? parseFloat(value) : 0;
    if (type === "proposed") {
      dispatch(addProposedRate(numericValue));
    } else {
      dispatch(addRecievedRate(numericValue));
    }
  };


  const handleDateChange = (key: "proposal" | "lead" | "contract") =>
    (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null, dateStrings: [string, string]) => {
      const [start, end] = dates || [null, null];

      // Construct action payload dynamically
      const actionPayload: Record<string, string | undefined> = {
        [`${key}StartDate`]: start ? start.toISOString() : undefined,
        [`${key}EndDate`]: end ? end.toISOString() : undefined,
      };

      // Dispatch the Redux action to update the date ranges
      dispatch(setDateRanges(actionPayload));
    };

  // Memoized options
  const profileOptions = useMemo(
    () => upworkProfiles?.map((profile: any) => ({ label: profile.name, value: profile.id })) || [],
    [upworkProfiles]
  );

  const bidderOptions = useMemo(
    () => bidders?.map((bidder: any) => ({ label: bidder.name, value: bidder.id })) || [],
    [bidders]
  );

  const typeOptions = useMemo(
    () =>
      Object.keys(Filters_Type).map((key) => ({
        label: formatLabel(Filters_Type[key as keyof typeof Filters_Type]),
        value: Filters_Type[key as keyof typeof Filters_Type],
      })),
    [Filters_Type]
  );


  const statusOptions = useMemo(
    () =>
      Object.keys(Status_Type).map((key) => ({
        label: statusFormatLabel(Status_Type[key as keyof typeof Status_Type]),
        value: Status_Type[key as keyof typeof Status_Type],
      })),
    [Status_Type]
  );

  const fetchBiddersProfilesData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      customNotification.error(
        error?.response?.data?.message ?? "An Error Occurred"
      );
    }
  };

  const fetchTagsData = async () => {
    try {
      // Call the API and pass the required query parameters
      setLoading(true);
      const { data: tagsResponse } = await apis.getSkillsTags("", 1, ""); // Add search, page, or tags values as needed
      const formattedTags =
        tagsResponse?.tags?.map((tag: any) => ({
          label: tag.name,
          value: tag.id,
        })) || [];
      setTagsOptions([{ label: "All", value: "all" }, ...formattedTags]);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      customNotification.error(
        error?.response?.data?.message ?? "An Error Occurred"
      );
    }
  };

  useEffect(() => {
    fetchTagsData();
  }, []);

  const updateUrlParams = (paramDefault: { [key: string]: string } = {}) => {
    const params: { [key: string]: string } = { ...paramDefault };

    // Update URL params for each filter
    if (filters.selectedUpworkProfiles.length) {
      params.upwork_profiles = filters.selectedUpworkProfiles.join(",");
    } else {
      params.upwork_profiles = "";
    }

    if (filters.selectedBusinessDevelopers.length) {
      params.business_developer = filters.selectedBusinessDevelopers.join(",");
    } else {
      params.business_developer = "";
    }

    if (filters.selectedTypes.length) {
      params.type = filters.selectedTypes.join(",");
    } else {
      params.type = "";
    }

    if (filters.selectedStatus.length) {
      params.status = filters.selectedStatus.join(",");
    } else {
      params.status = "";
    }

    if (filters.clientBudgetMin !== undefined) {
      params.client_budget_min = filters.clientBudgetMin.toString();
    } else {
      params.client_budget_min = "";
    }

    if (filters.clientBudgetMax !== undefined) {
      params.client_budget_max = filters.clientBudgetMax.toString();
    } else {
      params.client_budget_max = "";
    }

    if (filters.proposedRate !== undefined) {
      params.proposed_rate = filters.proposedRate.toString();
    } else {
      params.proposed_rate = "";
    }

    if (filters.receivedRate !== undefined) {
      params.received_rate = filters.receivedRate.toString();
    } else {
      params.received_rate = "";
    }

    if (filters.leadStartDate) {
      params.lead_start_date = filters.leadStartDate;
    } else {
      params.lead_start_date = "";
    }

    if (filters.leadEndDate) {
      params.lead_end_date = filters.leadEndDate;
    } else {
      params.lead_end_date = "";
    }

    if (filters.proposalStartDate) {
      params.proposal_start_date = filters.proposalStartDate;
    } else {
      params.proposal_start_date = "";
    }

    if (filters.proposalEndDate) {
      params.proposal_end_date = filters.proposalEndDate;
    } else {
      params.proposal_end_date = "";
    }

    if (filters.contractStartDate) {
      params.contract_start_date = filters.contractStartDate;
    } else {
      params.contract_start_date = "";
    }

    if (filters.contractEndDate) {
      params.contract_end_date = filters.contractEndDate;
    } else {
      params.contract_end_date = "";
    }

    if ((filters.location ?? []).length) {
      params.location = (filters.location ?? []).join(",");
    } else {
      params.location = "";
    }

    if (filters.skillset && filters.skillset.length) {
      params.skillset = filters.skillset.join(",");
    } else {
      params.skillset = "";
    }

    if (filters.search) {
      params.search = filters.search;
    } else {
      params.search = "";
    }

    // Get current parameters from the URL and merge with the new params
    const currentParams = Object.fromEntries(searchParams.entries());
    const newParams = {
      ...currentParams,
      ...params,
    };

    // Remove empty, default, or unnecessary parameters
    Object.keys(newParams).forEach((key) => {
      if (
        !newParams[key] || // Remove empty or falsy values
        key === "page" ||  // Explicitly remove 'page'
        key === "per_page" // Explicitly remove 'per_page'
      ) {
        delete newParams[key];
      }
    });

    // Update the search parameters in the URL
    setSearchParams(newParams);

    // Construct the query string and navigate to /deals
    const searchParamsString = new URLSearchParams(newParams).toString();
    const urlWithParams = `${routes.deals}?${searchParamsString}`;

    // Navigate to the updated /deals URL with the new query parameters
    navigate(urlWithParams);
  };

  const handleApplyFilters = () => {
    if ((clientBudgetMin && clientBudgetMax) && clientBudgetMin > clientBudgetMax) {
      customNotification.error("Minimum budget cannot be greater than maximum budget");
      return;
    }
    // Update URL with Redux filters
    updateUrlParams({ activeTab: DealsTabsEnum.ALL });
    onClose();
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
    setSearchParams({})
  };

  useEffect(() => {
    fetchBiddersProfilesData();
  }, []);


  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      width={900}
      className="p-4"
      style={{
        top: 90,
        right: 0,
        margin: 0,
        position: "absolute",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-4">
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          />
          <h5 className="text-xl text-opacity-30">Filters</h5>
        </div>
        <div className="flex items-center gap-4">
          <Popconfirm
            title="Reset Filters"
            description="Are you sure you want to reset all filters?"
            placement="top"
            okText="Yes, Reset"
            cancelText="Cancel"
            okButtonProps={{
              style: { backgroundColor: "#f5222d", color: "white" },
            }}
            onConfirm={handleClearFilters}
            overlayClassName="custom-popconfirm"
            getPopupContainer={() => document.body}
          >
            <Button
              className="ml-2 px-4 py-2"
              style={{
                color: "#0794EC",
                fontSize: "10px",
                border: "none",
                boxShadow: "none",
              }}
            >
              Reset Filters
            </Button>
          </Popconfirm>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 flex flex-col justify-between item-center "  >
        <div className="flex items-center gap-4 flex-row text-[10px] justify-start">
          {/* Profile and Account */}
          <div className="gap-2 flex flex-row items-center">
            <Dot color="#EB2F96" />
            <span className="font-medium text-[#000000] mr-6">Profile and Account</span>
          </div>
          {/* Upwork Profile */}
          <div className="block gap-1">
            <span className="font-medium text-black text-opacity-60">Upwork Profile:</span>&nbsp;
            <Select
              mode="multiple"
              allowClear
              placeholder="All"
              options={[{ label: "All", value: "all" }, ...profileOptions]}
              value={filters.selectedUpworkProfiles}
              onChange={(values) =>
                dispatch(
                  setFilters({
                    selectedUpworkProfiles: values.includes("all")
                      ? profileOptions.map((opt: any) => opt.value)
                      : values,
                  })
                )
              }
              className="w-full"
              showSearch
              style={{
                width: "160px",
                height: "32px",
                fontSize: "10px",
              }}
              tagRender={() => <></>}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />

          </div>

          {/* Business Developer */}
          <div className="block">
            <span className="font-medium text-black text-opacity-60 ml-4"> Business Developer: </span>&nbsp;
            <Select
              mode="multiple"
              allowClear
              placeholder="All"
              options={[{ label: "All", value: "all" }, ...bidderOptions]}
              value={filters.selectedBusinessDevelopers}
              onChange={(values) =>
                dispatch(
                  setFilters({
                    selectedBusinessDevelopers: values.includes("all")
                      ? bidderOptions.map((opt: any) => opt.value)
                      : values,
                  })
                )
              }
              className="w-full"
              style={{
                width: "160px",
                height: "32px",
                fontSize: "10px",
              }}
              showSearch
              tagRender={() => <></>}
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />

          </div>
        </div>
        {/* Type */}
        <div className="mt-4 flex flex-wrap items-center">
          <div className="w-full">
            <div className="gap-12 flex flex-row justify-start items-center">
              <div className="gap-2 flex flex-row items-center">
                <Dot color="#13C2C2" />
                <div className="font-medium text-[#000000] text-[10px] mr-12">Type</div>
              </div>
              <Checkbox.Group
                options={typeOptions.map((option) => ({
                  label: (
                    <span className="text-[10px] text-black text-opacity-60">
                      {option.label}
                    </span>
                  ),
                  value: option.value,
                }))}
                value={filters.selectedTypes}
                onChange={(values) => dispatch(setFilters({ selectedTypes: values as string[] }))}
                className="flex flex-row gap-4 justify-start ml-6"
              />
            </div>
          </div>
        </div>
        {/* Status */}
        <div className="mt-4 flex flex-wrap items-center">
          <div className="w-full">
            <div className="gap-12 flex flex-row justify-start items-center">
              {/* Dot and Label */}
              <div className="gap-2 flex flex-row items-center">
                <Dot color="#2F54EB" />
                <div className="font-medium text-[#000000] text-[10px] mr-10">Status</div>
              </div>

              {/* Checkbox Group */}
              <Checkbox.Group
                options={statusOptions.map((option: any) => ({
                  label: (
                    <span className="text-[10px] text-black text-opacity-60">
                      {option.label}
                    </span>
                  ),
                  value: option.value,
                }))}
                value={filters.selectedStatus}
                onChange={(values) => dispatch(setFilters({ selectedStatus: values as string[] }))}
                className="flex flex-row gap-4 justify-start ml-6"
              />
            </div>
          </div>
        </div>
        {/* Budget & Rate */}
        <div className="flex gap-4 items-center mt-2">
          {/* Client Budget */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex flex-row gap-2 items-center justify-between">
              <Dot color="#FA8C16" />
              <span className="font-medium text-[10px] text-[#000000]">Budget and Rate</span>
            </div>
            <div className="flex flex-row justify-between items-center gap-2 ml-12">
              <Input
                style={{
                  width: 50,
                  height: "32px",
                  fontSize: "10px",
                  appearance: 'textfield',
                  WebkitAppearance: 'none',
                }}
                type="number"
                value={clientBudgetMin}
                onChange={(e) => handleBudgetChange("min", e.target.value)}
              />
              <span className="text-[10px] font-medium text-[#000000]">to</span>
              <Input
                style={{
                  width: 50,
                  height: "32px",
                  fontSize: "10px",
                  appearance: 'textfield',
                  WebkitAppearance: 'none',
                }}
                value={clientBudgetMax}
                onChange={(e) => handleBudgetChange("max", e.target.value)}
                type="number"
              />
            </div>
            {/* Proposed Rate */}
            <div className="flex items-center gap-2">
              <span className="text-[10px]  text-[#00000099]">Proposed Rate:</span>
              <Input
                style={{ width: 180, fontSize: "10px", height: "32px" }}
                placeholder="Enter Proposed rate"
                type="number"
                value={proposedRate}
                onChange={(e) => handleRateChange("proposed", e.target.value)}
              />
            </div>
            {/* Received Rate */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#00000099]">Received Rate:</span>
              <Input
                style={{ width: 180, fontSize: "10px" }}
                placeholder="Enter Received Rate"
                type="number"
                value={receivedRate}
                onChange={(e) => handleRateChange("received", e.target.value)}
              />
            </div>
          </div>
          <div></div>
        </div>


        {/* Date Ranges*/}
        <div className="flex flex-wrap  flex-row gap-4 items-center mt-2">
          {/* Date Range Pickers */}
          <div className="flex flex-row flex-wrap gap-4">
            {/* Header with Dot */}
            <div className="flex flex-row items-center gap-2 ">
              <Dot color="#52C41A" />
              <span className="font-medium text-[10px] text-[#000000]">Date Ranges</span>
            </div>
            {/* Proposal Date */}
            <div className="flex items-center gap-2 ml-16">
              <span className="text-[10px] text-opacity-60 text-[#000000]">Proposal Date:</span>
              <RangePicker
                onChange={handleDateChange("proposal")}
                className="custom-placeholder"
                style={{
                  height: '32px',
                  fontSize: '8px', // This sets the font size for the input text
                  width: '260px',
                }}
                placeholder={['Start Date', 'End Date']}
                format="MMM DD, YYYY"
              />
            </div>
            {/* Lead Date */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-opacity-60 text-[#000000]">Lead Date:</span>
              <RangePicker
                onChange={handleDateChange("lead")}
                className="custom-placeholder"
                style={{ height: '32px', fontSize: '8px', width: '260px' }}
                placeholder={['Start Date', 'End Date']}
                format="MMM DD, YYYY"
              />
            </div>

            {/* Contract Date */}
            <div className="flex items-center gap-2 ml-40">
              <span className="text-[10px] text-opacity-60 text-[#000000] ml-2">Contract Date:</span>      <RangePicker
                onChange={handleDateChange("contract")}
                className="custom-placeholder"
                style={{ height: '32px', fontSize: '8px', width: '260px' }}
                placeholder={['Start Date', 'End Date']}
                format="MMM DD, YYYY"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {/* Location */}
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2">
              <Dot color="#722ED1" />
              <span className="font-medium text-[#000000] text-[10px] ">Location</span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-opacity-60 text-[#000000] text-[10px] ml-12">Country:</span>
              <Select
                style={{ width: 150, fontSize: '10px', height: '32px' }}
                dropdownStyle={{ fontSize: '8px' }}
                showSearch={true}
                filterOption={(input, option) => {
                  if (typeof option?.label === 'string') {
                    return option?.label.toLowerCase().includes(input.toLowerCase());
                  }
                  return false;
                }}
                className=".ant-select-item"
                mode="multiple"
                tagRender={() => <></>}
                onChange={(values) => {
                  dispatch(setFilters({ location: values as string[] }));
                }}
                options={countries.map((country) => ({
                  label: country.name,
                  value: country.name
                }))}
              />
            </div>
          </div>

          {/* Skillset */}
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2">
              <Dot color="#A0D911" />
              <span className="font-medium text-[#000000] text-[10px] ">Skillset</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-opacity-60 text-[#000000] text-[10px] ml-16">Skills:</span>
              <Select
                mode="multiple"
                placeholder="All"
                style={{ width: 150, fontSize: "10px", height: "32px" }}
                dropdownStyle={{ fontSize: "10px" }}
                options={tagsOptions}
                value={filters.skillset}
                onChange={(values) => {
                  const selectedIds = values.includes("all")
                    ? tagsOptions.map((opt: any) => opt.value)
                    : values;
                  dispatch(setFilters({ skillset: selectedIds }));
                }}
                showSearch
                tagRender={() => <></>}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2">
              <Dot color="#BFBFBF" />
              <span className="font-medium text-[#000000] text-[10px]">Search</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-opacity-60 text-[#000000] text-[10px] ml-16">Search:</span>
              <Input
                placeholder="Search anything"
                style={{
                  width: 250,
                  fontSize: '10px',
                  height: '32px',
                }}
                suffix={<SearchOutlined />}
                value={filters.search || ''} // Bind input value to the Redux state
                onChange={(e) => dispatch(setSearch(e.target.value))} // Update Redux state on change
              />
            </div>
          </div>
        </div>
      </div>
      {/* Line */}
      <hr className="my-4 border-gray-300" style={{ border: "1px solid #D9D9D966" }} />
      {/* Selected Tags */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-6">
          {/* Profile Tags */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Profile:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.selectedUpworkProfiles.slice(0, 5).map((id) => (
                <span
                  key={id}
                  style={{
                    border: "1px solid #EB2F96",
                    color: "#EB2F96",
                    padding: "4px 8px",
                    fontSize: "10px"
                  }}
                >
                  {
                    loading ? "Loading..." :
                      profileOptions.find((option: any) => option.value === id)?.label || id
                  }
                  <button
                    onClick={() => dispatch(removeProfile(id))}
                    style={{
                      marginLeft: "8px",
                      color: "#EB2F96",
                      cursor: "pointer",
                      fontSize: "10px"
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {filters.selectedUpworkProfiles.length > 5 && (
                <span
                  style={{
                    color: "#EB2F96",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "10px"
                  }}
                  onClick={() => alert('Show more profiles (if applicable)')}
                >
                  +{filters.selectedUpworkProfiles.length - 5} more
                </span>
              )}
            </div>
          </div>

          {/* Business Developer Tags */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Business Developer:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.selectedBusinessDevelopers.slice(0, 5).map((id) => (
                <span
                  key={id}
                  style={{
                    color: "#EB2F96",
                    border: "1px solid #EB2F96",
                    padding: "4px 8px",
                    fontSize: "10px"
                  }}
                >
                  {
                    loading ? "Loading..." :
                      bidderOptions.find((option: any) => option.value === id)?.label || id
                  }
                  <button
                    onClick={() => dispatch(removeBidder(id))}
                    style={{
                      marginLeft: "8px",
                      color: "#EB2F96",
                      cursor: "pointer",
                      fontSize: "10px"
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {filters.selectedBusinessDevelopers.length > 5 && (
                <span
                  style={{
                    color: "#EB2F96",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "10px"
                  }}
                  onClick={() => alert('Show more business developers (if applicable)')}
                >
                  +{filters.selectedBusinessDevelopers.length - 5} more
                </span>
              )}
            </div>
          </div>
          {/* */}
          {/*Client Budget */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Client Budget:</h4>
            <div className="flex flex-wrap gap-2">
              {(filters.clientBudgetMin || filters.clientBudgetMax) && (
                <span
                  style={{
                    color: "#FA8C16",
                    border: "1px solid #FA8C1680",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {" "}
                  {filters.clientBudgetMin?.toFixed(2)}-${filters.clientBudgetMax?.toFixed(2)}
                  <button
                    onClick={() => {
                      dispatch(removeMinBudget());
                      dispatch(removeMaxBudget());
                    }}
                    style={{
                      marginLeft: "8px",
                      color: "#FA8C16",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>

          {/*Proposed Rate */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30"> Proposed Rate:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.proposedRate && (
                <span
                  style={{
                    color: "#1890FF",
                    border: "1px solid #1890FF80",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {filters.proposedRate.toFixed(2)}/hr
                  <button
                    onClick={() => dispatch(removeProposedRate())}
                    style={{
                      marginLeft: "8px",
                      color: "#1890FF",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* SkillSet:*/}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">SkillSet:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.skillset?.slice(0, 5).map((id) => (
                <span
                  key={id}
                  style={{
                    color: "#A0D911",
                    border: "1px solid #A0D91180",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {
                    loading ? "Loading..." :
                      tagsOptions.find((option) => option.value === id)?.label || id
                  }
                  <button
                    onClick={() => dispatch(removeSkill(id))}
                    style={{
                      marginLeft: "8px",
                      color: "#A0D911",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {(filters.skillset?.length ?? 0) > 5 && (
                <span
                  style={{
                    color: "#A0D911",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "10px",
                  }}
                  onClick={() => alert('Show more skillsets (if applicable)')}
                >
                  +{(filters.skillset?.length ?? 0) - 5} more
                </span>
              )}
            </div>
          </div>

          {/* Received Rate:*/}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Received Rate: </h4>
            <div className="flex flex-wrap gap-2">
              {filters.receivedRate && (
                <span
                  style={{
                    color: "#52C41A",
                    border: "1px solid #52C41A80",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {filters.receivedRate.toFixed(2)}/hr
                  <button
                    onClick={() => dispatch(removeReceivedRate())}
                    style={{
                      marginLeft: "8px",
                      color: "#52C41A",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div >

          {/* proposal date */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Proposal Date:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.proposalStartDate && (
                <span
                  style={{
                    color: "#52C41A",
                    border: "1px solid #52C41A80",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {dayjs(filters.proposalStartDate).format("MMM DD, YYYY")} -{" "}
                  {dayjs(filters.proposalEndDate).format("MMM DD, YYYY")}
                  <button
                    onClick={() => dispatch(removeDates("proposal"))}
                    style={{
                      marginLeft: "8px",
                      color: "#52C41A",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Lead Date */}

          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Lead Date:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.leadStartDate && (
                <span
                  style={{
                    color: "#52C41A",
                    border: "1px solid #52C41A80",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {dayjs(filters.leadStartDate).format("MMM DD, YYYY")} -{" "}
                  {dayjs(filters.leadEndDate).format("MMM DD, YYYY")}
                  <button
                    onClick={() => dispatch(removeDates("lead"))}
                    style={{
                      marginLeft: "8px",
                      color: "#52C41A",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Contract Date */}

          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Contract Date:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.contractStartDate && (
                <span
                  style={{
                    color: "#52C41A",
                    border: "1px solid #52C41A80",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {dayjs(filters.contractStartDate).format("MMM DD, YYYY")} -{" "}
                  {dayjs(filters.contractEndDate).format("MMM DD, YYYY")}
                  <button
                    onClick={() => dispatch(removeDates("contract"))}
                    style={{
                      marginLeft: "8px",
                      color: "#52C41A",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Location*/}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30"> Location:</h4>
            <div className="flex flex-wrap gap-2">
              {(filters.location ?? []).length > 0 && (filters.location ?? []).map((loc) => (
                <span
                  key={loc}
                  style={{
                    color: "#722ED1",
                    border: "1px solid #722ED180",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {loc}
                  <button
                    onClick={() => dispatch(removeLocation(loc))}
                    style={{
                      marginLeft: "8px",
                      color: "#722ED1",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
          {/* Search*/}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Search:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.search && filters.search.trim() && ( // Ensure search term is not empty
                <span
                  style={{
                    color: "#722ED1",
                    border: "1px solid #722ED180",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {filters.search}
                  <button
                    onClick={() => dispatch(removeSearch())} // Clear search term
                    style={{
                      marginLeft: "8px",
                      color: "#722ED1",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Selected Types */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Type:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.selectedTypes.map((type) => (
                <span
                  key={type}
                  style={{
                    color: "#13C2C2",
                    border: "1px solid #13C2C280",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {type}
                  <button
                    onClick={() => dispatch(removeType
                      (type))}
                    style={{
                      marginLeft: "8px",
                      color: "#13C2C2",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Selected Status */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <h4 className="text-[10px] text-opacity-30">Status:</h4>
            <div className="flex flex-wrap gap-2">
              {filters.selectedStatus.map((status) => (
                <span
                  key={status}
                  style={{
                    color: "#2F54EB",
                    border: "1px solid #2F54EB80",
                    padding: "4px 8px",
                    fontSize: "10px",
                  }}
                >
                  {status}
                  <button
                    onClick={() => dispatch(removeStatus(status))}
                    style={{
                      marginLeft: "8px",
                      color: "#2F54EB",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className="my-4 border-gray-300" style={{ border: "1px solid #D9D9D966" }} />
      <Button
        type="primary"
        onClick={handleApplyFilters}
        style={{
          backgroundColor: "#0794EC",
          borderColor: "#0794EC",
          color: "white",
          borderRadius: "0px",
          width: "100%"
        }}
        className="hover:bg-blue-500 text-white px-4 py-2 border-none"
        block
      >
        Apply
      </Button>
    </Modal>
  );
};

export default DealFilters;