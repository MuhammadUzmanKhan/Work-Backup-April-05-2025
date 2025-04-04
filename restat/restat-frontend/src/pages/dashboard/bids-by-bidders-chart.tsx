import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React, { useEffect, useState } from "react";
import "./dashboard.scss";
import { GRAPH_COLORS } from "../../services/constants/colors";

interface BidData {
  name: string;
  bidsCount: number;
  securedJobsCount: number;
  leadsWonCount: number;
  invitesCount: number;
  inviteContractsCount: number,
  directLeadsCount: number,
  directContractsCount: number,
  responseRate?: string;
  target?: number;
}

const BidsCountByBiddersChart = React.memo(({ loading }: { loading: boolean }) => {
  const bidsCountByBidders = useSelector((state: RootState) => state.bidderBids.bidsCountByBidders);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    // Apply chart themes
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      // Create chart instance
      const chart = am4core.create("chartdiv6", am4charts.XYChart);

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
      chart.data = bidsCountByBidders.map((bid) => ({
        name: bid.userDeletedAt ? `${bid.name} (deleted)` : bid.name,
        bidsCount: bid.bidsCount,
        securedJobsCount: bid.securedJobsCount,
        leadsWonCount: bid.leadsWonCount,
        invitesCount: bid.invitesCount,
        inviteContractsCount: bid.inviteContractsCount,
        directLeadsCount: bid.directLeadsCount,
        directContractsCount: bid.directContractsCount,
        responseRate: bid.bidsCount ? ((+bid.securedJobsCount / +bid.bidsCount) * 100).toFixed(2)+'%' : 'N/A',
        target: bid.target,
        targetAchieved: bid.target ? ((+bid.bidsCount / +bid.target) * 100).toFixed(2) + '%' : 'N/A',
        deleted: !!bid.userDeletedAt,
      }));

      // Create axes
      const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "name";
      if (categoryAxis.tooltip) categoryAxis.tooltip.disabled = true;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.labels.template.rotation = -90;
      categoryAxis.renderer.minGridDistance = 30;

      const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Count";

      // Create stacked series
      const createStackedSeries = (field: keyof BidData, name: string, color: am4core.Color, tooltip: boolean = false) => {
        const series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = field;
        series.dataFields.categoryX = "name";
        series.name = name;
        series.stacked = true;

        series.columns.template.tooltipText = tooltip ?
          `Business Developer: [bold]{categoryX}[/]
        Target: [bold]{target}[/]
        Proposals: [bold]{bidsCount}[/]
        Leads: [bold]{securedJobsCount}[/]
        Contracts: [bold]{leadsWonCount}[/]
        Invites: [bold]{invitesCount}[/]
        Invite Contracts: [bold]{inviteContractsCount}[/]
        Direct Leads: [bold]{directLeadsCount}[/]
        Direct Contracts: [bold]{directContractsCount}[/]
        Response Rate: [bold]{responseRate}[/]
        Target Achieved: [bold]{targetAchieved}[/]
        {deleted ? "[bold](Deleted Profile)[/]" : ""}`
          : "";

        series.columns.template.fill = color;
        series.columns.template.strokeOpacity = 0;
        series.columns.template.column.cornerRadiusTopLeft = 10;
        series.columns.template.column.cornerRadiusTopRight = 10;
        series.columns.template.column.fillOpacity = 0.8;

        if (series.tooltip) {
          series.tooltip.getFillFromObject = false;
          series.tooltip.background.fill = am4core.color("rgba(255, 255, 255, 0.6)"); // Slightly transparent
          series.tooltip.label.fill = am4core.color("#000");
        }

        return series;
      };

      createStackedSeries("bidsCount", "Proposals", colors[0], true);
      createStackedSeries("securedJobsCount", "Secured", colors[1]);
      createStackedSeries("leadsWonCount", "Leads", colors[2]);
      createStackedSeries("invitesCount", "Invites", colors[3]);
      createStackedSeries("inviteContractsCount", "Invite Contracts", colors[4]);
      createStackedSeries("directLeadsCount", "Direct Leads", colors[5]);
      createStackedSeries("directContractsCount", "Direct Contracts", colors[6]);

      // Add Line series
      const lineSeries = chart.series.push(new am4charts.LineSeries());
      lineSeries.dataFields.valueY = "target";
      lineSeries.dataFields.categoryX = "name";
      lineSeries.name = "Line Series";
      lineSeries.strokeWidth = 2;
      lineSeries.stroke = colors[4]

      // Create hover state for the line series
      const bullet = lineSeries.bullets.push(new am4charts.Bullet());
      const circle = bullet.createChild(am4core.Circle);
      circle.width = 10;
      circle.height = 10;
      circle.fill = colors[1]
      circle.strokeWidth = 2;

      chart.cursor = new am4charts.XYCursor();

      chart.events.on("ready", () => {
        setChartLoaded(true);
      });
    });
  };


  useEffect(() => {
    if (bidsCountByBidders) {
      drawChart();
    }
    const handleResize = () => {
      setShowLabels(window.innerWidth >= 850);
    };
    window.addEventListener("resize", handleResize);
    // Clean up the event listener when the component unmounts
    return () => window.removeEventListener("resize", handleResize);
  }, [bidsCountByBidders, showLabels]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!bidsCountByBidders.length && <span className="no-data-modal">No data available</span>}
      <div id="chartdiv6" style={{ width: "100%", height: "500px" }}></div>
    </div>
  );
});

export default BidsCountByBiddersChart;
