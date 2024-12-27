const width = window.innerWidth, height = window.innerHeight * 0.8;

function formatNumber(num, currencySymbol) {
  if (Math.abs(num) >= 1e9) {
    return (num / 1e9).toFixed(2) + "B " + currencySymbol;
  } else if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(2) + "M " + currencySymbol;
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(2) + "K " + currencySymbol;
  } else {
    return num.toFixed(2) + " " + currencySymbol;
  }
}

const svg = d3.select("#choropleth-map")
  .attr("width", width)
  .attr("height", height);

const euCountries = new Set(['Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium',
  'Bosnia and Herzegovina', 'Bulgaria', 'Channel Islands', 'Croatia', 'Cyprus',
  'Czechia', 'Denmark', 'Estonia', 'Faroe Islands', 'Finland', 'France',
  'Germany', 'Gibraltar', 'Greece', 'Hungary', 'Iceland', 'Ireland',
  'Isle of Man', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands',
  'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania',
  'Russian Federation', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
  'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom']);

const projection = d3.geoMercator().scale(700).translate([width/2 - 300, height/2 + 700]);
const path = d3.geoPath().projection(projection);

const tooltip_map = d3.select("#tooltip_map");

const yearSelector = document.getElementById("year-selector");
const availableYears = Array.from({ length: 2021 - 2000 + 1 }, (_, i) => 2000 + i);
availableYears.forEach(year => {
  const option = document.createElement("option");
  option.value = year;
  option.textContent = year;
  yearSelector.appendChild(option);
});
yearSelector.value = 2021;

function loadData(year, valueType) {
  const currencySymbol = "€";
  Promise.all([
    d3.json("datasets/geojson/eu.geo.json"), 
    d3.csv(`datasets/healthcare/with-life-expectancy-by-years/life-expectancy-health-expenditure-${year}.csv`)
  ]).then(([geojson, csvData]) => {
    const expenditures = {};
    csvData.forEach(d => {
      expenditures[d.Country] = {
        "Health Expenditure per Capita": +d["Health Expenditure per Capita"],
        "Total Health Expenditure": +d["Total Health Expenditure"]
      };
    });

    geojson.features.forEach(feature => {
      const countryName = feature.properties.name;
      feature.properties.expenditure = expenditures[countryName] || null;
    });

    const maxExpenditure = d3.max(Object.values(expenditures), d => d ? d[valueType] : 0);
    const colorScale = d3.scaleThreshold()
      .domain([0, maxExpenditure * 0.05, maxExpenditure * 0.1, maxExpenditure * 0.3, maxExpenditure * 0.6, maxExpenditure])
      .range(["#d6f5d6", "#99e699", "#4ddb4d", "#1f7a1f", "#095e09", "#004d00"]);

    svg.selectAll("path")
      .data(geojson.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const country = d.properties.name;
        const expenditure = d.properties.expenditure ? d.properties.expenditure[valueType] : null;

        if (euCountries.has(country)) {
          return expenditure ? colorScale(expenditure) : "#ccc";
        } else {
          return "#ccc";
        }
      })
      .attr("stroke", "#333")
      .on("mouseover", function (event, d) {
        const country = d.properties.name;
        const expenditure = d.properties.expenditure ? d.properties.expenditure[valueType] : null;

        if (!euCountries.has(country)) return;

        d3.select(this).style("opacity", 1).style("stroke-width", "2px");

        svg.selectAll("path")
          .filter(pathData => pathData !== d)
          .style("opacity", 0.3);

        tooltip_map.transition().duration(200).style("opacity", 0.9);
        tooltip_map
          .html(`<b>Country:</b> ${country}<br><b>${valueType}:</b> ${expenditure ? formatNumber(expenditure, currencySymbol) : "No data"}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mousemove", function (event) {
        tooltip_map
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function () {
        svg.selectAll("path")
          .style("opacity", 1)
          .style("stroke-width", "1px");

        tooltip_map.transition().duration(200).style("opacity", 0);
      });

    svg.selectAll(".legend").remove();

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 550}, ${height - 100})`);

    const legendValues = [0, maxExpenditure * 0.05, maxExpenditure * 0.1, maxExpenditure * 0.3, maxExpenditure * 0.6];

    legend.selectAll("rect")
      .data(legendValues)
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * 60)
      .attr("y", 0)
      .attr("width", 60)
      .attr("height", 20)
      .attr("fill", (d, i) => colorScale(d));
      

    legend.selectAll("text")
      .data(legendValues)
      .enter()
      .append("text")
      .attr("x", (d, i) => i * 60)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .text(d => formatNumber(d, currencySymbol));


    legend.append("text")
      .attr("x", 5 * 60)
      .attr("y", 35)
      .attr("text-anchor", "middle")
      .text(formatNumber(maxExpenditure, currencySymbol));

    legend.append("text")
      .text(valueType)
      .attr("x", 0)
      .attr("y", -10)
      .style("font-size", "12px")
      .style("font-weight", "bold");
  }).catch(err => console.error("Error loading data:", err));
}

const initialYear = 2021;
const initialValueType = "Health Expenditure per Capita";
loadData(initialYear, initialValueType);

document.getElementById("value-toggle").addEventListener("change", function() {
  loadData(yearSelector.value, this.value);
});
yearSelector.addEventListener("change", function() {
  loadData(this.value, document.getElementById("value-toggle").value);
});
