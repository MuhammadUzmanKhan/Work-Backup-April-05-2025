import React from "react";
import ConnnectsCountByBD from "./linkedin-connects-by-bd";
import ConnnectsCountByIndustry from "./linkedin-connects-by-industry";
import TotalConnectsProspectsCount from "./linkedin-connects-prospects-chart";
import { LinkedInTeamProgressCard } from "../../components/dashboard-widgets/linkedIn/team-progress-card";
import { ROLE, UsersObject } from "../../services/types/common";
import { ProspectsCard } from "../../components/dashboard-widgets/linkedIn/prospects-card";
import { ConnectionAcceptanceCard } from "../../components/dashboard-widgets/linkedIn/connection-acceptance-percentage";
import { BusinessDevelopersLinkedInStatsCard } from "../../components/dashboard-widgets/linkedIn/business-developers-stats";
import LinkedinConnectByStatesChart from "./linkedin-connect-by-state";
import ConnnectsCountByProfile from "./linkedin-connection-by-profile";
import MonthlyConnectionData from "./linkedin-connections-by-month";


const LinkedinTab = React.memo(({ user, loading }:
  {
    loading: boolean,
    user: UsersObject
  }) => {
  const userRole: string = user?.role;

  return (
    <>
      <div className="flex px-7 py-3 flex-wrap gap-x-4 gap-y-4">
        <LinkedInTeamProgressCard loading={loading} role={userRole} />
        <ProspectsCard loading={loading} />
        <ConnectionAcceptanceCard loading={loading} />

        {(userRole === ROLE.COMPANY_ADMIN || userRole === ROLE.OWNER) && <BusinessDevelopersLinkedInStatsCard loading={loading} />}
      </div>
      <div className="px-7 py-3 mb-10 pb-10">
        <h3 className="flex justify-center font-medium mb-5">
          Total Connects & Prospects
        </h3>
        <TotalConnectsProspectsCount loading={loading} />
        <hr />

        <h3 className="flex justify-center font-medium mt-5 mb-5">
          LinkedIn Connections by Business Developer
        </h3>
        <ConnnectsCountByBD loading={loading} />
        <hr />

        <h3 className="flex justify-center font-medium mt-5 mb-5">
          LinkedIn Connections by Profiles
        </h3>
        <ConnnectsCountByProfile loading={loading} />
        <hr />

        <h3 className="flex justify-center font-medium mt-5 mb-5">
          Monthly LinkedIn Connections
        </h3>
        <MonthlyConnectionData loading={loading} />
        <hr />

        <h3 className="flex justify-center font-medium mt-5 mb-5">
          LinkedIn Connections by Industries
        </h3>
        <ConnnectsCountByIndustry loading={loading} />
        <hr />

        <h3 className="flex justify-center font-medium mt-5 mb-5">
          LinkedIn Connections by States
        </h3>
        <LinkedinConnectByStatesChart loading={loading} />
        <hr />

      </div>
    </>
  );
});

export default LinkedinTab;
