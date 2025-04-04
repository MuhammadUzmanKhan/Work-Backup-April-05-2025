import { FC, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
import { Tabs } from 'antd';
import './Settings.scss';
import Profile from './profile';
import Integrations from './integrations';
import { Layout, TabsLabel } from '../../components';
// import { routes } from '../../services';
import DownloadExtension from './download-extension';
import Configurations from './configurations';
import AccountManagement from './account-management';
import { ROLE } from "../../services/types/common";
import Workspace from "./Workspace";
import { SettingsProps } from '../../services/types/setting-prop-types';
import { UserState } from '../../services/types/user';
import { setHeaderData } from '../../services/redux/features/page-header/page-header.slice';

type TabOption = 'Profile' | 'Integrations' | 'DownloadExtension' | 'Configurations' | 'Workspace' | 'AccountManagement';

const Settings: FC<SettingsProps> = ({ deferredPrompt }) => {
  const [activeTab, setActiveTab] = useState<TabOption>('Profile');
  const [user, setUser] = useState<UserState>();
  // const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleTabClick = (tabName: TabOption) => {
    setActiveTab(tabName);
  };

  useEffect(() => {
    const userObject = localStorage.getItem("USER_OBJECT");
    setUser(userObject ? JSON.parse(userObject) : undefined);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Conditionally add tabs based on user role
    const items = [
      {
        key: 'Profile',
        label: <TabsLabel
          title="Profile"
          count={null}
          activeKey={activeTab === 'Profile' ? 'Profile' : null}
        />,
      },
      user && user.role === ROLE.OWNER && {
        key: 'AccountManagement',
        label: <TabsLabel
          title="Account Management"
          count={null}
          activeKey={activeTab === 'AccountManagement' ? 'AccountManagement' : null}
        />,
      },
      user && user.role === ROLE.OWNER && {
        key: 'Workspace',
        label: <TabsLabel
          title="Workspace"
          count={null}
          activeKey={activeTab === 'Workspace' ? 'Workspace' : null}
        />,
      },
      {
        key: 'Integrations',
        label: <TabsLabel
          title="Integrations"
          count={null}
          activeKey={activeTab === 'Integrations' ? 'Integrations' : null}
        />,
      },
      {
        key: 'DownloadExtension',
        label: <TabsLabel
          title="Download Extension"
          count={null}
          activeKey={activeTab === 'DownloadExtension' ? 'DownloadExtension' : null}
        />,
      },
      user && [ROLE.COMPANY_ADMIN, ROLE.OWNER].includes(user.role) && {
        key: 'Configurations',
        label: <TabsLabel
          title="Configurations"
          count={null}
          activeKey={activeTab === 'Configurations' ? 'Configurations' : null}
        />,
      },
    ].filter(Boolean); // Remove any `false` entries from the array

    dispatch(setHeaderData({
      title: "Settings",
      tabs: (
        <Tabs
          defaultActiveKey={"Profile"}
          onChange={(key) => handleTabClick(key as TabOption)}
          activeKey={activeTab}
          items={items as any} // Type assertion for filtered items
        />
      ),
    }));
  }, [user, activeTab]);

  return (
    <Layout>
      <div className="tab-content">
        {activeTab === 'Profile' && (
          <Profile />
        )}
        {activeTab === 'AccountManagement' && (
          <AccountManagement />
        )}
        {activeTab === 'Integrations' && (
          <Integrations />
        )}
        {activeTab === 'DownloadExtension' && (
          <DownloadExtension deferredPrompt={deferredPrompt} />
        )}
        {activeTab === 'Configurations' && (
          <Configurations />
        )}
        {activeTab === 'Workspace' && (
          <Workspace />
        )}
      </div>
    </Layout>
  );
};

export default Settings;
