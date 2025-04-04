import React from "react";
import { Badge } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { RootState } from "../../services/redux/store";
import { routes } from "../../services";
import { useAuth } from "../../services/hooks/handleLogout";
import Logo from "./Logo";
import Profile from "./profile";
import "./index.scss";
import {
  BusinessDataIcon,
  DashboardIcon,
  DealsIcon,
  CompaniesIcon,
  ContactsIcon,
  PortfoliosIcon,
  ContactUsIcon,
  ProfilesIcon,
  OnBoardingCenterIcon,
} from "./icons";
import { images } from "../../assets";
import PageWrapper from "../page-header/page-wrapper";
import PageHeader from "../page-header";

const Layout = React.memo(({ children }: any) => {
  const {
    user: { user },
    configuration: { globalConfiguration },
  } = useSelector((state: RootState) => state);
  const subscriptionActive = user?.company?.subscription?.isActive;
  const { handleLogout } = useAuth();
  const { pathname } = useLocation();

  const logoutHandler = () => {
    handleLogout(
      "Would you like to log out?",
      "You'll be logged out of your current session.",
      "question",
      true,
      "#3085d6",
      "#d33",
      "Yes, Log Out"
    );
  };

  const renderLink = (to: string, tooltip: string, icon: JSX.Element, active: boolean) => (
    <Link
      to={to}
      className={`w-full ${subscriptionActive === false ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
    >
      <Logo
        tooltip={tooltip}
        customIcon={icon}
        active={active}
      />
    </Link>
  );

  return (
    <div className="flex bg-[#F8F8F9]">
      <div className="sidebar min-w-[4.375rem] flex flex-col items-center justify-between min-h-screen">
        <div className="w-full flex flex-col items-center justify-between">
          <div className="w-full my-3 text-center">
            {<Link to={routes.dashboard}
              className={`w-full ${subscriptionActive === false ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
            >
              <img src={images.whiteLogo} alt="React Logo" className="inline-block w-[40px] object-contain pl-1" />
            </Link>}
          </div>
          <div className="w-full flex flex-col items-center justify-between">
            {!user?.onBoardingCompleted && renderLink(routes.onBoardingCenter, "Onboarding Center", <Badge dot className="mt-2">
              <OnBoardingCenterIcon color="white" size={22} />
            </Badge>, pathname === routes.onBoardingCenter)}
            {globalConfiguration?.features?.dashboard && renderLink(routes.dashboard, "Dashboard", <DashboardIcon color={"white"} size={22} />, pathname === routes.dashboard)}
            {globalConfiguration?.features?.deals && renderLink(routes.deals, "Deals", <DealsIcon color="white" size={22} />, pathname === routes.deals)}
            {globalConfiguration?.features?.contacts && renderLink(routes.contacts, "Contacts", <ContactsIcon color="white" size={22} />, pathname === routes.contacts)}
            {globalConfiguration?.features?.companies && renderLink(routes.companies, "Companies", <CompaniesIcon color="white" size={22} />, pathname === routes.companies)}
            {globalConfiguration?.features?.portfolios && renderLink(routes.portfolios, "Portfolios", <PortfoliosIcon color="white" size={22} />, pathname === routes.portfolios)}
            {globalConfiguration?.features?.upworkProfiles && renderLink(routes.upworkProfiles, "Profiles", <ProfilesIcon color="white" size={24} />, pathname === routes.upworkProfiles)}
            {globalConfiguration?.features?.businessData && renderLink(routes.businessData, "Business Data", <BusinessDataIcon color="white" size={22} />, pathname === routes.businessData)}
          </div>
        </div>

        <div className="w-full flex flex-col items-center justify-between mb-4">
          {globalConfiguration?.features?.contactUs && renderLink(routes.contactUs, "Contact Us", <ContactUsIcon color="white" size={24} />, pathname === routes.contactUs)}
          <div>
            <Profile user={user} logoutHandler={logoutHandler} subscriptionActive={subscriptionActive} />
          </div>
        </div>
      </div>
      <div className="w-full overflow-hidden">
        <PageHeader />
        <PageWrapper>
          {children}
        </PageWrapper>
      </div>
    </div>
  );
});

export default Layout;