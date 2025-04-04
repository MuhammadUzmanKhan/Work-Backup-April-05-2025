import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";

import { RootState } from "../../services/redux/store";
import "./dashboard.scss";

const ConnectsCountByIndustry = React.memo(({ loading }: { loading: boolean }) => {
  const industryConnectsCount = useSelector((state: RootState) => state?.linkedinCounts?.industryConnectsCounts);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    // Apply chart themes
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      // Create chart instance
      const chart = am4core.create("chartdivLinkedinConnectsByIndustry", am4charts.XYChart);

      const colors = [
        am4core.color("#1f77b4"),  // Blue
        am4core.color("#ff7f0e"),  // Orange
        am4core.color("#2ca02c"),  // Green
        am4core.color("#d62728"),  // Red
        am4core.color("#9467bd"),  // Purple
        am4core.color("#8c564b"),  // Brown
        am4core.color("#e377c2"),  // Pink
        am4core.color("#7f7f7f"),  // Gray
        am4core.color("#bcbd22"),  // Yellow-Green
        am4core.color("#17becf"),  // Cyan
        am4core.color("#aec7e8"),  // Light Blue
        am4core.color("#ffbb78"),  // Light Orange
        am4core.color("#98df8a"),  // Light Green
        am4core.color("#ff9896"),  // Light Red
        am4core.color("#c5b0d5"),  // Light Purple
        am4core.color("#c49c94"),  // Light Brown
        am4core.color("#f7b6d2"),  // Light Pink
        am4core.color("#c7c7c7"),  // Light Gray
        am4core.color("#dbdb8d"),  // Light Yellow-Green
        am4core.color("#9edae5"),  // Light Cyan
      ];

      // Add data
      chart.data = industryConnectsCount.map((connects: any) => {
        const usersData = connects.users?.reduce((acc: any, user: { name: string, connectsCount: number, deletedAt: string }) => {
          const userName = user.deletedAt ? `${user.name} (Deleted)` : user.name;
          acc[userName] = user.connectsCount;
          return acc;
        }, {});

        return {
          name: connects.industry,
          ...usersData
        };
      });

      // Create axes
      const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "name";
      categoryAxis.tooltip!.disabled = true;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.labels.template.rotation = showLabels ? -90 : 0;
      categoryAxis.renderer.labels.template.disabled = !showLabels;
      categoryAxis.renderer.minGridDistance = 30;

      const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Connections";

      // Create a reusable function to create series
      const createSeries = (field: string, name: string, color: am4core.Color, showTooltip: boolean) => {
        const series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = field;
        series.dataFields.categoryX = "name";
        series.name = name;
        series.stacked = true;
        series.columns.template.tooltipText = showTooltip
          ? `${name}: [bold]{valueY}[/]`
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

      // Create series for each user
      if (industryConnectsCount.length > 0) {
        const userNamesSet = new Set<string>();

        industryConnectsCount.forEach((connects: any) => {
          connects.users?.forEach((user: { name: string, deletedAt: string }) => {
            const userName = user.deletedAt ? `${user.name} (Deleted)` : user.name;
            userNamesSet.add(userName);
          });
        });

        const userNames = Array.from(userNamesSet);

        userNames.forEach((userName, i) => {
          createSeries(userName, userName, colors[i % colors.length], true);
        });

        // Create custom legend
        const customLegend = document.getElementById("custom-legend");
        if (customLegend) {
          customLegend.innerHTML = "";
          userNames.forEach((userName, i) => {
            const legendItem = document.createElement("div");
            legendItem.className = "legend-item";
            legendItem.style.display = "flex";
            legendItem.style.alignItems = "center";
            legendItem.style.marginBottom = "5px";

            const colorBox = document.createElement("div");
            colorBox.style.backgroundColor = colors[i % colors.length].hex;
            colorBox.style.width = "15px";
            colorBox.style.height = "15px";
            colorBox.style.marginRight = "5px";

            const legendText = document.createElement("span");
            legendText.textContent = userName;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(legendText);
            customLegend.appendChild(legendItem);
          });
        }
      }

      chart.cursor = new am4charts.XYCursor();
      chart.cursor.lineX.disabled = true;
      chart.cursor.lineY.disabled = true;

      chart.events.on("ready", () => {
        setChartLoaded(true);
      });

      return () => {
        if (chart) {
          chart.dispose();
        }
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
  }, [industryConnectsCount, showLabels]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!industryConnectsCount.length ? <span className="no-data-modal">No data available</span> : ''}
      {industryConnectsCount?.length ? <div id="custom-legend" style={{ marginTop: "10px", display: 'flex', justifyContent: 'center', gap: '20px', maxWidth: '100%', overflowX: 'scroll' }}></div> : ''}
      <div id="chartdivLinkedinConnectsByIndustry" style={{ width: "100%", height: "600px" }}></div>
    </div>
  );
});

export default ConnectsCountByIndustry;
