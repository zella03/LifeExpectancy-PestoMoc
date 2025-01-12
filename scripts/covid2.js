const margin = { top: 40, right: 230, bottom: 50, left: 60 };
const width = window.innerWidth - margin.left - margin.right - 100;
const height = 500 - margin.top - margin.bottom;

const euCountries = new Set([
    'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium',
    'Bosnia and Herzegovina', 'Bulgaria', 'Channel Islands', 'Croatia', 'Cyprus',
    'Czechia', 'Denmark', 'Estonia', 'Faroe Islands', 'Finland', 'France',
    'Germany', 'Gibraltar', 'Greece', 'Hungary', 'Iceland', 'Ireland',
    'Isle of Man', 'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania',
    'Luxembourg', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands',
    'North Macedonia', 'Norway', 'Poland', 'Portugal', 'Romania',
    'Russian Federation', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
    'Sweden', 'Switzerland', 'Ukraine', 'United Kingdom'
]);

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
    const euData = data.filter(d => euCountries.has(d['Entity']) && +d['Year'] >= 2010 && d['Period life expectancy at birth - Sex: total - Age: 0'] !== '');

    euData.forEach(d => {
        d.Year = +d['Year'];
        d.life_expectancy = +d['Period life expectancy at birth - Sex: total - Age: 0'];
    });

    const countries = d3.groups(euData, d => d['Entity'])
        .map(([entity, values]) => {
            const life2019 = values.find(d => d.Year === 2019)?.life_expectancy;
            const life2020 = values.find(d => d.Year === 2020)?.life_expectancy;
            const life2022 = values.find(d => d.Year === 2021)?.life_expectancy;

            if (life2019 && life2020) {
                const difference = life2019 - life2020;
                return { entity, life2019, life2020, difference, values };
            }
            return null;
        })
        .filter(d => d !== null)
        .filter(d => d.difference > 0);

    const topCountries = countries.sort((a, b) => b.difference - a.difference).slice(0, 5);
    const maxLifeCountry = topCountries[0];

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const x = d3.scaleBand()
        .domain(topCountries[0].values.map(d => d.Year))
        .range([0, width])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([d3.min(topCountries, d => d3.min(d.values, v => v.life_expectancy)), 
                 d3.max(topCountries, d => d3.max(d.values, v => v.life_expectancy))])
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
        .attr("opacity", d => d.entity === maxLifeCountry.entity ? 1 : 0.2)
        .attr("d", d => line(d.values))
        .on("mouseover", function(event, d) {
            svg.selectAll("circle")
            .filter(dot => dot.entity !== d.entity && dot.entity !== maxLifeCountry.entity)
            .transition()
            .duration(200)
            .style("opacity", 0.2);

            svg.selectAll("circle")
            .filter(dot => dot.entity === d.entity)
            .transition()
            .duration(200)
            .style("opacity", 1);
    
            svg.selectAll(".line")
                .filter(line => line.entity !== d.entity && line.entity !== maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 0.2);

            svg.selectAll(".line")
                .filter(line => line.entity === d.entity)
                .transition()
                .duration(200)
                .style("opacity", 1);

            tooltip.transition()
                .duration(200)
                .style("visibility", "visible")
                .style("opacity", 1);
    
            tooltip.html(`<b>${d.entity}</b><br>2019: ${d.life2019}<br>2020: ${d.life2020}<br><b class="darkred-text">Difference: -${d.difference.toFixed(2)}</b>`);
        
             
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function(event, d) {
            

            svg.selectAll("circle")
                .filter(dot => dot.entity !== maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 0.2);

            svg.selectAll("circle")
                .filter(dot => dot.entity === maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 1);
    
            svg.selectAll(".line")
                .filter(dot => dot.entity !== maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 0.2);

            svg.selectAll(".line")
                .filter(dot => dot.entity === maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 1);
                
            tooltip.transition()
                .duration(200)
                .style("opacity", 0)
                .on("end", function() {
                    tooltip.style("visibility", "hidden"); 
                });
    
            
        });
    
    svg.selectAll(".dot")
        .data(topCountries.flatMap(d => 
            d.values.filter(v => v.Year === 2019 || v.Year === 2020).map(v => ({
                ...v,
                entity: d.entity
            }))
        ))
        .enter()
        .append("circle")
        .attr("opacity", d => d.entity === maxLifeCountry.entity ? 1 : 0.2)
        .attr("cx", d => x(d.Year) + x.bandwidth() / 2)
        .attr("cy", d => y(d.life_expectancy))
        .attr("r", 8)
        .attr("fill", d => colorScale(d.entity))
        .on("mouseover", function(event, d) {

            svg.selectAll("circle")
                .filter(dot => dot.entity !== d.entity && dot.entity !== maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 0.2);
    
                svg.selectAll("circle")
                .filter(dot => dot.entity === d.entity)
                .transition()
                .duration(200)
                .attr("r", 12)
                .style("opacity", 1);
        
                svg.selectAll(".line")
                    .filter(line => line.entity !== d.entity && line.entity !== maxLifeCountry.entity)
                    .transition()
                    .duration(200)
                    .style("opacity", 0.2);
    
                svg.selectAll(".line")
                    .filter(line => line.entity === d.entity)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);

            tooltip.transition()
                .duration(200)
                .style("visibility", "visible")
                .style("opacity", 1);
    
            tooltip.html(`<b>Life Expectancy:</b> ${d.life_expectancy}<br>Year: ${d.Year}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {

            svg.selectAll("circle")
                .transition()
                .duration(200)
                .attr("r", 8)
                .style("opacity", 0.2);

            svg.selectAll("circle")
                .filter(dot => dot.entity === maxLifeCountry.entity)
                .transition()
                .duration(200)
                .attr("r", 8)
                .style("opacity", 1);
    
            svg.selectAll(".line")
                .filter(dot => dot.entity !== maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 0.2);

            svg.selectAll(".line")
                .filter(dot => dot.entity === maxLifeCountry.entity)
                .transition()
                .duration(200)
                .style("opacity", 1);

            tooltip.transition()
                .duration(200)
                .style("opacity", 0) 
                .on("end", function() {
                    tooltip.style("visibility", "hidden"); 
                });
        });
    

    svg.selectAll(".country-label")
        .data(topCountries)
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", d => x(d.values[d.values.length - 1].Year) + x.bandwidth())
        .attr("y", d => y(d.values[d.values.length - 1].life_expectancy))
        .attr("dy", ".35em")
        .text(d => d.entity)
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", d => colorScale(d.entity))
        .style("text-anchor", "start");

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

}).catch(function(error) {
    console.error("Error loading the data: ", error);
});
