import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React, { useEffect, useState } from "react";
import "./dashboard.scss";
import { GRAPH_COLORS } from "../../services/constants/colors";

const BidsCountByProfileChart = React.memo(({ loading }: { loading: boolean }) => {
  const bidsCountByProfile = useSelector((state: RootState) => state.bidderBids.bidsCountByProfile);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    // Apply chart themes
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      // Create chart instance
      const chart = am4core.create("bidsByProileChart", am4charts.XYChart);

      const colors = [
        am4core.color(GRAPH_COLORS.PROPOSALS),
        am4core.color(GRAPH_COLORS.LEADS),
        am4core.color(GRAPH_COLORS.CONTRACTS),
        am4core.color(GRAPH_COLORS.INVITES),
        am4core.color(GRAPH_COLORS.INVITE_CONTRACTS),
        am4core.color(GRAPH_COLORS.DIRECT_LEADS),
        am4core.color(GRAPH_COLORS.DIRECT_CONTRACTS),
      ];

      // Add data
      chart.data = bidsCountByProfile.map((bid) => ({
        name: bid.deletedAt ? `${bid.name} (deleted)` : bid.name,
        bidsCount: bid.bidsCount,
        leadsCount: bid.leadsCount,
        contractsCount: bid.contractsCount,
        invitesCount: bid.invitesCount,
        inviteContracts: bid.inviteContracts,
        directLeadsCount: bid.directLeadsCount,
        directContractsCount: bid.directContractsCount,
        responseRate:  bid.bidsCount ? ((bid.leadsCount / bid.bidsCount) * 100).toFixed(2)+'%' : 'N/A',
        deleted: !!bid.deletedAt,
      }));

      // Create axes
      const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "name";
      categoryAxis.tooltip!.disabled = true;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.labels.template.rotation = showLabels ? -90 : 0;
      categoryAxis.renderer.labels.template.disabled = !showLabels;
      categoryAxis.renderer.minGridDistance = 30;

      const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Count";

      // Create a reusable function to create series
      const createSeries = (field: string, name: string, color: am4core.Color, tooltip: boolean = false) => {
        const series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = field;
        series.dataFields.categoryX = "name";
        series.name = name;
        series.stacked = true
        series.columns.template.tooltipText = tooltip
          ? `Profile: [bold]{categoryX}[/] 
          Proposals: [bold]{bidsCount}[/]
          Leads: [bold]{leadsCount}[/]
          Contracts: [bold]{contractsCount}[/]
          Invites: [bold]{invitesCount}[/]
          Invites Contracts: [bold]{inviteContracts}[/]
          Direct Leads: [bold]{directLeadsCount}[/]
          Direct Contracts: [bold]{directContractsCount}[/]
          Response Rate: [bold]{responseRate}[/]
          {deleted ? "[bold](Deleted Profile)[/]" : ""}`
          : "";
        series.columns.template.fill = color;
        series.columns.template.strokeOpacity = 0;
        series.columns.template.column.cornerRadiusTopLeft = 10;
        series.columns.template.column.cornerRadiusTopRight = 10;
        series.columns.template.column.fillOpacity = 0.8;

        series.tooltip!.getFillFromObject = false;
        series.tooltip!.background.fill = am4core.color("rgba(255, 255, 255, 0.6)");
        series.tooltip!.label.fill = am4core.color("#000");

        const hoverState = series.columns.template.column.states.create("hover");
        hoverState.properties.fillOpacity = 1;

        return series;
      };

      // Create series with the given data and colors
      createSeries("bidsCount", "Proposal Count", colors[0], true);
      createSeries("leadsCount", "Leads Count", colors[1]);
      createSeries("contractsCount", "Contracts Count", colors[2]);
      createSeries("invitesCount", "Invites Count", colors[3]);
      createSeries("inviteContracts", "Invite Contracts Count", colors[4]);
      createSeries("directLeadsCount", "Direct Leads Count", colors[5]);
      createSeries("directContractsCount", "Direct Contracts Count", colors[6]);

      chart.cursor = new am4charts.XYCursor();

      chart.events.on("ready", () => {
        setChartLoaded(true);
      });

      return () => {
        chart.dispose();
      };
    });
  };

  useEffect(() => {

    drawChart();

    const handleResize = () => {
      setShowLabels(window.innerWidth >= 850);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [bidsCountByProfile, showLabels]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!bidsCountByProfile.length && <span className="no-data-modal">No data available</span>}
      <div id="bidsByProileChart" style={{ width: "100%", height: "500px" }}></div>
    </div>
  );
});

export default BidsCountByProfileChart;
