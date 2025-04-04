
import React from "react";
import Alert from 'sweetalert2'
import "./index.scss"
import Logo from "./Logo";
import { AUTH_TOKEN, routes, USER_OBJECT } from "../../services";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { resetStore } from "../../services/redux/store";
import { AlertOutlined, DashboardOutlined, LogoutOutlined, NotificationOutlined, SettingOutlined } from "@ant-design/icons";
import { customNotification } from "..";
import { CompaniesIcon } from "../../icons/companies-icon";

const Layout = React.memo(({ children }: any) => {
  // const user = useSelector((state: RootState) => state.user.user);

  // const { pathname } = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const logoutHandler = () => {
    Alert.fire({
      title: "Would you like to log out?",
      text: "You'll be logged out of your current session.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Log Out"
    }).then((result: any) => {
      if (result.isConfirmed) {
        localStorage.removeItem(USER_OBJECT);
        localStorage.removeItem(AUTH_TOKEN);
        dispatch(resetStore())  // reset the store
        navigate(routes.signIn)
        customNotification.success('Logged Out Successfully')
      }
    });
  }

  return (
    <div className="content team-section bg-white flex">
      <div className="sidebar w-[6rem] border-r border-r-[#6497B2] border-opacity-30 flex flex-col items-center justify-between" style={{ height: "100vh" }}>
        <div>
          <div className="logo-icon mt-5 flex flex-col justify-center items-center">
            <Logo onClick={() => navigate(routes.dashboard)} tooltip="Dashboard" ImgSrc={DashboardOutlined} />
            <p className="text-xs mt-1 text-center">Dashboard</p>
          </div>
          <div className="logo-icon mt-5 flex flex-col justify-center items-center">
            <Logo onClick={() => navigate(routes.features)} tooltip="Features" ImgSrc={SettingOutlined} />
            <p className="text-xs mt-1 text-center">Features</p>
          </div>
          <div className="logo-icon mt-5 flex flex-col justify-center items-center">
            <Logo onClick={() => navigate(routes.notifications)} tooltip="Global Notifications" ImgSrc={NotificationOutlined} />
            <p className="text-xs mt-1 text-center">Global Notifications</p>
          </div>
          <div className="logo-icon mt-5 flex flex-col justify-center items-center">
            <Logo onClick={() => navigate(routes.extensionNotification)} tooltip="Extension Releases" ImgSrc={AlertOutlined} />
            <p className="text-xs mt-1 text-center">Extension<br />Releases</p>
          </div>
          <div className="logo-icon mt-5 flex flex-col justify-center items-center">
            <Logo onClick={() => navigate(routes.workspaces)} tooltip="Workspaces" ImgSrc={CompaniesIcon} />
            <p className="text-xs mt-1 text-center">Workspaces </p>
          </div>
        </div>

        <div>
          <div className="list-icon my-4 flex flex-col items-center">
            <Logo onClick={logoutHandler} tooltip="Logout" ImgSrc={LogoutOutlined} />
            <p className="text-xs mt-1">Logout</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
});

export default Layout;
