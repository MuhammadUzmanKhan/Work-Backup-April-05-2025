import { Button, Box } from "@mui/material";
import { TAB_STYLE, TabItem } from "./utils";
import CustomTabView from "components/analytics/CustomTabView";
import { ProfilesTabDefaultView } from "features/aiAnalytics/faceRecognition/faceProfileTab/ProfilesTabDefaultView";
import { PersonOfInterestTabDefaultView } from "features/aiAnalytics/faceRecognition/personOfInterestTab/PersonOfInterestTabDefaultView";
import { FacesTabDefaultView } from "features/aiAnalytics/faceRecognition/uniqueFaceTab/FacesTabDefaultView";
import { DateTime } from "luxon";
import { useState } from "react";
import {
  INITIAL_SEARCH_FILTER_STATE,
  SearchFilterContext,
  SearchFilterState,
  useInitializeSearchFilter,
} from "utils/search_filter";
import { TimeInterval } from "utils/time";
import { Plus } from "icons/plus";
import { FeatureFlags, MountIf } from "coram-common-utils";
import { useFeatureEnabled } from "utils/globals";
import { FaceUploaderDialog } from "features/faceUploader/FaceUploader";
import { useQueryClient } from "react-query";
import { FACE_ALERT_PROFILE_KEY } from "features/aiAnalytics/faceRecognition/constants";

export enum PersonSubTab {
  Faces = "Faces",
  Profile = "Profile",
  PersonOfInterest = "PersonOfInterest",
}

export function PersonPage() {
  const [selectedSubTab, setSelectedSubTab] = useState<PersonSubTab>(
    PersonSubTab.Faces
  );
  const [filter, setFilter] = useState<SearchFilterState>(
    INITIAL_SEARCH_FILTER_STATE
  );
  const queryClient = useQueryClient();
  const [openUploader, setOpenUploader] = useState(false);
  const faceUploadEnabled = useFeatureEnabled(FeatureFlags.FACE_UPLOAD_ENABLED);

  const tabData: TabItem[] = [
    {
      label: "Faces",
      value: PersonSubTab.Faces,
      component: <FacesTabDefaultView />,
    },
    {
      label: "Profile",
      value: PersonSubTab.Profile,
      component: <ProfilesTabDefaultView />,
    },
    {
      label: "Person of Interest",
      value: PersonSubTab.PersonOfInterest,
      component: <PersonOfInterestTabDefaultView />,
    },
  ];

  const initialTimeInterval: TimeInterval = {
    timeStart: DateTime.now().minus({ day: 1 }),
    timeEnd: DateTime.now(),
  };

  const isSearchFilterFetched = useInitializeSearchFilter(
    setFilter,
    initialTimeInterval
  );
  if (!isSearchFilterFetched) return <></>;

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
        rightViewControls={
          <MountIf condition={faceUploadEnabled}>
            <Box px={1}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Plus />}
                onClick={() => setOpenUploader(true)}
              >
                Upload Face
              </Button>
            </Box>

            <FaceUploaderDialog
              open={openUploader}
              onClose={() => setOpenUploader(false)}
              onProfileUploaded={async () => {
                queryClient.invalidateQueries(FACE_ALERT_PROFILE_KEY);
              }}
            />
          </MountIf>
        }
      />
    </SearchFilterContext.Provider>
  );
}
