import React from "react";
import { ROLE, UsersObject } from "../../services/types/common";
import TotalBidsJobsChart from "./upwork-funnel-chart";
import BidsCountByProfileChart from "./bids-by-profile-chart";
import BidsCountByCategoryChart from "./bids-by-category-chart";
import BidsCountByStateChart from "./bids-by-state-chart";
import BidsCountByBiddersChart from "./bids-by-bidders-chart"
import BidsMonthlyReportChart from "./bids-monthly-report-chart";
import ProposalsConnectsStackedChart from "./proposals-connects-chart";
import BidByResponseHourlyChart from "./bids-and-response-chart";
import { TeamProgressCard } from "../../components/dashboard-widgets/upwork/team-progress-card";
import { MqlCard } from "../../components/dashboard-widgets/upwork/mql-card";
import { ResponseRateCard } from "../../components/dashboard-widgets/upwork/response-rate-card";
import { InvitesCard } from "../../components/dashboard-widgets/upwork/invites-card";
import { DirectLeadsCard } from "../../components/dashboard-widgets/upwork/direct-leads-card";
import { TotalContractsCard } from "../../components/dashboard-widgets/upwork/total-contracts-card";
import { BusinessDevelopersStatsCard } from "../../components/dashboard-widgets/upwork/business-developers-stats";
import { LeadsCard } from "../../components/dashboard-widgets/upwork/leads-card";


const UpworkTab = React.memo(({ user, bidderId, loading }:
  {
    user: UsersObject,
    bidderId: string,
    loading: boolean,
  }) => {

  const userRole: string = user?.role;

  return (
    <>
      <div className="flex px-7 py-3 flex-wrap gap-x-4 gap-y-4">
        <TeamProgressCard loading={loading} role={userRole} />
        <LeadsCard loading={loading} />
        <TotalContractsCard loading={loading} />
        <ResponseRateCard loading={loading} />
        <InvitesCard loading={loading} />
        <DirectLeadsCard loading={loading} />
        <MqlCard loading={loading} />
      </div>

      {(userRole === ROLE.COMPANY_ADMIN || userRole === ROLE.OWNER) && <div className="flex px-7 py-3 flex-wrap space-x-4 space-y-4">
        <BusinessDevelopersStatsCard loading={loading} />
      </div>}

      <div className="px-7 py-3 mb-10 pb-10">
        <h3 className="flex justify-center mb-5">
          Total Deals
        </h3>
        <TotalBidsJobsChart loading={loading} />
        <hr />

        {(userRole === ROLE.COMPANY_ADMIN || userRole === ROLE.OWNER) && !bidderId ? (
          <div>
            <h3 className="flex justify-center mt-5 mb-5">
              Proposals By Business Developer
            </h3>
            <BidsCountByBiddersChart loading={loading} />
            <hr />
          </div>
        ) : null}

        <h3 className="flex justify-center mt-5 mb-5">
          Proposals By Upwork Profile
        </h3>
        <BidsCountByProfileChart loading={loading} />

        <h3 className="flex justify-center mt-5 mb-5">
          Proposals Monthly Report
        </h3>
        <BidsMonthlyReportChart loading={loading} />

        <h3 className="flex justify-center mt-5 mb-5">
          <b>Proposals Vs Connects Consumed</b>
        </h3>
        <ProposalsConnectsStackedChart loading={loading} />

        <h3 className="flex justify-center mt-5 mb-5">
          Proposal and Leads Hourly Report
        </h3>
        <BidByResponseHourlyChart loading={loading} />

        <h3 className="flex justify-center mt-5 mb-5">
          Proposals By Category
        </h3>
        <BidsCountByCategoryChart loading={loading} />
        <h3 className="flex justify-center mt-5 mb-5">
          Proposals By State
        </h3>
        <BidsCountByStateChart loading={loading} />
      </div>
    </>
  );
});

export default UpworkTab;
