
import React, { ChangeEvent, useEffect, useState } from "react";
import Layout from "../../components/layout";
import { apis } from "../../services";
import {
  ProfileObject,
  ProfileType
} from "../../services/types/common";
import { Space, Table, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import {
  setProfiles,
  setProfilesCount,
  setProfilesPerPage,
} from "../../services/redux/features/company-upwork-profiles/upwork-profiles.slice";
import { images } from "../../assets";
import ProfileModal from "../../components/profiles";
import { Pagination, PaginationProps } from "antd";
import { getProfileTableHeadings } from "../../services/constants/profiles";
import DeleteModal from "../../components/delete-modal";
import { ActionButton, customNotification } from "../../components";
import cleanAndTrimWhitespace from "../../services/utils/trimSpaces";
import { setHeaderData } from "../../services/redux/features/page-header/page-header.slice";

const AllUpworkProfiles = React.memo(() => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileObject[]>([]);

  const ProfilesData = useSelector(
    (state: RootState) => state.companyUpworkProfiles.profiles
  );

  const [profileHandler, setProfileHandler] = useState<{
    showModal: boolean,
    showDeleteModal: boolean,
    profile: any
  }>({
    showModal: false,
    showDeleteModal: false,
    profile: {}
  });

  const profilesPerPage = useSelector(
    (state: RootState) => state.companyUpworkProfiles.profilesPerPage
  );

  const profilesCount = useSelector(
    (state: RootState) => state.companyUpworkProfiles.profilesCount
  );

  const fetchData = async (currentPage: number = 1, perPage: number = profilesPerPage) => {
    try {
      setLoading(true);

      const { data: profileData } = await apis.getCompanyProfiles(
        currentPage,
        perPage
      );

      let profilesData: ProfileObject[] = [];
      const combinedProfiles = [...profileData.profiles];

      for (const profile of combinedProfiles) {
        if (!profile.deleted) {
          profilesData.push({
            profileName: profile?.name,
            url: profile?.url,
            createdDate: profile?.createdAt,
            id: profile.id,
            source: profile.source,
            clickupUsername: profile?.clickupUsername,
            clickupEmail: profile?.clickupEmail,
            clickupProfilePicture: profile?.clickupProfilePicture,
          });
        }
      }
      dispatch(setProfiles(profilesData));
      dispatch(setProfilesCount(profileData?.profilesCount));
      dispatch(setProfilesPerPage(profileData?.profilesPerPage));

    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      customNotification.error(error?.response?.data?.message || "An error occurred while fetching profiles");
    } finally {
      setLoading(false);
    }
  };

  const onPaginationChange: PaginationProps['onChange'] = (pageNumber) => {
    setPage(pageNumber);
  };

  const onPerPageChange: PaginationProps['onShowSizeChange'] = (_, pageSize) => {
    dispatch(setProfilesPerPage(pageSize));
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = cleanAndTrimWhitespace(e.target.value.trim());

    setSearchQuery(query);
  };

  // Function to handle clicks on profile view icon
  const handleViewIconClick = (profile: ProfileObject) => {
    setProfileHandler({ showModal: true, showDeleteModal: false, profile });
  };

  useEffect(() => {
    fetchData(page, profilesPerPage);
  }, [page, profilesPerPage]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredProfiles(
        ProfilesData.filter((profile: ProfileObject) =>
          profile.profileName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredProfiles(ProfilesData);
    }
  }, [searchQuery, ProfilesData]);

  useEffect(() => {
    dispatch(setHeaderData({
      title: "Profiles",
      actionButtons: [
        <ActionButton
          text="Add"
          tooltip="Add Upwork Profile"
          onClick={() => {
            setProfileType(ProfileType.UPWORK);
            setShowModal(true);
          }}
          icon={<img
            className='object-contain w-4 h-4'
            src={images.upworkLogoWhite}
            alt="Add Upwork Profile"
          />}
        />,
        <ActionButton
          text="Add"
          tooltip="Add LinkedIn Profile"
          onClick={() => {
            setProfileType(ProfileType.LINKEDIN);
            setShowModal(true);
          }}
          icon={<img
            className='object-contain w-4 h-4'
            src={images.linkedinWhite}
            alt="Add LinkedIn Profile"
          />}
        />
      ],
      search: <Input.Search
        placeholder="Search by profile name"
        value={searchQuery}
        onChange={handleSearch}
        style={{ width: 300, marginBottom: 16 }}
        loading={loading}
      />,
    }));
  }, [searchQuery, loading]);

  return (
    <Layout>
      <div className="flex justify-between items-center flex-col gap-3">
        <Table
          className="custom-table"
          columns={getProfileTableHeadings({
            handleProfileViewIcon: handleViewIconClick,
            handleProfileDeleteIcon: (profile: ProfileObject) => {
              setProfileHandler({ ...profileHandler, showDeleteModal: true, profile });
            }
          })}
          dataSource={filteredProfiles}
          pagination={false}
          scroll={{ x: 1500, y: 'calc(100vh - 16.3rem)' }}
          size="large"
          loading={loading}
        />
        {profilesCount ? (
          <Space direction="horizontal" size={12} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              showQuickJumper
              total={profilesCount}
              current={page}
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
              onChange={onPaginationChange}
              pageSize={profilesPerPage}
              onShowSizeChange={onPerPageChange}
            />
          </Space>
        ) : null}
      </div>
      {showModal && (
        <ProfileModal
          title={profileType === ProfileType.UPWORK ? "Create Upwork Profile" : "Create LinkedIn Profile"}
          showModal={showModal}
          closeModal={() => setShowModal(false)}
          fetchData={fetchData}
          profileType={profileType}
        />
      )}

      {
        profileHandler.showDeleteModal && (
          <DeleteModal
            showDeleteModal={profileHandler.showDeleteModal}
            heading="Profile"
            title="Profile"
            profileId={profileHandler.profile.id}
            closeDeleteModal={() => setProfileHandler({ ...profileHandler, showDeleteModal: false })}
            fetchUsers={fetchData}
          />
        )
      }
      {profileHandler.showModal && (
        <ProfileModal
          title={profileHandler?.profile?.profileName}
          showModal={profileHandler.showModal}
          closeModal={() => setProfileHandler({ ...profileHandler, showModal: false })}
          profileDetails={profileHandler?.profile}
          profileType={profileHandler?.profile?.source}
          fetchData={fetchData}
        />
      )}
    </Layout>
  );
});

export default AllUpworkProfiles;
