
import React, { useLayoutEffect, useState } from "react";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import "./dashboard.scss"; // Assuming this contains your styles
import { countryNameToCodeMap } from "../../assets/countryToCode";
import countries from "../../assets/countries";

const BidsCountByStateChart = React.memo(({ loading }: { loading: boolean }) => {
  const bidsCountByState = useSelector((state: RootState) => state.bidderBids.bidsCountByState);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);

  useLayoutEffect(() => {
    am4core.useTheme(am4themes_animated);

    var chart = am4core.create("chartdivByState", am4maps.MapChart);
    chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

    chart.chartContainer.wheelable = false;

    chart.geodata = am4geodata_worldLow;
    chart.projection = new am4maps.projections.Miller();
    var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    var polygonTemplate = polygonSeries.mapPolygons.template;
    polygonTemplate.tooltipText = `
    Country: {state}
    Bids Count: {bidsCount}
    Leads Count: {leadsCount}
    Jobs Count: {jobsCount}
    Invites Count: {invitesCount}
  `;
    polygonSeries.tooltip!.background.fillOpacity = 0.5;
    polygonSeries.tooltip!.label.padding(-5, 5, 5, 5);
    polygonSeries.heatRules.push({
      property: "fill",
      target: polygonSeries.mapPolygons.template,
      min: am4core.color("#EEEEEE"),
      max: am4core.color("#ef3a24")
    });
    polygonSeries.useGeodata = true;

    const heatLegendContainer = am4core.create("heatLegend", am4core.Container);
    heatLegendContainer.width = am4core.percent(100);

    // Add heat legend
    var heatLegend = new am4maps.HeatLegend();
    heatLegend.width = am4core.percent(100);
    heatLegend.series = polygonSeries;
    heatLegend.padding(20, 20, 20, 20);
    heatLegend.valueAxis.renderer.labels.template.fontSize = 10;
    heatLegend.valueAxis.renderer.minGridDistance = 40;

    heatLegendContainer.children.push(heatLegend);

    polygonSeries.mapPolygons.template.events.on("over", event => {
      handleHover(event.target);
    });

    polygonSeries.mapPolygons.template.events.on("hit", event => {
      handleHover(event.target);
    });

    function handleHover(mapPolygon: any) {
      if (!isNaN(mapPolygon.dataItem.value)) {
        heatLegend.valueAxis.showTooltipAt(mapPolygon.dataItem.value);
      } else {
        heatLegend.valueAxis.hideTooltip();
      }
    }

    polygonSeries.mapPolygons.template.strokeOpacity = 0.4;
    polygonSeries.mapPolygons.template.events.on("out", event => {
      heatLegend.valueAxis.hideTooltip();
    });

    chart.zoomControl = new am4maps.ZoomControl();
    chart.zoomControl.valign = "top";

    const countryMap = bidsCountByState.map(item => ({
      id: countryNameToCodeMap[item.state]
        ? countryNameToCodeMap[item.state]
        : item.state.length >= 2
          ? item.state.substring(0, 2).toUpperCase()
          : item.state.toUpperCase(),
      state: item.state,
      value: parseInt(item.bidsCount),
      bidsCount: parseInt(item.bidsCount),
      leadsCount: parseInt(item.leadsCount),
      jobsCount: parseInt(item.jobsCount),
      invitesCount: parseInt(item.invitesCount)
    }));
    // Now, loop through countryNameToCodeMap to add any missing countries
    countries.forEach(country => {
      const existsInMap = countryMap.some(item => item.id === country.code);
      if (!existsInMap) {
        countryMap.push({
          id: country.code,
          state: country.name,
          value: 0,
          bidsCount: 0,
          leadsCount: 0,
          jobsCount: 0,
          invitesCount: 0,
        });
      }
    });
    polygonSeries.data = countryMap
    chart.events.on("ready", () => {
      setChartLoaded(true);
    });

    return () => {
      chart.dispose();
    };
  }, [bidsCountByState]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      <div id="chartdivByState" style={{ width: "100%", height: "500px" }}></div>
      <div id="heatLegend" style={{ width: "100%" }}></div>
    </div>
  );
});

export default BidsCountByStateChart;
