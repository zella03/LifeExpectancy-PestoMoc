const width = 960;
const height = 600;

const projection = d3.geoMercator()
    .center([15, 50])
    .scale(800)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const tooltip = d3.select("#tooltip-map");

function filterTotalData(data) {
    return data.filter(d => d.Total === "total").map(d => ({
        Country: d.Country,
        Year: d.Year,
        Life_expectancy: parseFloat(d.Life_expectancy),
    }));
}

const years = [];
const allData = {};

for (let year = 1960; year <= 2023; year++) {
    years.push(year);
    const yearDataPromise = d3.csv(`datasets/life-expectancy-population/by-years/life-expectancy-population-${year}.csv`)
        .then(data => {
            allData[year] = filterTotalData(data);
        });
    Promise.all(yearDataPromise);
}

Promise.all([
    d3.json("datasets/geojson/eu.geo.json"),
]).then(([geoData]) => {

    const yearSelect = d3.select("#year-map");
    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    const initialYear = 2022;
    yearSelect.property("value", initialYear);

    const svg = d3.select("#map");

    svg.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "country")
        .style("fill", "#58768a")
        .style("stroke", "#333")
        .on("mouseover", function(event, d) {
            const countryName = d.properties.name;
            const countryData = allData[initialYear].find(d => d.Country === countryName);
            
            if (countryData) {
                const lifeExpectancy = countryData.Life_expectancy.toFixed(2);
                d3.select(this).style("fill", "#58768a");

                svg.selectAll("path")
                    .filter(function() {
                        return this !== event.target;
                    })
                    .style("fill", "#ccc");

                tooltip.style("display", "block")
                    .html(`${countryName}: ${lifeExpectancy} years`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            }
        })
        .on("mouseout", function() {
            svg.selectAll("path")
                .style("fill", "#58768a");

            tooltip.style("display", "none");
        });

    yearSelect.on("change", function() {
        const selectedYear = this.value;

        svg.selectAll("path")
            .style("fill", "#58768a")
            .on("mouseover", function(event, d) {
                const countryName = d.properties.name;
                const countryData = allData[selectedYear].find(d => d.Country === countryName);

                if (countryData) {
                    const lifeExpectancy = countryData.Life_expectancy.toFixed(2);
                    
                    d3.select(this).style("fill", "#58768a");

                    svg.selectAll("path")
                        .filter(function() {
                            return this !== event.target;
                        })
                        .style("fill", "#ccc");

                    tooltip.style("display", "block")
                        .html(`${countryName}: ${lifeExpectancy} years`)
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            });
    });
});