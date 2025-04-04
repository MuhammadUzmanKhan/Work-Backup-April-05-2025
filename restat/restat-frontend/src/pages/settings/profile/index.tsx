import { Formik, } from 'formik';
import './Profile.scss';
import { useContext, useEffect, useState } from 'react';
import { USER_OBJECT, apis, auth, monthNames } from '../../../services';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../services/redux/store';
import { ROLE, SOURCE } from '../../../services/types/common';
import { setUser } from '../../../services/redux/features/user/user-slice';
// import ErrorComponent from '../../../components/error-component';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth';
import { AppContext } from '../../../context';
import ClickUpConnection from './clickup-connection';
import { Button, Input, Form as AntForm } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { customNotification } from '../../../components';
import cleanAndTrimWhitespace from '../../../services/utils/trimSpaces';
import PhoneInput from 'react-phone-input-2';

interface Stats {
  bidMonthlyCountByBidder: number
  bidDailyCountByBidder: number
}

interface FormData {
  fullName: string;
  email: string, old_password: string;
  new_password: string;
  re_enter_password: string
}

const Profile = () => {
  const { user: { user }, configuration: { globalConfiguration } } = useSelector((state: RootState) => state);
  const [stats, setStats] = useState<Stats>({
    bidMonthlyCountByBidder: 0,
    bidDailyCountByBidder: 0
  })
  const [loading, setLoading] = useState(false);

  const context = useContext(AppContext)

  const currentMonth = monthNames[new Date().getMonth()];
  const dispatch = useDispatch()

  const handleSaveChanges = async (data: FormData, { resetForm }: { resetForm: () => void }) => {
    try {
      data = {
        ...data,
        fullName: cleanAndTrimWhitespace(data.fullName),
        email: cleanAndTrimWhitespace(data.email),
        old_password: cleanAndTrimWhitespace(data.old_password),
        new_password: cleanAndTrimWhitespace(data.new_password),
      }
      setLoading(true)
      const messages = {
        name: '',
        password: ''
      }
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return customNotification.error('User is not authenticated.')
      }

      if (data.old_password && data.new_password) {
        const credential = EmailAuthProvider.credential(currentUser.email!, data.old_password);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, data.new_password);
        messages.password = 'Password'
      }
      if (data.fullName !== user.name) {

        await apis.updateName({ name: data.fullName })
        await updateProfile(currentUser, { displayName: data.fullName });
        messages.name = 'Name'
      }

      if (messages.name && messages.password) {
        customNotification.success(`${messages.name} & ${messages.password} updated successsfully.`)
      } else if (messages.name) {
        customNotification.success(`${messages.name} updated successsfully`)
      } else if (messages.password) {
        customNotification.success(`${messages.password} updated successsfully`)
      }

      localStorage.setItem(USER_OBJECT, JSON.stringify(user))
      dispatch(setUser({ ...user, name: data.fullName }))
      // resetForm()
    } catch (error: any) {
      if (error?.code === 'auth/wrong-password') {
        customNotification.error('Old passsword does not match')
      } else customNotification.error(error?.response?.data?.message || 'An Error Occurred! Profile not updated')
    } finally {
      setLoading(false)
    }
  };

  const getLatestCount = async () => {
    try {
      const response = await apis.countGoalStats(SOURCE.UPWORK)
      setStats(response.data)
    } catch (error: any) {
      console.error('Error occurred in getLatestCount', error)
      customNotification.error(error?.response?.data?.message || 'An Error Occurred! Please Try Again Later.')
    }
  }

  const getClickupUserInfo = async () => {
    try {
      const response = await apis.getClickupProfileInfo()
      context.setClickupUser(response.data?.clickupUser)
    } catch (error: any) {
      console.error('Error occurred in getClickupUserInfo', error)
      customNotification.error(error?.response?.data?.message || 'An Error Occurred! Please Try Again Later.')
    }
  }

  const handleConnectToClickup = () => {
    const clickUpAuthUrl = `https://app.clickup.com/api?client_id=${process.env.REACT_APP_CLICKUP_CLIENT_ID}&redirect_uri=${process.env.REACT_APP_CLICKUP_CONNECT_PROFILE_REDIRECTION_URL}`
    window.location.replace(clickUpAuthUrl);
  }

  useEffect(() => {
    localStorage.setItem('USER_OBJECT', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    !context.clickupUser?.clickupId && getClickupUserInfo()
    user.role === ROLE.BIDDER && getLatestCount()
  }, [])

  return (
    <div className="Profile">
      <div>
        <h2>Personal Settings</h2>
        <Formik
          initialValues={{
            fullName: user.name,
            email: user.email,
            old_password: '',
            new_password: '',
            re_enter_password: '',
          }}
          validate={(values) => {
            const errors: { [key: string]: string } = {};
            if (!values.fullName) {
              errors.fullName = 'Name is Required';
            }
            if (!values.email) {
              errors.email = 'Required';
            } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
              errors.email = 'Invalid email address';
            }
            if (values.old_password?.length > 3) {
              if (!values.new_password) {
                errors.new_password = 'New Password is Required';
                return errors;
              }
              if (values.new_password && values.new_password?.length > 3) {
                if (values.new_password !== values.re_enter_password) {
                  errors.re_enter_password = 'Password Does Not Match!';
                }
              } else {
                errors.new_password = 'New Password is too short!';
              }
            }
            return errors;
          }}
          onSubmit={handleSaveChanges}
        >
          {({ handleSubmit, errors, touched, setFieldValue, values, isSubmitting }) => (
            <AntForm className="profile-form" onFinish={handleSubmit}>
              <AntForm.Item
                label="Full Name"
                validateStatus={touched.fullName && errors.fullName ? 'error' : ''}
                help={touched.fullName && errors.fullName}
              >
                <Input
                  name="fullName"
                  value={values.fullName}
                  onChange={e => setFieldValue('fullName', e.target.value)}
                  placeholder="Enter full name"
                />
              </AntForm.Item>

              <AntForm.Item
                label="Email"
                validateStatus={touched.email && errors.email ? 'error' : ''}
                help={touched.email && errors.email}
              >
                <Input
                  name="email"
                  value={values.email}
                  onChange={e => setFieldValue('email', e.target.value)}
                  placeholder="example123@gmail.com"
                  disabled
                />
              </AntForm.Item>

              <AntForm.Item
                label="Old Password"
                validateStatus={touched.old_password && errors.old_password ? 'error' : ''}
                help={touched.old_password && errors.old_password}
              >
                <Input.Password
                  name="old_password"
                  className="profile-input"
                  value={values.old_password}
                  onChange={e => setFieldValue('old_password', e.target.value)}
                  placeholder="Enter your old password"
                  iconRender={() => null}
                />
              </AntForm.Item>

              <AntForm.Item
                label="New Password"
                validateStatus={touched.new_password && errors.new_password ? 'error' : ''}
                help={touched.new_password && errors.new_password}
              >
                <Input.Password
                  name="new_password"
                  className="profile-input"
                  value={values.new_password}
                  onChange={e => setFieldValue('new_password', e.target.value)}
                  placeholder="Enter new password"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </AntForm.Item>

              <AntForm.Item
                label="Confirm  Password"
                validateStatus={touched.re_enter_password && errors.re_enter_password ? 'error' : ''}
                help={touched.re_enter_password && errors.re_enter_password}
              >
                <Input.Password
                  name="re_enter_password"
                  className="profile-input"
                  value={values.re_enter_password}
                  onChange={e => setFieldValue('re_enter_password', e.target.value)}
                  placeholder="Confirm new password"
                  iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
              </AntForm.Item>
              {user.role === ROLE.OWNER &&
                <AntForm.Item
                  label="Phone Number"
                  name="phoneNumber"
                  initialValue={user.phoneNumber}
                >
                  <PhoneInput
                    value={user.phoneNumber}
                    disabled
                    inputStyle={{
                      width: '100%',
                      height: '3.12rem',
                      border: '0.0625rem solid',
                      fontSize: '1.125rem',
                      color: 'var(--blue)',
                    }}
                  />
                </AntForm.Item>
              }
              <AntForm.Item>
                <Button type="primary" htmlType="submit" loading={loading} className="button"
                  style={{ backgroundColor: "#1a4895", color: "#DDDDDD", minWidth: '400px', height: '50px' }}
                  disabled={isSubmitting}
                >
                  Save Changes!
                </Button>
              </AntForm.Item>
            </AntForm>
          )}
        </Formik>
      </div>
      <div className='right-side-area'>
        {globalConfiguration?.features?.clickUp && <ClickUpConnection context={context} handleConnectToClickup={handleConnectToClickup} />}
        {user.role === ROLE.BIDDER ? <div className='p-4'>
          <hr className='p-4' />
          <div className='stats-container'>
            <div className='count-container daily-bids'>
              <h4>{stats.bidDailyCountByBidder ?? 0}</h4>
              <h4>Daily Proposals</h4>
            </div>
            <div className='count-container monthly-bids'>
              <h4>{stats.bidMonthlyCountByBidder ?? 0}</h4>
              <h4>Monthly Proposals ({currentMonth})</h4>
            </div>
          </div>
        </div> : null}
      </div>
    </div>
  );
};

export default Profile;
