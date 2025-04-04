import React from "react";
import Proposals from "../../pages/deals/proposals";
import { DealsTabsEnum } from "../../pages/deals/types";
import DealsAllTab from "../../pages/deals/all";
import Leads from "../../pages/deals/leads";
import Contracts from "../../pages/deals/contracts";
import { IBidDetails } from "../../services/types/bids";

interface DealsTabContentProps {
  activeTab: DealsTabsEnum;
  setProposalsModal: (data: IBidDetails) => void
  setShowLeadLogs: ({ show, id }: { show: boolean, id: string }) => void
  setShowCommentsLogs: ({ show, id }: { show: boolean, id: string }) => void
}

const DealsTabContent: React.FC<DealsTabContentProps> = ({
  activeTab,
  setProposalsModal,
  setShowLeadLogs,
  setShowCommentsLogs,
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case DealsTabsEnum.PROPOSALS:
        return <Proposals
          setProposalsModal={setProposalsModal}
          setShowLeadLogs={setShowLeadLogs}
          setShowCommentsLogs={setShowCommentsLogs}
        />;
      case DealsTabsEnum.LEADS:
        return <Leads
          setProposalsModal={setProposalsModal}
          setShowLeadLogs={setShowLeadLogs}
          setShowCommentsLogs={setShowCommentsLogs}
        />;
      case DealsTabsEnum.CONTRACTS:
        return <Contracts
          setProposalsModal={setProposalsModal}
          setShowLeadLogs={setShowLeadLogs}
          setShowCommentsLogs={setShowCommentsLogs}
        />;
      default:
        return <DealsAllTab
          setProposalsModal={setProposalsModal}
          setShowLeadLogs={setShowLeadLogs}
          setShowCommentsLogs={setShowCommentsLogs}
        />;
    }
  };

  return (
    <div>{renderTabContent()}</div>
  );
};

export default DealsTabContent;
