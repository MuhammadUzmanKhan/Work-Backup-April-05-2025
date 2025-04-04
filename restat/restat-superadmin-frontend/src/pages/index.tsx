import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { routes } from "../services/constants";
import SignIn from "./sign-in";
import OtpVerification from "./otp-verification";
import { Layout, ProtectedRoute } from "../components";
import Dashboard from "./dashboard";
import { useSelector } from "react-redux";
import { RootState } from "../services/redux/store";
import Features from "./features";
import Notifications from "./notifications";
import ExtensionReleases from "./extension-notification";
import Workspaces from "./workspaces";

const Pages = () => {
    const user = useSelector((state: RootState) => state.user.user);

    return (
        <BrowserRouter>
            <Routes>
                <Route path={routes.signIn} element={<SignIn />} />
                <Route path={routes.otpVerification} element={<OtpVerification />} />

                {/* Protected Routes */}
                <Route
                    path={routes.dashboard}
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Dashboard user={user} />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={routes.features}
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Features />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={routes.notifications}
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Notifications />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={routes.extensionNotification}
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <ExtensionReleases />
                            </Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={routes.workspaces}
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <Workspaces />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* Redirect for unmatched routes */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={user?.id ? routes.dashboard : routes.signIn}
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default Pages;
