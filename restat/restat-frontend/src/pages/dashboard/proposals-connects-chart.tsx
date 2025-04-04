import React, { useEffect, useState } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import "./dashboard.scss";

const ProposalsConnectsStackedChart = React.memo(({ loading }: { loading: boolean }) => {
  const bidsMonthlyReport = useSelector((state: RootState) => state.bidderBids.bidsMonthlyReport);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      // Create chart instance
      const proposalsVsConnectsChart = am4core.create("stackedChartDivProposalVsConnects", am4charts.XYChart);

      // Prepare data for the chart
      const proposalsVsConnectsChartData = bidsMonthlyReport.map((item: any) => ({
        date: item.month,
        totalProposals: item.totalProposalsCount,
        connects: -item.totalConnects,
        positiveConnects: item.totalConnects,
      }));

      // Assign data to chart
      proposalsVsConnectsChart.data = proposalsVsConnectsChartData;

      // Create category axis (Y Axis) for date
      const categoryAxisProposalsVsConnects = proposalsVsConnectsChart.yAxes.push(new am4charts.CategoryAxis());
      categoryAxisProposalsVsConnects.dataFields.category = "date";
      categoryAxisProposalsVsConnects.title.text = "Date";
      categoryAxisProposalsVsConnects.renderer.grid.template.location = 0;
      categoryAxisProposalsVsConnects.renderer.minGridDistance = 20;
      categoryAxisProposalsVsConnects.renderer.labels.template.disabled = !showLabels;
      categoryAxisProposalsVsConnects.tooltip!.disabled = true;

      // Create value axis (X Axis) for counts
      const valueAxisProposalsVsConnects = proposalsVsConnectsChart.xAxes.push(new am4charts.ValueAxis());
      valueAxisProposalsVsConnects.title.text = "Counts";

      valueAxisProposalsVsConnects.renderer.labels.template.adapter.add("text", function (text) {
        const cleanedText = text?.replace(/,/g, "")?.trim();
        const num = Math.abs(Number(cleanedText));
        return isNaN(num) ? "" : num.toString();
      });

      // Ensure the zero is in the middle by setting a symmetric axis
      valueAxisProposalsVsConnects.renderer.minGridDistance = 50;
      valueAxisProposalsVsConnects.renderer.baseGrid.disabled = false;
      const maxAbsoluteValueProposalsVsConnects = Math.max(
        ...proposalsVsConnectsChartData.map((item) => Math.abs(item.totalProposals)),
        ...proposalsVsConnectsChartData.map((item) => Math.abs(item.connects))
      );
      valueAxisProposalsVsConnects.min = -maxAbsoluteValueProposalsVsConnects;
      valueAxisProposalsVsConnects.max = maxAbsoluteValueProposalsVsConnects;

      valueAxisProposalsVsConnects.tooltip!.disabled = true;
      valueAxisProposalsVsConnects.renderer.labels.template.adapter.add("text", function (text) {
        return Math.abs(Number(text)).toString(); // Remove the negative sign from labels
      });

      // Create a reusable function to create series
      const createSeries = (
        chart: any,
        field: string,
        name: string,
        color: am4core.Color,
        tooltip: boolean = false
      ) => {
        const series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueX = field;
        series.dataFields.categoryY = "date";
        series.name = name;
        series.stacked = true;
        series.columns.template.fill = color;
        series.columns.template.strokeOpacity = 0;
        series.columns.template.width = am4core.percent(40);
        series.columns.template.column.fillOpacity = 0.8;

        series.columns.template.tooltipText = tooltip
          ? `Date: {categoryY}\nProposals: {dataContext.totalProposals}\nConnects: {dataContext.positiveConnects}`
          : "";

        series.tooltip!.getFillFromObject = false; // Prevents the tooltip from getting the fill color from the column
        series.tooltip!.background.fill = am4core.color("#FFFFFF");
        series.tooltip!.label.fill = am4core.color("#000000");

        const hoverState = series.columns.template.column.states.create("hover");
        hoverState.properties.fillOpacity = 1;
        return series;
      };

      // Create series for Total Proposals and Connects
      createSeries(proposalsVsConnectsChart, "totalProposals", "Total Proposals", am4core.color("#EE3A23"), true);
      createSeries(proposalsVsConnectsChart, "connects", "Connects", am4core.color("#9f23ee"));

      proposalsVsConnectsChart.cursor = new am4charts.XYCursor();

      // Create a legend
      proposalsVsConnectsChart.legend = new am4charts.Legend();

      proposalsVsConnectsChart.events.on("ready", () => {
        setChartLoaded(true);
      });

      return () => {
        proposalsVsConnectsChart.dispose();
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
    <div className={`chart-container ${chartLoaded ? "loaded" : ""}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!bidsMonthlyReport.length && <span className="no-data-modal">No data available</span>}
      <div id="custom-legend-area" style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "20px", maxWidth: "100%", overflowX: "scroll" }}></div>
      <div id="stackedChartDivProposalVsConnects" style={{ width: "100%", height: "500px" }}></div>
    </div>
  );
});

export default ProposalsConnectsStackedChart;
