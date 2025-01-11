const mapWidth = 960;
const mapHeight = 600;
const chartWidth = 800;
const chartHeight = 500;
const margin = { top: 40, right: 20, bottom: 100, left: 60 };

const years = [];
const allData = {};

function formatValue(value) {
    if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
    if (value >= 1e3) return (value / 1e3).toFixed(2) + "k";
    return value.toFixed(2);
}

for (let year = 1960; year <= 2022; year++) years.push(year);

const dataPromise = d3.csv("./datasets/gdp/merged-gdp-life_expectancy.csv")
    .then(data => {
        // Group data by year
        years.forEach(year => {
        allData[year] = data.filter(d => +d.Year === year && d.Total === "total")
            .map(d => ({
            Country: d.Country,
            Year: d.Year,
            Life_expectancy: parseFloat(d.Life_expectancy) || 0,
            Total_GDP: parseFloat(d.Total_GDP) || 0,
            Income_per_Person: parseFloat(d.Income_per_Person) || 0
            }));
        });
    });

const projection = d3.geoMercator()
    .center([15, 50])
    .scale(800)
    .translate([mapWidth / 2, mapHeight / 2]);

const path = d3.geoPath().projection(projection);
const tooltipMap = d3.select("#tooltip-map");
const svgMap = d3.select("#map").attr("width", mapWidth).attr("height", mapHeight);

Promise.all([dataPromise, d3.json("./datasets/geojson/eu.geo.json")]).then(([_, geoData]) => {
    const initialYear = 2022;
    const initialColumn = "Total_GDP";

    const yearSelectMap = d3.select("#year-map");
    yearSelectMap.selectAll("option").data(years).enter().append("option").attr("value", d => d).text(d => d);
    yearSelectMap.property("value", initialYear);

    const columnSelectMap = d3.select("#column-map");
    columnSelectMap.property("value", initialColumn);

    renderMap(geoData, initialYear, initialColumn);

    yearSelectMap.on("change", function () {
        const selectedYear = +this.value;
        const selectedColumn = columnSelectMap.property("value");
        renderMap(geoData, selectedYear, selectedColumn);
    });

    columnSelectMap.on("change", function () {
        const selectedYear = +yearSelectMap.property("value");
        const selectedColumn = this.value;
        renderMap(geoData, selectedYear, selectedColumn);
    });
});

function renderMap(geoData, year, column) {
    const data = allData[year];

    const values = data.map(d => d[column]).filter(d => d > 0);
    const minValue = d3.min(values) - 10;
    const maxValue = d3.max(values) + 10;

    const logScale = d3.scaleLog().domain([minValue, maxValue]);

    const numBuckets = 6;
    const bucketBreakpoints = [];
    for (let i = 1; i <= numBuckets; i++) {
        const breakpoint = logScale.invert(i / numBuckets);
        bucketBreakpoints.push(breakpoint);
    }
    const ranges = bucketBreakpoints.map((breakpoint, i) => {
        const rangeStart = i === 0 ? minValue : bucketBreakpoints[i - 1];
        return {
            range: [rangeStart, breakpoint],
            color: d3.interpolateBlues(i / (numBuckets - 1))
        };
    });
    function getColor(value) {
        const range = ranges.find(r => value >= r.range[0] && value < r.range[1]);
        return range ? range.color : "#ccc";
    }

    svgMap.selectAll("path").remove();
    svgMap.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .style("fill", d => {
            const countryData = data.find(e => e.Country === d.properties.name);
            return countryData ? getColor(countryData[column]) : "#ccc";
        })
        .style("stroke", "#333")
        .on("mouseover", function (event, d) {
            const countryName = d.properties.name;
            const countryData = data.find(e => e.Country === countryName);

            if (countryData) {
                const value = formatValue(countryData[column]);

                d3.select(this)
                    .style("stroke", "#000")
                    .raise();

                svgMap.selectAll("path")
                    .filter(function () {
                        return this !== event.target;
                    })
                    .style("fill", "#ccc");

                
                tooltipMap.style("display", "block")
                    .html(`
                        <strong>${countryName}</strong><br>
                        ${column === "Total_GDP" ? "GDP" : "Income per Person"}: ${value} €<br>
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            }
        })
        .on("mouseout", function () {
            svgMap.selectAll("path").style("fill", d => {
                const countryData = data.find(e => e.Country === d.properties.name);
                return countryData ? getColor(countryData[column]) : "#ccc";
            });
            tooltipMap.style("display", "none");
        });

    const legendWidth = 150;
    const legendHeight = 300;
    const legendItemHeight = legendHeight / numBuckets;

    svgMap.selectAll(".legend").remove();

    const legend = svgMap.selectAll(".legend").data([0])
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${mapWidth + legendWidth + 150}, ${mapHeight - legendHeight + 0})`);

    // Reverse ranges for the legend
    const reversedRanges = [...ranges].reverse();

    legend.selectAll(".legend-item")
        .data(reversedRanges)
        .enter()
        .append("rect")
        .attr("class", "legend-item")
        .attr("x", 0)
        .attr("y", (d, i) => i * legendItemHeight)
        .attr("width", 20)
        .attr("height", legendItemHeight)
        .style("fill", d => d.color)
        .style("stroke", "#000")
        .style("stroke-width", "1px");

    legend.selectAll(".legend-label")
        .data(reversedRanges)
        .enter()
        .append("text")
        .attr("class", "legend-label")
        .attr("x", 30)
        .attr("y", (d, i) => i * legendItemHeight + legendItemHeight / 2)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .text(d => `${formatValue(d.range[0])} - ${formatValue(d.range[1])}`);

    legend.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(column === "Total_GDP" ? "GDP (euros)" : "Income Per Person (€)");
}
