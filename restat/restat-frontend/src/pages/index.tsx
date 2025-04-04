import { FC, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Alert } from "antd";
import Marquee from "react-fast-marquee";

import SignUp from "./sign-up";
import SignIn from "./sign-in";
import ComingSoon from "./coming-soon";
import ForgotPassword from "./forgot-password";
import ChangePassword from "./change-password";
import OnBoarding from "./onboarding";
import AcceptInvite from "./accept-invite";
import Portfolios from "./portfolios";
import AllUsers from "./my-team";
import Dashboard from "./dashboard";
import IntegrationsClickup from "./integrations/clickup";
import Settings from "./settings";
import Contacts from "./contacts";
import Deals from "./deals";
import ContactUs from "./contact-us";
import Maintenance from "./maintenance";
import OnBoardingCenter from "./onboarding-center";
import Companies from "./companies";
import Industries from "./business-data";
import IntegrationsUpwork from "./integrations/upwork";
import ConnectToClickup from "./integrations/clickup-profile";
import AllUpworkProfiles from "./profiles";
import IntegrationsHubspot from "./integrations/hubspot";
import AppContextProvider from "../context";
import { ProtectedRoute } from "../components";

import { ROLE } from "../services/types/common";

import { RootState } from "../services/redux/store";
import { setGlobalConfigurations } from "../services/redux/features/configurations/configurations-slice";

import { apis, AUTH_TOKEN, DISMISSED_NOTIFICATIONS, routes } from "../services";
import { getPageTitle } from "../services/utils/getPageTitle";
import { SettingsProps } from "../services/types/setting-prop-types";
import { convertDateFormat } from "../services/utils/convertDate";
import useCustomIdleTimer from "../services/hooks/custom-idle-timer";
import ExtensionSignIn from "./extension/sign-in";
import Payments from "./billing";

const Pages: FC<SettingsProps> = ({ deferredPrompt }) => {
  const {
    user: { user },
    configuration: { globalConfiguration },
  } = useSelector((state: RootState) => state);
  const token = localStorage.getItem(AUTH_TOKEN);
  const subscriptionActive = user?.company?.subscription?.isActive;

  const dispatch = useDispatch();
  const location = useLocation();
  const { getRemainingTime } = useCustomIdleTimer(
    user?.company?.settings?.sessionTimeout
  );
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const getGlobalConfiguration = async () => {
    try {
      const { data } = await apis.getGlobalConfiguration();
      dispatch(setGlobalConfigurations(data));
    } catch (error: any) {
      console.error(error);
      // customNotification.error(error?.response?.data?.message || "Something went wrong. Please check your internet connection and try again.")
    }
  };

  useEffect(() => {
    token && getGlobalConfiguration();
  }, [user]);

  useEffect(() => {
    const title = getPageTitle(location.pathname);
    document.title = title;

    if (window && window.dataLayer) {
      window.dataLayer.push({
        event: "pageview",
        page: {
          url: location.pathname,
          title,
        },
      });
    }
  }, [location]);

  const getNotifications = async () => {
    try {
      const { data } = await apis.getActiveNotifications();
      const dismissedNotifications = JSON.parse(
        localStorage.getItem(DISMISSED_NOTIFICATIONS) || "[]"
      );
      const activeNotifications = data.filter(
        (notification: any) =>
          !dismissedNotifications.includes(notification.id) &&
          notification.visibleOnWeb
      );

      if (activeNotifications.length > 0) {
        setNotifications(activeNotifications);
        setVisible(true);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleClose = () => {
    const dismissedNotifications = notifications.map(
      (notification: any) => notification.id
    );
    localStorage.setItem(
      DISMISSED_NOTIFICATIONS,
      JSON.stringify(dismissedNotifications)
    );

    setVisible(false);
  };

  useEffect(() => {
    getNotifications();
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      Math.ceil(getRemainingTime() / 1000);
    }, 500);
    return () => {
      clearInterval(interval);
    };
  });

  return (
    <AppContextProvider>
      {visible && token && (
        <Alert
          closable
          afterClose={handleClose}
          banner
          message={
            <Marquee pauseOnHover gradient={false}>
              {notifications.map((notification: any) => (
                <span key={notification.id} style={{ marginRight: "20px" }}>
                  <strong>{notification.title}: </strong>
                  {notification.notice}
                  {notification.maintenanceMode &&
                    `Maintaince will start on ${convertDateFormat(
                      notification.endDate
                    )}`}
                  {notification.callToAction && (
                    <a
                      href={notification.callToAction}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: "10px", color: "#1890ff" }}
                    >
                      Read more
                    </a>
                  )}
                </span>
              ))}
            </Marquee>
          }
        />
      )}
      <Routes>
        {token ? (
          <>
            {!user?.companyId ? (
              <Route
                path={routes.onBoarding}
                element={
                  <ProtectedRoute>
                    <OnBoarding />
                  </ProtectedRoute>
                }
              />
            ) : (
              <>
                {(subscriptionActive !== false) && <Route
                  path={routes.dashboard}
                  element={
                    <ProtectedRoute>
                      <Dashboard user={user} />
                    </ProtectedRoute>
                  }
                />}
                {((globalConfiguration?.features?.contacts === undefined
                  ? true
                  : globalConfiguration?.features?.contacts) && (subscriptionActive !== false)) && (
                    <>
                      <Route
                        path={routes.contacts}
                        element={
                          <ProtectedRoute>
                            <Contacts user={user} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={routes.contactModal}
                        element={
                          <ProtectedRoute>
                            <Contacts user={user} />
                          </ProtectedRoute>
                        }
                      />
                    </>
                  )}
                {((globalConfiguration?.features?.companies === undefined
                  ? true
                  : globalConfiguration?.features?.companies) && (subscriptionActive !== false)) && (
                    <>
                      <Route
                        path={routes.companies}
                        element={
                          <ProtectedRoute>
                            <Companies user={user} />
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path={routes.companiesModal}
                        element={
                          <ProtectedRoute>
                            <Companies user={user} />
                          </ProtectedRoute>
                        }
                      />
                    </>
                  )}

                {((globalConfiguration?.features?.portfolios === undefined
                  ? true
                  : globalConfiguration?.features?.portfolios) && (subscriptionActive !== false)) && (
                    <Route
                      path={routes.portfolios}
                      element={
                        <ProtectedRoute>
                          <Portfolios />
                        </ProtectedRoute>
                      }
                    />
                  )}

                <Route
                  path={routes.profile}
                  element={
                    <ProtectedRoute>
                      <ComingSoon />
                    </ProtectedRoute>
                  }
                />

                {((globalConfiguration?.features?.settings === undefined
                  ? true
                  : globalConfiguration?.features?.settings) && (subscriptionActive !== false)) && (
                    <Route
                      path={routes.settings}
                      element={
                        <ProtectedRoute>
                          <Settings deferredPrompt={deferredPrompt} />
                        </ProtectedRoute>
                      }
                    />
                  )}

                {((globalConfiguration?.features?.clickUp === undefined
                  ? true
                  : globalConfiguration?.features?.clickUp) && (subscriptionActive !== false)) && (
                    <>
                      <Route
                        path={routes.integrationsClickup}
                        element={
                          <ProtectedRoute>
                            <IntegrationsClickup />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={routes.connectToClickupProfile}
                        element={
                          <ProtectedRoute>
                            <ConnectToClickup />
                          </ProtectedRoute>
                        }
                      />
                    </>
                  )}
                {((globalConfiguration?.features?.hubSpot === undefined
                  ? true
                  : globalConfiguration?.features?.hubSpot) && (subscriptionActive !== false)) && (
                    <Route
                      path={routes.integrationsHubspot}
                      element={
                        <ProtectedRoute>
                          <IntegrationsHubspot />
                        </ProtectedRoute>
                      }
                    />
                  )}

                {((globalConfiguration?.features?.upwork === undefined
                  ? true
                  : globalConfiguration?.features?.upwork) && (subscriptionActive !== false)) && (
                    <Route
                      path={routes.integrationsUpwork}
                      element={
                        <ProtectedRoute>
                          <IntegrationsUpwork />
                        </ProtectedRoute>
                      }
                    />
                  )}

                {((globalConfiguration?.features?.deals === undefined
                  ? true
                  : globalConfiguration?.features?.deals) && (subscriptionActive !== false)) && (
                    <>
                      <Route
                        path={routes.deals}
                        element={
                          <ProtectedRoute>
                            <Deals user={user} />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path={routes.dealModal}
                        element={
                          <ProtectedRoute>
                            <Deals user={user} />
                          </ProtectedRoute>
                        }
                      />
                    </>
                  )}

                {((globalConfiguration?.features?.upworkProfiles === undefined
                  ? true
                  : globalConfiguration?.features?.upworkProfiles) && (subscriptionActive !== false)) && (
                    <Route
                      path={routes.upworkProfiles}
                      element={
                        <ProtectedRoute>
                          <AllUpworkProfiles />
                        </ProtectedRoute>
                      }
                    />
                  )}

                {(globalConfiguration?.features?.contactUs === undefined
                  ? true
                  : globalConfiguration?.features?.contactUs) && (
                    <Route
                      path={routes.contactUs}
                      element={
                        <ProtectedRoute>
                          <ContactUs />
                        </ProtectedRoute>
                      }
                    />
                  )}

                {((globalConfiguration?.features?.businessData === undefined
                  ? true
                  : globalConfiguration?.features?.businessData) && (subscriptionActive !== false)) && (
                    <Route
                      path={routes.businessData}
                      element={
                        <ProtectedRoute>
                          <Industries />
                        </ProtectedRoute>
                      }
                    />
                  )}

                {(globalConfiguration?.features?.team === undefined
                  ? true
                  : globalConfiguration?.features?.team) &&
                  (user?.role === ROLE.COMPANY_ADMIN ||
                    user?.role === ROLE.OWNER) && (
                    <Route
                      path={routes.teamMembers}
                      element={
                        <ProtectedRoute>
                          <AllUsers />
                        </ProtectedRoute>
                      }
                    />
                  )}

                {!user?.onBoardingCompleted && <Route path={routes.onBoardingCenter} element={
                  <ProtectedRoute>
                    <OnBoardingCenter />
                  </ProtectedRoute>
                } />}

                {(
                  globalConfiguration?.features?.stripe === undefined ? true : globalConfiguration?.features?.stripe) &&
                  user?.role === ROLE.OWNER && (
                    <Route path={routes.billing} element={
                      <ProtectedRoute>
                        <Payments />
                      </ProtectedRoute>
                    } />
                  )}
              </>
            )}
          </>
        ) : (
          <>
            <Route path={routes.signUp} element={<SignUp />} />
            <Route path={routes.signIn} element={<SignIn />} />
            <Route path={routes.forgotPassword} element={<ForgotPassword />} />
            <Route path={routes.terms} element={<ComingSoon />} />
            <Route path={routes.privacy} element={<ComingSoon />} />
            <Route path={routes.changePassword} element={<ChangePassword />} />
            <Route path={routes.acceptInvite} element={<AcceptInvite />} />
          </>
        )}

        <Route
          path={routes.maintenance}
          element={
            <ProtectedRoute>
              <Maintenance />
            </ProtectedRoute>
          }
        />

        <Route path={routes.extensionSignIn} element={<ExtensionSignIn />} />

        <Route
          path="*"
          element={
            <Navigate
              to={
                token
                  ? user.companyId
                    ? !subscriptionActive
                      ? routes.billing
                      : routes.dashboard
                    : routes.onBoarding
                  : routes.signIn
              }
            />
          }
        />
      </Routes>
    </AppContextProvider>
  );
};

export default Pages;
