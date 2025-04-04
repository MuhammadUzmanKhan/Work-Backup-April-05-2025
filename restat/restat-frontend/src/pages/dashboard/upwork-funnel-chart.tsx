import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React, { useEffect, useState } from "react";
import "./dashboard.scss";
import { GRAPH_COLORS } from "../../services/constants/colors";

const FunnelChart = React.memo(({ loading }: { loading: boolean }) => {
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const {
    proposalsCount,
    leadsCount,
    contractsCount,
    inviteLeadsCount,
    inviteContractsCount,
    directLeadsCount,
    directContractsCount
  } = useSelector((state: RootState) => state.bidderBids.funnelStats);


  useEffect(() => {
    am4core.useTheme(am4themes_animated);

    // Create chart instance
    const chart = am4core.create("upworkFunnelChartdiv", am4charts.SlicedChart);

    // Outbound data and series
    const outboundSeries = chart.series.push(new am4charts.FunnelSeries());
    outboundSeries.dataFields.value = "value";
    outboundSeries.dataFields.category = "category";
    outboundSeries.alignLabels = false;
    outboundSeries.orientation = "vertical";
    outboundSeries.colors.list = [
      am4core.color(GRAPH_COLORS.PROPOSALS),
      am4core.color(GRAPH_COLORS.LEADS),
      am4core.color(GRAPH_COLORS.CONTRACTS),
    ];
    outboundSeries.marginBottom = 15;

    // Inbound data and series
    const inboundSeries = chart.series.push(new am4charts.FunnelSeries());
    inboundSeries.dataFields.value = "value";
    inboundSeries.dataFields.category = "category";
    inboundSeries.alignLabels = false;
    inboundSeries.orientation = "vertical";
    inboundSeries.colors.list = [
      am4core.color(GRAPH_COLORS.INVITES),
      am4core.color(GRAPH_COLORS.INVITE_CONTRACTS),
    ];
    inboundSeries.marginTop = 15;

    // Direct data and series
    const directSeries = chart.series.push(new am4charts.FunnelSeries());
    directSeries.dataFields.value = "value";
    directSeries.dataFields.category = "category";
    directSeries.alignLabels = false;
    directSeries.orientation = "vertical";
    directSeries.colors.list = [
      am4core.color(GRAPH_COLORS.DIRECT_LEADS),
      am4core.color(GRAPH_COLORS.DIRECT_CONTRACTS),
    ];
    directSeries.marginTop = 15;

    // Set data
    outboundSeries.data = [
      { value: proposalsCount, category: "Total Proposals" },
      { value: leadsCount, category: "Total Leads" },
      { value: contractsCount, category: "Total Contracts" },
    ].map(item => ({
      ...item,
      percent: item.value || proposalsCount ? (item.category === "Total Proposals" ? "(100%)" :
        item.category === 'Total Leads' ? `(${proposalsCount ? ((item.value / proposalsCount) * 100).toFixed(2) : 0}% of Proposals)` :
          item.category === 'Total Contracts' ? `(${leadsCount ? ((item.value / leadsCount) * 100).toFixed(2) : 0}% of Leads)` : '') : ''
    }));

    inboundSeries.data = [
      { value: inviteLeadsCount, category: "Total Invite Leads" },
      { value: inviteContractsCount, category: "Total Invite Contracts" },
    ].map(item => ({
      ...item,
      percent: item.value || inviteLeadsCount ? (item.category === "Total Invite Leads" ? "(100%)" :
        item.category === 'Total Invite Contracts' ? `(${inviteLeadsCount ? ((item.value / inviteLeadsCount) * 100).toFixed(2) : 0}% of Invites)` : '') : ''
    }));

    directSeries.data = [
      { value: directLeadsCount, category: "Total Direct Leads" },
      { value: directContractsCount, category: "Total Direct Contract" },
    ].map(item => ({
      ...item,
      percent: item.value || directLeadsCount ? (item.category === "Total Direct Leads" ? "(100%)" :
        item.category === 'Total Direct Contract' ? `(${directLeadsCount ? ((item.value / directLeadsCount) * 100).toFixed(2) : 0}% of Direct Leads)` : '') : ''
    }));

    // Tooltip and label settings
    // outboundSeries.slices.template.tooltipText = "{category}: [bold]{value}[/] {percent}";
    outboundSeries.labels.template.text = "{category}: [bold]{value}";
    outboundSeries.padding(10, 20, 10, 20);

    // inboundSeries.slices.template.tooltipText = "{category}: [bold]{value}[/] {percent}";
    inboundSeries.labels.template.text = "{category}: [bold]{value}";
    inboundSeries.padding(10, 20, 10, 20);

    // directSeries.slices.template.tooltipText = "{category}: [bold]{value}[/] {percent}";
    directSeries.labels.template.text = "{category}: [bold]{value}";
    directSeries.padding(10, 20, 10, 20);

    // Hover state
    const hoverState = outboundSeries.slices.template.states.create("hover");
    hoverState.properties.fillOpacity = 1;

    // Legend
    const legend = new am4charts.Legend();
    legend.position = "bottom";
    legend.contentAlign = "center";
    legend.align = 'center'
    legend.layout = "grid"; // Use grid layout for grouping
    // legend.itemContainers.template.width = am4core.percent(25); // 3 items per row
    // legend.itemContainers.template.marginRight = 10

    chart.legend = legend;
    // legend.labels.template.text = "{name} [bold]{percent}[/]";
    // chart.legend.valueLabels.template.disabled = true;

    // Animate
    chart.appear();

    chart.events.on("ready", () => {
      setChartLoaded(true);
    });

    return () => {
      chart.dispose();
      legend.dispose();
    };
  }, [proposalsCount, leadsCount, contractsCount, inviteLeadsCount, inviteLeadsCount, directLeadsCount, directContractsCount]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!proposalsCount && <span className="no-data-modal">No data available</span>}
      <div>
        <h3 style={{ margin: '10px' }}><b>Outbound - Inbound - Direct</b></h3>
        <div id="upworkFunnelChartdiv" style={{ width: "100%", height: "400px" }}></div>
      </div>
    </div>
  );
});

export default FunnelChart;
