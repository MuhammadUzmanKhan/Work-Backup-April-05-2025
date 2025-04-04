import { Tabs } from "antd";
import { DealsTabsEnum } from "../../pages/deals/types";
import "./deals-tab.scss";
import { RootState } from "../../services/redux/store";
import { useSelector } from "react-redux";
import TabsLabel from "../tabs-label";

interface DealsTabsProps {
  activeTab: DealsTabsEnum;
  onTabChange: (key: string) => void;
}

const DealsTabs: React.FC<DealsTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const proposalsCount = useSelector((state: RootState) => state.deals.totalProposalCount);
  const leadsCount = useSelector((state: RootState) => state.deals.totalLeadsCount);
  const contractsCount = useSelector((state: RootState) => state.deals.totalContractsCount);
  const dealsCount = useSelector((state: RootState) => state.deals.dealsCount);


  return (
    <Tabs activeKey={activeTab} onChange={onTabChange} className="deals-tabs">
      <Tabs.TabPane
        tab={
          <TabsLabel
            title={DealsTabsEnum.ALL}
            count={(proposalsCount + leadsCount + contractsCount) === 0 ? dealsCount : (proposalsCount + leadsCount + contractsCount)}
            activeKey={activeTab === DealsTabsEnum.ALL ? 'All' : null}
          />}
        key={DealsTabsEnum.ALL}
      />
      <Tabs.TabPane
        tab={
          <TabsLabel
            title={DealsTabsEnum.PROPOSALS}
            count={proposalsCount}
            activeKey={activeTab === DealsTabsEnum.PROPOSALS ? 'Proposals' : null}
          />
        }
        key={DealsTabsEnum.PROPOSALS}
      />
      <Tabs.TabPane
        tab={
          <TabsLabel
            title={DealsTabsEnum.LEADS}
            count={leadsCount}
            activeKey={activeTab === DealsTabsEnum.LEADS ? 'Leads' : null}
          />
        }
        key={DealsTabsEnum.LEADS}
      />
      <Tabs.TabPane
        tab={
          <TabsLabel
            title={DealsTabsEnum.CONTRACTS}
            count={contractsCount}
            activeKey={activeTab === DealsTabsEnum.CONTRACTS ? 'Contracts' : null}
          />
        }
        key={DealsTabsEnum.CONTRACTS}
      />
    </Tabs>
  );
};

export default DealsTabs;
