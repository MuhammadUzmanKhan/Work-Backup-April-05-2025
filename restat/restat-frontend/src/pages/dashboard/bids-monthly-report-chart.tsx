import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React, { useEffect, useState } from "react";
import "./dashboard.scss";
import { GRAPH_COLORS } from "../../services/constants/colors";

const BidsMonthlyReportChart = React.memo(({ loading }: { loading: boolean }) => {
  const bidsMonthlyReport = useSelector((state: RootState) => state.bidderBids.bidsMonthlyReport);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      // Create column chart instance
      const columnChart = am4core.create("chartdivBidsMonthlyReport", am4charts.XYChart);

      // Common data and settings
      const chartData = bidsMonthlyReport.map((bid: any) => ({
        name: bid.month,
        bidsCount: bid.bidsCount,
        leadsCount: bid.leadsCount,
        contractsCount: bid.contractsCount,
        invitesCount: bid.invitesCount,
        inviteContractsCount: bid.inviteContractsCount,
        directCount: bid.directCount,
        directContractsCount: bid.directContractsCount,
        responseRate: ((bid.leadsCount / bid.bidsCount) * 100).toFixed(2),
      }));
      const colors = [
        am4core.color(GRAPH_COLORS.PROPOSALS),
        am4core.color(GRAPH_COLORS.LEADS),
        am4core.color(GRAPH_COLORS.CONTRACTS),
        am4core.color(GRAPH_COLORS.INVITES),
        am4core.color(GRAPH_COLORS.INVITE_CONTRACTS),
        am4core.color(GRAPH_COLORS.DIRECT_LEADS),
        am4core.color(GRAPH_COLORS.DIRECT_CONTRACTS),
      ];

      // Column Chart Data
      columnChart.data = chartData;

      // Create axes for column chart
      const categoryAxis = columnChart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "name";
      categoryAxis.tooltip!.disabled = true;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.labels.template.rotation = showLabels ? -90 : 0;
      categoryAxis.renderer.labels.template.disabled = !showLabels;
      categoryAxis.renderer.minGridDistance = 30;

      const valueAxis = columnChart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Count";

      // Create column series
      const createColumnSeries = (field: string, name: string, color: am4core.Color, tooltip: boolean = false) => {
        const series = columnChart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = field;
        series.dataFields.categoryX = "name";
        series.name = name;
        series.columns.template.tooltipText = tooltip ? `Month: [bold]{categoryX}[/] 
          Proposals: [bold]{bidsCount}[/]
          Leads: [bold]{leadsCount}[/]
          Contracts: [bold]{contractsCount}[/]
          Invites: [bold]{invitesCount}[/]
          Invite Contracts: [bold]{inviteContractsCount}[/]
          Direct Leads: [bold]{directCount}[/]
          Direct Contracts: [bold]{directContractsCount}[/]
          Response%: [bold]{responseRate}[/]` : '';
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
      createColumnSeries("bidsCount", "Proposals Count", colors[0], true);
      createColumnSeries("leadsCount", "Leads Count", colors[1]);
      createColumnSeries("contractsCount", "Contracts Count", colors[2]);
      createColumnSeries("invitesCount", "Invites Count", colors[3]);
      createColumnSeries("inviteContractsCount", "Invite Contracts Count", colors[4]);
      createColumnSeries("directCount", "Direct Count", colors[5]);
      createColumnSeries("directContractsCount", "Direct Contracts Count", colors[6]);

      columnChart.cursor = new am4charts.XYCursor();

      // Create line chart instance
      const lineChart = am4core.create("chartdivLineChart", am4charts.XYChart);
      lineChart.data = chartData;

      // Create axes for line chart
      const lineCategoryAxis = lineChart.xAxes.push(new am4charts.CategoryAxis());
      lineCategoryAxis.dataFields.category = "name";
      lineCategoryAxis.tooltip!.disabled = true;
      lineCategoryAxis.renderer.grid.template.location = 0;
      lineCategoryAxis.renderer.labels.template.rotation = showLabels ? -90 : 0;
      lineCategoryAxis.renderer.labels.template.disabled = !showLabels;
      lineCategoryAxis.renderer.minGridDistance = 30;

      const lineValueAxis = lineChart.yAxes.push(new am4charts.ValueAxis());
      lineValueAxis.title.text = "Count";

      // Create line series
      const createLineSeries = (field: string, name: string, color: am4core.Color) => {
        const series = lineChart.series.push(new am4charts.LineSeries());
        series.dataFields.valueY = field;
        series.dataFields.categoryX = "name";
        series.name = name;
        series.stroke = color;
        series.strokeWidth = 2;
        series.tooltipText = `[bold]{name}[/]
        ${name}: [bold]{valueY}[/]`;
        series.bullets.push(new am4charts.CircleBullet());
      };

      createLineSeries("bidsCount", "Proposals Count", colors[0]);
      createLineSeries("leadsCount", "Leads Count", colors[1]);
      createLineSeries("contractsCount", "Contracts Count", colors[2]);
      createLineSeries("invitesCount", "Invites Count", colors[3]);
      createLineSeries("inviteContractsCount", "Invite Contracts Count", colors[4]);
      createLineSeries("directCount", "Direct Count", colors[5]);
      createLineSeries("directContractsCount", "Direct Contracts Count", colors[6]);

      lineChart.cursor = new am4charts.XYCursor();

      columnChart.events.on("ready", () => {
        setChartLoaded(true);
      });

      const customLegend = document.getElementById("custom-legend-area");
      if (customLegend) {
        customLegend.innerHTML = "";
        ['Proposals', 'Leads', 'Contract Invites'].forEach((userName, i) => {
          const legendItem = document.createElement("div");
          legendItem.className = "legend-item";
          legendItem.style.display = "flex";
          legendItem.style.alignItems = "center";
          legendItem.style.marginBottom = "5px";

          const colorBox = document.createElement("div");
          colorBox.style.backgroundColor = colors[i].hex;
          colorBox.style.width = "15px";
          colorBox.style.height = "15px";
          colorBox.style.marginRight = "5px";
          colorBox.style.borderRadius = '50%'

          const legendText = document.createElement("span");
          legendText.textContent = userName;

          legendItem.appendChild(colorBox);
          legendItem.appendChild(legendText);
          customLegend.appendChild(legendItem);
        });
      }

      return () => {
        columnChart.dispose();
        lineChart.dispose();
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
  }, [bidsMonthlyReport, showLabels]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!bidsMonthlyReport.length && <span className="no-data-modal">No data available</span>}
      <div id="custom-legend-area" style={{ marginTop: "10px", display: 'flex', justifyContent: 'center', gap: '20px', maxWidth: '100%', overflowX: 'scroll' }}></div>
      <div style={{ display: 'flex' }}>
        <div id="chartdivBidsMonthlyReport" style={{ width: "50%", height: "500px" }}></div>
        <div id="chartdivLineChart" style={{ width: "50%", height: "500px" }}></div>
      </div>

    </div>
  );
});

export default BidsMonthlyReportChart;
