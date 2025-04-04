import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

import { RootState } from "../../services/redux/store";
import "./dashboard.scss";

const ConnectsCountByProfile = React.memo(({ loading }: { loading: boolean }) => {
  const connectsCountByProfile = useSelector((state: RootState) => state.linkedinCounts.connectsCountByProfile);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      const chart = am4core.create("chartdivLinkedinConnectsProfile", am4charts.XYChart);

      const colors = [
        am4core.color("#ef3a24"),
        am4core.color("#1a4895"),
      ];

      chart.data = connectsCountByProfile.map((profile: any) => ({
        name: profile.deletedAt ? `${profile.name} (Deleted)` : profile.name,
        connectionsCount: profile.connectionsCount,
        prospectCount: profile.prospectCount,
        responseRate: profile.prospectCount > 0
          ? ((profile.prospectCount / profile.connectionsCount) * 100).toFixed(2)
          : "0.00",
        deleted: profile.deletedAt ? "Deleted" : "",
      }));

      const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "name";
      categoryAxis.tooltip!.disabled = true;
      categoryAxis.renderer.grid.template.location = 0;
      categoryAxis.renderer.labels.template.rotation = showLabels ? -90 : 0;
      categoryAxis.renderer.labels.template.disabled = !showLabels;
      categoryAxis.renderer.minGridDistance = 30;

      const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Connections";

      const createSeries = (field: string, name: string, color: am4core.Color, tooltip: boolean = false) => {
        const series = chart.series.push(new am4charts.ColumnSeries());
        series.dataFields.valueY = field;
        series.dataFields.categoryX = "name";
        series.name = name;
        series.legendSettings.labelText = name;
        series.columns.template.tooltipText = tooltip
          ? `Profile: [bold]{categoryX}[/] 
          Connections: [bold]{connectionsCount}[/]
          Prospects: [bold]{prospectCount}[/]
          Response%: [bold]{responseRate}[/]
          {deleted}`
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

      createSeries("connectionsCount", "Connections Count", colors[0], true);
      createSeries("prospectCount", "Prospect Count", colors[1], false);

      chart.cursor = new am4charts.XYCursor();

      chart.legend = new am4charts.Legend();
      chart.legend.position = "top";
      chart.legend.scrollable = true;

      chart.events.on("ready", () => {
        setChartLoaded(true);
      });

      chart.events.on("blur", () => {
        chart.dispose();
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
  }, [connectsCountByProfile, showLabels]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!connectsCountByProfile.length && <span className="no-data-modal">No data available</span>}
      <div id="chartdivLinkedinConnectsProfile" style={{ width: "100%", height: "600px" }}></div>
    </div>
  );
});

export default ConnectsCountByProfile;
