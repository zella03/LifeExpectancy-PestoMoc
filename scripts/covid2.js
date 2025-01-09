const margin = { top: 20, right: 30, bottom: 40, left: 40 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#life-expectancy-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.2)")
    .style("visibility", "hidden");

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

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10); 

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
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    const line = d3.line()
        .x(d => x(d.Year) + x.bandwidth() / 2) 
        .y(d => y(d.life_expectancy));

    svg.selectAll(".line")
        .data(topCountries)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.entity)) 
        .attr("stroke-width", 3)
        .attr("d", d => line([{ Year: 2019, life_expectancy: d.life2019 }, { Year: 2020, life_expectancy: d.life2020 }]))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "orange"); 
            tooltip.style("visibility", "visible")
                .text(d.entity); 
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", d => colorScale(d.entity));
            tooltip.style("visibility", "hidden");
        });

    svg.selectAll(".line-2019")
        .data(topCountries)
        .enter()
        .append("line")
        .attr("class", "line-2019")
        .attr("x1", x(2019) + x.bandwidth() / 2)
        .attr("x2", x(2019) + x.bandwidth() / 2)
        .attr("y1", d => y(d.life2019))
        .attr("y2", height)
        .attr("stroke", d => colorScale(d.entity)) 
        .attr("stroke-width", 1)
        .style("stroke-dasharray", "4,4");

    svg.selectAll(".line-2020")
        .data(topCountries)
        .enter()
        .append("line")
        .attr("class", "line-2020")
        .attr("x1", x(2020) + x.bandwidth() / 2)
        .attr("x2", x(2020) + x.bandwidth() / 2)
        .attr("y1", d => y(d.life2020))
        .attr("y2", height)
        .attr("stroke", d => colorScale(d.entity)) 
        .attr("stroke-width", 1)
        .style("stroke-dasharray", "4,4");

    svg.selectAll(".dot-2019")
        .data(topCountries)
        .enter()
        .append("circle")
        .attr("class", "dot-2019")
        .attr("cx", x(2019) + x.bandwidth() / 2)
        .attr("cy", d => y(d.life2019))
        .attr("r", 6) 
        .attr("fill", d => colorScale(d.entity)); 

    svg.selectAll(".dot-2020")
        .data(topCountries)
        .enter()
        .append("circle")
        .attr("class", "dot-2020")
        .attr("cx", x(2020) + x.bandwidth() / 2)
        .attr("cy", d => y(d.life2020))
        .attr("r", 6) 
        .attr("fill", d => colorScale(d.entity)); 

    svg.selectAll(".country-label")
        .data(topCountries)
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", x(2020) + x.bandwidth()) 
        .attr("y", d => y(d.life2020)) 
        .attr("dy", ".35em") 
        .attr("text-anchor", "start") 
        .text(d => d.entity) 
        .style("font-size", "12px")
        .style("fill", d => colorScale(d.entity)); 

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .style("text-anchor", "middle")
        .text("Life Expectancy (years)");

}).catch(function(error) {
    console.error("Error loading the data: ", error);
});
