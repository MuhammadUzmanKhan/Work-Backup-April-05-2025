import { useState } from "react";
import { LicensePlatesTab } from "./LicensePlateTab";
import { LicensePlateClips } from "./LicensePlateClips";
import {
  SearchFilterState,
  SearchFilterContext,
  INITIAL_SEARCH_FILTER_STATE,
  useInitializeSearchFilter,
} from "utils/search_filter";
import { TAB_STYLE, TabItem } from "pages/analytics/utils";
import CustomTabView from "../CustomTabView";
import {
  LicensePlateResponse,
  isDefined,
  useCamerasList,
} from "coram-common-utils";
import { DateTime } from "luxon";
import { TimeInterval } from "utils/time";

export enum LicensePlateSubTab {
  AllLicensePlates = "All License Plates",
  LicensePlatesOfInterest = "License Plates of Interest",
}

export function LicensePlatesDefaultView() {
  const [selectedLicensePlate, setSelectedLicensePlate] = useState<
    LicensePlateResponse | undefined
  >();
  const [selectedLicensePlateOfInterest, setSelectedLicensePlateOfInterest] =
    useState<LicensePlateResponse | undefined>();

  const [selectedSubTab, setSelectedSubTab] = useState<LicensePlateSubTab>(
    LicensePlateSubTab.AllLicensePlates
  );

  const [filter, setFilter] = useState<SearchFilterState>(
    INITIAL_SEARCH_FILTER_STATE
  );
  const { isLoading: isLoadingCameras, data: cameras } = useCamerasList({
    refetchOnWindowFocus: false,
  });

  const tabData: TabItem[] = [
    {
      label: "All License Plates",
      value: LicensePlateSubTab.AllLicensePlates,
      component: isDefined(selectedLicensePlate) ? (
        <LicensePlateClips
          cameras={cameras}
          selectedLicensePlate={selectedLicensePlate}
          setSelectedLicensePlate={setSelectedLicensePlate}
        />
      ) : (
        <LicensePlatesTab
          setSelectedLicensePlate={setSelectedLicensePlate}
          isLicensePlateOfInterest={false}
        />
      ),
    },
    {
      label: "License Plates of Interest",
      value: LicensePlateSubTab.LicensePlatesOfInterest,
      component: isDefined(selectedLicensePlateOfInterest) ? (
        <LicensePlateClips
          cameras={cameras}
          selectedLicensePlate={selectedLicensePlateOfInterest}
          setSelectedLicensePlate={setSelectedLicensePlateOfInterest}
        />
      ) : (
        <LicensePlatesTab
          setSelectedLicensePlate={setSelectedLicensePlateOfInterest}
          isLicensePlateOfInterest={true}
        />
      ),
    },
  ];

  const initialTimeInterval: TimeInterval = {
    timeStart: DateTime.now().minus({ weeks: 1 }),
    timeEnd: DateTime.now(),
  };

  const isSearchFilterFetched = useInitializeSearchFilter(
    setFilter,
    initialTimeInterval
  );
  if (!isSearchFilterFetched || isLoadingCameras) return <></>;
  return (
    <SearchFilterContext.Provider
      value={{
        filter,
        setFilter,
      }}
    >
      <CustomTabView
        tabData={tabData}
        selectedTab={selectedSubTab}
        setSelectedTab={setSelectedSubTab}
        tabStyle={TAB_STYLE}
      />
    </SearchFilterContext.Provider>
  );
}
