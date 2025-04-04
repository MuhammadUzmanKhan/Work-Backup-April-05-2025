import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React, { useEffect, useState } from "react";
import "./dashboard.scss";
import { GRAPH_COLORS } from "../../services/constants/colors";

const BidByResponseHourlyChart = React.memo(({ loading }: { loading: boolean }) => {
  const bidByResponseHourly = useSelector((state: RootState) => state.bidderBids.bidByResponseHourlyReport);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      // Create chart instance
      const chart = am4core.create("chartdivBidByResponseHourly", am4charts.XYChart);

      // Common data and settings
      const chartData = bidByResponseHourly.map((bid: any) => ({
        name: bid.hour, // Updated to use 'hour' from response
        bidsCount: bid.bidsCount,
        leadsCount: bid.leadsCount,
        responseRate: ((bid.leadsCount / bid.bidsCount) * 100).toFixed(2),
      }));
      const colors = [
        am4core.color(GRAPH_COLORS.PROPOSALS),
        am4core.color(GRAPH_COLORS.LEADS),
      ];

      // Chart data
      chart.data = chartData;

      // Create axes for the chart
      const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "name";
      categoryAxis.tooltip!.disabled = true;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.labels.template.rotation = showLabels ? -90 : 0;
      categoryAxis.renderer.labels.template.disabled = !showLabels;
      categoryAxis.renderer.minGridDistance = 30;

      const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Count";

      // Create series for bids count
      const bidsSeries = chart.series.push(new am4charts.ColumnSeries());
      bidsSeries.dataFields.valueY = "bidsCount";
      bidsSeries.dataFields.categoryX = "name";
      bidsSeries.name = "Proposals Count";
      bidsSeries.fill = colors[0];
      bidsSeries.tooltipText = "Hour: [bold]{categoryX}[/] \nProposals: [bold]{valueY}[/]";
      bidsSeries.columns.template.column.cornerRadiusTopLeft = 10;
      bidsSeries.columns.template.column.cornerRadiusTopRight = 10;

      // Create series for leads count
      const leadsSeries = chart.series.push(new am4charts.ColumnSeries());
      leadsSeries.dataFields.valueY = "leadsCount";
      leadsSeries.dataFields.categoryX = "name";
      leadsSeries.name = "Leads Count";
      leadsSeries.fill = colors[1];
      leadsSeries.tooltipText = "Hour: [bold]{categoryX}[/] \nLeads: [bold]{valueY}[/]";
      leadsSeries.columns.template.column.cornerRadiusTopLeft = 10;
      leadsSeries.columns.template.column.cornerRadiusTopRight = 10;

      // Add cursor
      chart.cursor = new am4charts.XYCursor();

      // Set custom legend
      const customLegend = document.getElementById("custom-legend-area");
      if (customLegend) {
        customLegend.innerHTML = "";
        [bidsSeries.name, leadsSeries.name].forEach((itemName, i) => {
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
          colorBox.style.borderRadius = '50%';

          const legendText = document.createElement("span");
          legendText.textContent = itemName;

          legendItem.appendChild(colorBox);
          legendItem.appendChild(legendText);
          customLegend.appendChild(legendItem);
        });
      }

      // Clean up
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
  }, [bidByResponseHourly, showLabels]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!bidByResponseHourly.length && <span className="no-data-modal">No data available</span>}
      <div style={{ display: 'flex' }}>
        <div id="chartdivBidByResponseHourly" style={{ width: "100%", height: "500px" }}></div>
      </div>
    </div>
  );
});

export default BidByResponseHourlyChart;
