const margin = { top: 40, right: 100, bottom: 50, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#life-expectancy-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("display", "block")
    .style("margin", "0 auto")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #333")
    .style("padding", "8px")
    .style("border-radius", "6px")
    .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.3)")
    .style("visibility", "hidden")
    .style("font-size", "14px");

d3.csv('datasets/life-exp/life-expectancy.csv').then(function(data) {
    const covidYearsData = data.filter(d => {
        return d['Year'] === '2019' || d['Year'] === '2020' && d['Period life expectancy at birth - Sex: total - Age: 0'] !== '';
    });

    covidYearsData.forEach(d => {
        d.Year = +d['Year'];
        d.life_expectancy = +d['Period life expectancy at birth - Sex: total - Age: 0'];
    });

    const countries = d3.groups(covidYearsData, d => d['Entity'])
        .map(([entity, values]) => {
            const life2019 = values.find(d => d.Year === 2019)?.life_expectancy;
            const life2020 = values.find(d => d.Year === 2020)?.life_expectancy;

            if (life2019 && life2020) {
                const difference = life2019 - life2020; 
                return { entity, life2019, life2020, difference };
            }
            return null;
        })
        .filter(d => d !== null) 
        .filter(d => d.difference > 0); 

    const topCountries = countries.sort((a, b) => b.difference - a.difference).slice(0, 5);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const x = d3.scaleBand()
        .domain([2019, 2020])
        .range([0, width])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([d3.min(topCountries, d => Math.min(d.life2019, d.life2020)), d3.max(topCountries, d => Math.max(d.life2019, d.life2020))])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .style("font-size", "14px");

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "14px");

    const line = d3.line()
        .x(d => x(d.Year) + x.bandwidth() / 2) 
        .y(d => y(d.life_expectancy))
        .curve(d3.curveMonotoneX);

    svg.selectAll(".line")
        .data(topCountries)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.entity))
        .attr("stroke-width", 4)
        .attr("d", d => line([{ Year: 2019, life_expectancy: d.life2019 }, { Year: 2020, life_expectancy: d.life2020 }]))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "orange");
            tooltip.style("visibility", "visible")
                .html(`Country: ${d.entity}<br>2019: ${d.life2019}<br>2020: ${d.life2020}<br>Difference: ${d.difference.toFixed(2)}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", d => colorScale(d.entity));
            tooltip.style("visibility", "hidden");
        });

    svg.selectAll(".dot")
        .data(topCountries.flatMap(d => [{ ...d, Year: 2019, life_expectancy: d.life2019 }, { ...d, Year: 2020, life_expectancy: d.life2020 }]))
        .enter()
        .append("circle")
        .attr("cx", d => x(d.Year) + x.bandwidth() / 2)
        .attr("cy", d => y(d.life_expectancy))
        .attr("r", 8)
        .attr("fill", d => colorScale(d.entity))
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`Year: ${d.Year}<br>Life Expectancy: ${d.life_expectancy}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        });

    svg.selectAll(".country-label")
        .data(topCountries)
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", x(2020) + x.bandwidth() + 5)
        .attr("y", d => y(d.life2020))
        .attr("dy", ".35em")
        .text(d => d.entity)
        .style("font-size", "14px")
        .style("fill", d => colorScale(d.entity));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .style("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Life Expectancy (years)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .style("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Biggest Life Expectancy Decrease");

}).catch(function(error) {
    console.error("Error loading the data: ", error);
});
