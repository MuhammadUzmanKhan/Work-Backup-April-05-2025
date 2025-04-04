import { useSelector } from "react-redux";
import { RootState } from "../../services/redux/store";
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React, { useEffect, useState } from "react";
import "./dashboard.scss"; // Ensure this stylesheet includes the spinner styles

const BidsCountByCategoryChart = React.memo(({ loading }: { loading: boolean }) => {
  const bidsCountByCategory = useSelector((state: RootState) => state.bidderBids.bidsCountByCategory);
  const [chartLoaded, setChartLoaded] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState(window.innerWidth >= 850);

  const drawChart = () => {
    // Apply chart themes
    am4core.ready(() => {
      am4core.useTheme(am4themes_animated);

      // Create chart instance
      const chart = am4core.create("bidsByCategoryChart", am4charts.XYChart);

      // Add data
      chart.data = bidsCountByCategory.map((bid) => {
        return {
          category: bid.category,
          bidsCount: bid.bidsCount,
          leadsCount: bid.leadsCount,
          contractsCount: bid.contractsCount,
          invitesCount: bid.invitesCount,
          inviteContracts: bid.inviteContracts,
          directLeadsCount: bid.directLeadsCount,
          directContractsCount: bid.directContractsCount,
          responseRate: bid.bidsCount ? ((+bid.leadsCount / +bid.bidsCount) * 100).toFixed(2)+'%' : 'N/A',
          color: chart.colors.next(), // assign a new color to each column
        };
      });

      // Create axes
      const categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      categoryAxis.dataFields.category = "category";
      categoryAxis.tooltip!.disabled = true;
      categoryAxis.renderer.grid.template.location = 0;
      if (showLabels) {
        categoryAxis.renderer.labels.template.rotation = -90;
      } else {
        categoryAxis.renderer.labels.template.disabled = true;
      }
      categoryAxis.renderer.minGridDistance = 30;

      const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.title.text = "Count";

      // Create series
      const series = chart.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = "bidsCount";
      series.dataFields.categoryX = "category";
      series.name = "Proposal Count";
      series.columns.template.tooltipText = `Category: [bold]{categoryX}[/] 
      Proposals: [bold]{bidsCount}[/]
      Leads: [bold]{leadsCount}[/]
      Contracts: [bold]{contractsCount}[/]
      Invites: [bold]{invitesCount}[/]
      Invites Contracts: [bold]{inviteContracts}[/]
      Direct Leads: [bold]{directLeadsCount}[/]
      Direct Contracts: [bold]{directContractsCount}[/]
      Response Rate: [bold]{responseRate}[/]`;
      series.columns.template.fill = am4core.color("#555");
      series.columns.template.strokeOpacity = 0;
      series.columns.template.column.cornerRadiusTopLeft = 10;
      series.columns.template.column.cornerRadiusTopRight = 10;
      series.columns.template.column.fillOpacity = 0.8;

      // Create hover state
      const hoverState = series.columns.template.column.states.create("hover");
      hoverState.properties.fillOpacity = 1;

      // Smoothly transition the colors from one column to another
      series.columns.template.adapter.add("fill", (fill, target) => {
        let dataItem: any = null;
        dataItem = target.dataItem;
        if (dataItem) {
          // the color property exists
          return am4core
            .color(dataItem?.dataContext?.color)
            .brighten(dataItem.index * 0.1);
        }
        return fill;
      });

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
    if (bidsCountByCategory) {
      drawChart();
    }
    const handleResize = () => {
      setShowLabels(window.innerWidth >= 850);
    };
    window.addEventListener("resize", handleResize);
    // clean up the event listener when the component unmounts
    return () => window.removeEventListener("resize", handleResize);
  }, [bidsCountByCategory, showLabels]);

  return (
    <div className={`chart-container ${chartLoaded ? 'loaded' : ''}`}>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
      {!bidsCountByCategory.length && <span className="no-data-modal">No data available</span>}
      <div id="bidsByCategoryChart" style={{ width: "100%", height: "600px" }}></div>
    </div>
  );
});

export default BidsCountByCategoryChart;
