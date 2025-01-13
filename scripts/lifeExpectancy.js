const mapWidth = 960;
const mapHeight = 600;
const chartWidth = 1000;
const chartHeight = 500;
const margin = { top: 40, right: 20, bottom: 100, left: 80 };

const years = [];
const allData = {};
for (let year = 1960; year <= 2022; year++) years.push(year);

const dataPromises = [
    d3.json("datasets/geojson/eu.geo.json"),
    ...years.map(year => d3.csv(`datasets/life-expectancy-population/by-years/life-expectancy-population-${year}.csv`)
        .then(data => {
            /*allData[year] = data.filter(d => d.Total === "total").map(d => ({
                Country: d.Country,
                Year: d.Year,
                Life_expectancy: parseFloat(d.Life_expectancy)
            }));*/

            allData[year] = data.map(d => ({
                Country: d.Country,
                Year: d.Year,
                Total: d.Total,
                Life_expectancy: parseFloat(d.Life_expectancy) || 0
            }));
        }))
];

/* Map */
const width = window.innerWidth, height = window.innerHeight * 0.8;
const projection = d3.geoMercator().scale(700).translate([width/2 - 300, height/2 + 700]);
const path = d3.geoPath().projection(projection);
const tooltipMap = d3.select("#tooltip-map");
const svgMap = d3.select("#map").attr("width", mapWidth).attr("height", mapHeight);

Promise.all(dataPromises).then(([geoData]) => {
    const initialYear = 2022;

    const yearSelectMap = d3.select("#year-map");
    const yearSelectBar = d3.select("#year-bar");

    yearSelectMap.selectAll("option").data(years).enter().append("option").attr("value", d => d).text(d => d);
    yearSelectBar.selectAll("option").data(years).enter().append("option").attr("value", d => d).text(d => d);

    yearSelectMap.property("value", initialYear);
    yearSelectBar.property("value", initialYear);

    renderMap(geoData, initialYear);
    renderBarChart(initialYear);

    yearSelectMap.on("change", function () {
        const selectedYear = +this.value;
        renderMap(geoData, selectedYear);
    });

    yearSelectBar.on("change", function () {
        const selectedYear = +this.value;
        renderBarChart(selectedYear);
    });
});

function renderMap(geoData, year) {
    const data = allData[year];

    // dividing life exp into buckets
    const lifeExpectancyValues = data.map(d => d.Life_expectancy).filter(d => d > 0);// mssing data
    const minLifeExpectancy = d3.min(lifeExpectancyValues);
    const maxLifeExpectancy = d3.max(lifeExpectancyValues);
    const numBuckets = 6;
    const step = (maxLifeExpectancy - minLifeExpectancy) / numBuckets;

    const ranges = d3.range(numBuckets).map(i => ({
        range: [minLifeExpectancy + i * step, minLifeExpectancy + (i + 1) * step],
        color: d3.schemeBlues[numBuckets][i]
    }));

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
            const countryData = data.find(e => e.Country === d.properties.name && e.Total === "total");
            return countryData ? getColor(countryData.Life_expectancy) : "#ccc";
        })
        .style("stroke", "#333")
        .on("mouseover", function (event, d) {
            const countryName = d.properties.name;
            const countryData = data.filter(e => e.Country === countryName);

            if (countryData.length > 0) {
                const totalData = countryData.find(e => e.Total === "total");

                const totalLifeExpectancy = totalData ? totalData.Life_expectancy.toFixed(2) : 'N/A';

                d3.select(this).style("opacity", 1).style("stroke-width", "2px");
                svgMap.selectAll("path")
                    .filter(pathData => pathData !== d)
                    .style("opacity", 0.3);
            
                tooltipMap.transition().duration(200).style("opacity", 0.9);
                tooltipMap.style("display", "block")
                    .html(`
                        <strong>${countryName}</strong><br>
                        Total: ${totalLifeExpectancy} years<br>
                    `)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function () {
            svgMap.selectAll("path")
          .style("opacity", 1)
          .style("stroke-width", "1px");
            tooltipMap.transition().duration(200).style("opacity", 0);
        });

    const legendWidth = 400;
    const legendHeight = 20;

    const legend = svgMap.selectAll(".legend").data([0]).enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${mapWidth-100}, ${mapHeight - legendHeight * 3})`);

    const legendItemWidth = legendWidth / numBuckets;

    legend.selectAll("rect").remove();

    legend.selectAll("rect")
        .data(ranges)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * legendItemWidth)
        .attr("y", 5)
        .attr("width", legendItemWidth)
        .attr("height", legendHeight)
        .style("fill", d => d.color);

    legend.selectAll("text").remove();

    legend.selectAll("text")
        .data(ranges)
        .enter()
        .append("text")
        .attr("x", (d, i) => i * legendItemWidth + legendItemWidth / 2)
        .attr("y", legendHeight*2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => `[${d.range[0].toFixed(1)}-${d.range[1].toFixed(1)}]`);
    
    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", 0) // Positioned above the legend rectangles
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Years");
}


const tooltipBar = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
const svgBar = d3.select("#chart").attr("width", chartWidth).attr("height", chartHeight);
const x = d3.scaleLinear().range([margin.left, chartWidth - margin.right]);
const y = d3.scaleBand().range([margin.top, chartHeight - margin.bottom]).padding(0.1);

function renderBarChart(year) {
    const data = allData[year];
    const showGender = d3.select("#gender-toggle").property("checked");

    const transitionDuration = 1000;

    const top10Countries = data
        .filter(d => d.Total === "total" && !isNaN(d.Life_expectancy))
        .sort((a, b) => b.Life_expectancy - a.Life_expectancy)
        .slice(0, 10)
        .map(d => d.Country);

    const filteredData = data.filter(d => top10Countries.includes(d.Country));

    if (showGender) {
        svgBar.selectAll(".bar-total").remove();
        const groupedData = filteredData.filter(d => d.Total !== "total");
        const countries = top10Countries;

        groupedData.sort((a, b) => b.Life_expectancy - a.Life_expectancy);

        y.domain(countries);
        const minValue = d3.min(groupedData, d => d.Life_expectancy);
        const maxValue = d3.max(groupedData, d => d.Life_expectancy);
        x.domain([50, maxValue + 0.5 + 5]);

        const subgroups = ["male", "female"];
        const subgroupScale = d3.scaleBand()
            .domain(subgroups)
            .range([0, y.bandwidth()])
            .padding(0.05);

        const groups = svgBar.selectAll(".group")
            .data(countries, d => d);

        groups.enter()
            .append("g")
            .attr("class", "group")
            .attr("transform", d => `translate(0,${y(d)})`)
            .merge(groups)
            .transition()
            .duration(transitionDuration)
            .attr("transform", d => `translate(0,${y(d)})`);

        groups.exit().remove();

        const bars = svgBar.selectAll(".group")
            .selectAll("rect")
            .data(country => subgroups.map(subgroup => {
                const subgroupData = groupedData.find(d => d.Country === country && d.Total === subgroup) || {};
                return { subgroup, country, Life_expectancy: subgroupData.Life_expectancy || 0 };
            }), d => d.subgroup);

        bars.enter()
            .append("rect")
            .attr("y", d => subgroupScale(d.subgroup))
            .attr("x", x(50))
            .attr("height", subgroupScale.bandwidth())
            .attr("width", 0)
            .attr("class", d => `bar bar-${d.subgroup} bar-${d.country}`)
            .on("mouseover", function (event, d) {
                tooltipBar.transition().duration(200).style("opacity", 0.9);
                tooltipBar.html(`${d.country} (${d.subgroup}): ${d.Life_expectancy.toFixed(2)} years`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
                svgBar.selectAll(".bar").style("opacity", 0.4);
                d3.select(this).style("opacity", 1);
            })
            .on("mouseout", function () {
                tooltipBar.transition().duration(200).style("opacity", 0);
                svgBar.selectAll(".bar").style("opacity", 1);
            })
            .merge(bars)
            .transition()
            .duration(transitionDuration)
            .attr("y", d => subgroupScale(d.subgroup))
            .attr("x", d => x(50))
            .attr("width", d => x(d.Life_expectancy) - x(50));

        bars.exit().remove();
    } else {
        svgBar.selectAll(".bar-male, .bar-female").remove();
        const totalData = filteredData.filter(d => d.Total === "total");

        totalData.sort((a, b) => b.Life_expectancy - a.Life_expectancy);

        y.domain(totalData.map(d => d.Country));
        const minValue = d3.min(totalData, d => d.Life_expectancy);
        const maxValue = d3.max(totalData, d => d.Life_expectancy);
        x.domain([60, maxValue + 0.5 + 5]);

        const bars = svgBar.selectAll(".bar")
            .data(totalData, d => d.Country);

        bars.enter()
            .append("rect")
            .attr("class", "bar bar-total")
            .attr("y", d => y(d.Country))
            .attr("x", x(60))
            .attr("height", y.bandwidth())
            .attr("width", 0)
            .on("mouseover", function (event, d) {
                tooltipBar.transition().duration(200).style("opacity", 0.9);
                tooltipBar.html(`${d.Country}: ${d.Life_expectancy.toFixed(2)} years`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltipBar.transition().duration(200).style("opacity", 0);
            })
            .merge(bars)
            .transition()
            .duration(transitionDuration)
            .attr("y", d => y(d.Country))
            .attr("x", d => x(60))
            .attr("width", d => x(d.Life_expectancy) - x(60));

        bars.exit().remove();
    }

    svgBar.select(".x-axis").remove();
    svgBar.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
        .call(d3.axisBottom(x));

    svgBar.select(".y-axis").remove();
    svgBar.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svgBar.select(".chart-title").remove();
    svgBar.append("text")
        .attr("class", "chart-title")
        .attr("x", chartWidth / 2)
        .attr("y", margin.top - 10)
        .style("text-anchor", "middle")
        .text(showGender ? `Male and Female Life Expectancy in ${year}` : `Top 10 Countries by Life Expectancy in ${year}`);
}


// Gender toggle change event
d3.select("#gender-toggle").on("change", function () {
    const selectedYear = +d3.select("#year-bar").property("value");
    renderBarChart(selectedYear);
});
