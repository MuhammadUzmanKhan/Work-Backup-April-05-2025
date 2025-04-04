import { useEffect, useState } from 'react';
import { Button, Dropdown, MenuProps, message, Tooltip } from 'antd';
import { apis, USER_OBJECT } from '../../../services';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import { setUser } from '../../../services/redux/features/user/user-slice';
import { ROLE } from '../../../services/types/common';
import Swal from 'sweetalert2';
import { handleAuthLogout } from '../../../services/hooks/handleLogout';

const options = [
  { label: '1 minute', value: '1' },
  { label: '5 minutes', value: '5' },
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: '1 hour', value: '60' },
  { label: '24 hours', value: '1440' },
];

const Configurations = () => {
  const [timeout, setTimeout] = useState<number | null>(null);
  const { user: { user } } = useSelector((state: RootState) => state);
  const dispatch = useDispatch();

  const getconfig = async () => {
    if (!timeout) {
      setTimeout(user?.company?.settings?.sessionTimeout / 60 / 1000);
    }
  };

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    const selectedTimeout = Number(e.key);

    // Confirm session revocation
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Changing the timeout will revoke your session and log you out.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, continue!',
      cancelButtonText: 'Cancel',
      allowOutsideClick: false,
    });

    if (result.isConfirmed) {
      setTimeout(selectedTimeout);
      await apis.createCompanySettings(selectedTimeout * 60 * 1000);
      message.success(selectedTimeout < 60 ? `Timeout set to ${selectedTimeout} minute(s).` : `Timeout set to ${selectedTimeout / 60} hour(s).`);
      await apis.revokeCompanySession(user.companyId);
      handleAuthLogout("You'll be logged out of your current session since your session was revoked when timeout was changed.")

      dispatch(setUser({
        ...user,
        company: {
          settings: {
            ...user.company.settings,
            sessionTimeout: selectedTimeout * 60 * 1000,
          }
        }
      } as any));

      const userObject = JSON.parse(localStorage.getItem(USER_OBJECT) as string);
      userObject.company.settings.sessionTimeout = selectedTimeout * 60 * 1000;
      localStorage.setItem(USER_OBJECT, JSON.stringify(userObject));
    } else {
      message.info('Session timeout change cancelled.');
    }
  };

  useEffect(() => {
    getconfig();
  }, []);

  const items: MenuProps['items'] = options.map(option => ({
    key: option.value,
    label: option.label,
  }));

  const menuProps: MenuProps = {
    items,
    onClick: handleMenuClick,
    disabled: user.role !== (ROLE.COMPANY_ADMIN || ROLE.OWNER),
  };

  return (
    <div className="configurations d-flex flex-row justify-content-start align-items-center" style={{ width: '60%' }}>
      <div className="text-container flex-column justify-content-between" style={{ flex: 1 }}>
        <h2 style={{ fontWeight: 'bold', fontSize: 20 }}>Auto-Logout Time Period</h2>
        <h4>Select the session's timeout to log the user out automatically on staying idle</h4>
      </div>
      <Tooltip title={user.role !== (ROLE.COMPANY_ADMIN || ROLE.OWNER) && "You need admin permission to change this property!"}>
        <Dropdown menu={menuProps} trigger={['click']}>
          <Button type='text' className="ant-dropdown-link">
            {timeout ? timeout < 60 ? `${timeout} minute(s).` : `${timeout / 60} hour(s).` : 'Select Timeout'} ▼
          </Button >
        </Dropdown>
      </Tooltip>
    </div>
  );
};

export default Configurations;
