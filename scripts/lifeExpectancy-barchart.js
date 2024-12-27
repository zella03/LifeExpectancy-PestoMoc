// Bar Chart Setup
const width = 800;
const height = 500;
const margin = { top: 40, right: 20, bottom: 100, left: 60 };

const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height);

const x = d3.scaleBand().range([margin.left, width - margin.right]).padding(0.1);
const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

const years = [];
const allData = {};

for (let year = 1960; year <= 2022; year++) {
    years.push(year);
}

const barDataPromises = years.map(year => {
    return d3.csv(`datasets/life-expectancy-population/by-years/life-expectancy-population-${year}.csv`)
        .then(data => {
            allData[year] = data.filter(d => d.Total === "total").map(d => ({
                Country: d.Country,
                Year: d.Year,
                Life_expectancy: parseFloat(d.Life_expectancy)
            }));
        });
});

Promise.all(barDataPromises).then(() => {
    const yearSelect = d3.select("#year-bar");
    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    const initialYear = 2022;
    yearSelect.property("value", initialYear);

    renderBarChart(initialYear);

    yearSelect.on("change", function () {
        const selectedYear = +this.value;
        renderBarChart(selectedYear);
    });
});

function renderBarChart(year) {
    const data = allData[year];

    const top10Countries = data.sort((a, b) => b.Life_expectancy - a.Life_expectancy).slice(0, 10);

    x.domain(top10Countries.map(d => d.Country));
    y.domain([0, d3.max(top10Countries, d => d.Life_expectancy)]);

    svg.selectAll("*").remove();

    svg.selectAll(".bar")
        .data(top10Countries)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Country))
        .attr("y", d => y(d.Life_expectancy))
        .attr("width", x.bandwidth())
        .attr("height", d => height - margin.bottom - y(d.Life_expectancy))
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`${d.Country}: ${d.Life_expectancy.toFixed(2)} years`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top - 10)
        .style("text-anchor", "middle")
        .text(`Top 10 Countries by Life Expectancy in ${year}`);
}
