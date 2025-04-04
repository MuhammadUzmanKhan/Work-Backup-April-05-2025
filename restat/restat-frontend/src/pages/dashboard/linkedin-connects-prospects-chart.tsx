import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React, { useEffect, useState } from "react";
import "./dashboard.scss";

const TotalConnectsProspectsCount = React.memo(({ loading }: { loading: boolean }) => {
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const connectsCount = useSelector((state: RootState) => state.linkedinCounts.connectsCount);
  const prospectsCount = useSelector((state: RootState) => state.linkedinCounts.prospectsCount);
  
  useEffect(() => {
    am4core.useTheme(am4themes_animated);

    // Create chart instance
    const chart = am4core.create("connects-prospects-chart", am4charts.SlicedChart);

    // Data and series
    const series = chart.series.push(new am4charts.FunnelSeries());
    series.dataFields.value = "value";
    series.dataFields.category = "category";
    series.alignLabels = false;
    series.orientation = "vertical";
    series.marginBottom = 15; 
    series.colors.list = [
      am4core.color("#ef3a24"),
      am4core.color("#1a4895"),
    ];

    series.data = [
      { value: connectsCount, category: "Connects Count" },
      { value: prospectsCount, category: "Prospects Count" },
    ].map(item => ({
      ...item,
      percent: item.value || connectsCount ?  (item.category === "Connects Count" ? "(100%)" :
              item.category === 'Prospects Count' ? `(${((item.value / connectsCount) * 100).toFixed(2)}% of Connects)` : '') : ''
    }));

    series.slices.template.tooltipText = "{category}: [bold]{value}[/] {percent}";
    series.labels.template.text = "{category}: [bold]{value}";

    // Hover state
    const hoverState = series.slices.template.states.create("hover");
    hoverState.properties.fillOpacity = 1;

    // Legend
    const legend = new am4charts.Legend();
    legend.position = "bottom";
    chart.legend = legend;
    legend.labels.template.text = "{name} [bold]{percent}[/]";
    chart.legend.valueLabels.template.disabled = true;

    // Animate
    chart.appear();

    chart.events.on("ready", () => {
      setChartLoaded(true);
    });

    return () => {
      chart.dispose();
      legend.dispose();
    };
  }, [connectsCount, prospectsCount]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!connectsCount && <span className="no-data-modal">No data available</span>}
      <div>
        <div id="connects-prospects-chart" style={{ width: "100%", height: "400px" }}></div>
      </div>
    </div>
  );
});

export default TotalConnectsProspectsCount;
