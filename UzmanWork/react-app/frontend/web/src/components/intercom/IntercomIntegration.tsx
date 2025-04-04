import { Outlet, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useIsMobile } from "../layout/MobileOnly";

const INTERCOM_API_BASE = "https://api-iam.intercom.io";

export function IntercomIntegration() {
  const { user } = useAuth0();

  const location = useLocation();

  const isMobile = useIsMobile();

  useEffect(() => {
    window.Intercom("boot", {
      custom_launcher_selector: "#coram-intercom-launcher",
      hide_default_launcher: true,
      alignment: isMobile ? "right" : "left",
      api_base: INTERCOM_API_BASE,
      app_id: import.meta.env.VITE_INTERCOM_APP_ID,
      name: user?.name,
      email: user?.email,
    });
  }, [user, isMobile]);

  useEffect(() => {
    window.Intercom("update");
  }, [location]);

  return <Outlet />;
}
