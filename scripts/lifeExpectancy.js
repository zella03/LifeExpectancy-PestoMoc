const mapWidth = 960;
const mapHeight = 600;
const chartWidth = 800;
const chartHeight = 500;
const margin = { top: 40, right: 20, bottom: 100, left: 60 };

const years = [];
const allData = {};
for (let year = 1960; year <= 2022; year++) years.push(year);

const dataPromises = [
    d3.json("datasets/geojson/eu.geo.json"),
    ...years.map(year => d3.csv(`datasets/life-expectancy-population/by-years/life-expectancy-population-${year}.csv`)
        .then(data => {
            allData[year] = data.filter(d => d.Total === "total").map(d => ({
                Country: d.Country,
                Year: d.Year,
                Life_expectancy: parseFloat(d.Life_expectancy)
            }));
        }))
];

/* Map */
const projection = d3.geoMercator()
    .center([15, 50])
    .scale(800)
    .translate([mapWidth / 2, mapHeight / 2]);
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

    svgMap.selectAll("path").remove();

    svgMap.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .style("fill", "#58768a")
        .style("stroke", "#333")
        .on("mouseover", function (event, d) {
            const countryName = d.properties.name;
            const countryData = data.find(e => e.Country === countryName);

            if (countryData) {
                const lifeExpectancy = countryData.Life_expectancy.toFixed(2);
                d3.select(this).style("fill", "#58768a");

                svgMap.selectAll("path")
                    .filter(function () {
                        return this !== event.target;
                    })
                    .style("fill", "#ccc");

                tooltipMap.style("display", "block")
                    .html(`${countryName}: ${lifeExpectancy} years`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function () {
            svgMap.selectAll("path").style("fill", "#58768a");
            tooltipMap.style("display", "none");
        });
}

/* Bar chart */
const tooltipBar = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
const svgBar = d3.select("#chart").attr("width", chartWidth).attr("height", chartHeight);
const x = d3.scaleBand().range([margin.left, chartWidth - margin.right]).padding(0.1);
const y = d3.scaleLinear().range([chartHeight - margin.bottom, margin.top]);

function renderBarChart(year) {
    const data = allData[year];
    const top10Countries = data
        .filter(d => !isNaN(d.Life_expectancy))
        .sort((a, b) => b.Life_expectancy - a.Life_expectancy)
        .slice(0, 10); // Take the top 10

    x.domain(top10Countries.map(d => d.Country));
    y.domain([0, d3.max(top10Countries, d => d.Life_expectancy)]);

    svgBar.selectAll("*").remove();

    svgBar.selectAll(".bar")
        .data(top10Countries)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Country))
        .attr("y", d => y(d.Life_expectancy))
        .attr("width", x.bandwidth())
        .attr("height", d => chartHeight - margin.bottom - y(d.Life_expectancy))
        .on("mouseover", function (event, d) {
            tooltipBar.transition().duration(200).style("opacity", .9);
            tooltipBar.html(`${d.Country}: ${d.Life_expectancy.toFixed(2)} years`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltipBar.transition().duration(200).style("opacity", 0);
        });

    svgBar.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
        .call(d3.axisBottom(x));

    svgBar.append("text")
        .attr("class", "x-axis-label")
        .attr("x", chartWidth / 2)
        .attr("y", chartHeight - margin.bottom + 40)
        .style("text-anchor", "middle")
        .text("Countries");

    svgBar.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svgBar.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -chartHeight / 2)
        .attr("y", margin.left - 50)
        .style("text-anchor", "middle")
        .text("Life Expectancy (Years)");

    svgBar.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", margin.top - 10)
        .style("text-anchor", "middle")
        .text(`Top 10 Countries by Life Expectancy in ${year}`);
}
