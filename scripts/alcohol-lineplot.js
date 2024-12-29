// Set up the SVG container
const svg4 = d3.select("#chart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load and process the data
d3.csv("../datasets/addictions/normalized_europe_data_per_capita_FINAL.csv").then(function(data) {
    // Define the years to display
    const years = [2000, 2005, 2010, 2015, 2019];
    data = data.filter(d => years.includes(+d.Year));

    // Convert numerical columns to numbers
    data.forEach(d => {
        d.Year = +d.Year;
        for (const key in d) {
            if (key !== "Year" && key !== "Entity" && key !== "Code") {
                d[key] = +d[key];
            }
        }
    });

    // Define the column for "Prevalence of current tobacco use (% of adults)"
    const tobaccoColumn = "Total alcohol consumption per capita (liters of pure alcohol, projected estimates, 15+ years of age)";

    // Populate the dropdown menu (only the tobacco column)
    const select = d3.select("#tobacco-select");
    select.append("option")
        .attr("value", tobaccoColumn)
        .text("Prevalence of current tobacco use (% of adults)");

    // Set up the x scale (outside updateChart for efficiency)
    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.2);

    // Filter the years to display on the x-axis (specifically 2000, 2005, 2010, 2015, 2019)
    const displayedYears = years;

    svg4.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickValues(displayedYears));

    // Function to update the chart based on the selected tobacco data
    function updateChart() {
        svg4.selectAll(".line").remove();
        svg4.selectAll(".y-axis").remove();
        svg4.selectAll(".line-label").remove();
        svg4.selectAll(".legend").remove();
        svg4.selectAll(".tooltip").remove();
        svg4.selectAll(".dot").remove();

        // Filter data to get the top 5 countries for tobacco use prevalence
        const top5Countries = Array.from(d3.rollup(data, v => d3.mean(v, d => d[tobaccoColumn]), d => d.Entity))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(d => d[0]);

        const filteredData = data.filter(d => top5Countries.includes(d.Entity));

        const yMax = d3.max(filteredData, d => d[tobaccoColumn]);
        if (yMax === undefined) return;

        const y = d3.scaleLinear()
            .domain([0, yMax * 1.1])
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.Year) + x.bandwidth() / 2)
            .y(d => y(d[tobaccoColumn]));

        const groupedData = d3.group(filteredData, d => d.Entity);
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(groupedData.keys());

        groupedData.forEach((values, key) => {
            svg4.append("path")
                .datum(values)
                .attr("class", "line")
                .attr("d", line)
                .attr("stroke", colorScale(key))
                .attr("stroke-width", 2)
                .attr("fill", "none");

            svg4.selectAll(`.dot-${key}`)
                .data(values)
                .enter().append("circle")
                .attr("class", `dot dot-${key}`)
                .attr("cx", d => x(d.Year) + x.bandwidth() / 2)
                .attr("cy", d => y(d[tobaccoColumn]))
                .attr("r", 4)
                .attr("fill", colorScale(key))
                .on("mouseover", function(event, d) {
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0)
                        .style("position", "absolute"); // Important for positioning

                    const mouseX = event.pageX;
                    const mouseY = event.pageY;

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);

                    tooltip.html(`
                        <p>Country: ${d.Entity}</p>
                        <p>Year: ${d.Year}</p>
                        <p>Alcohol consumption(liters): ${d[tobaccoColumn].toFixed(2)}%</p>
                    `)
                        .style("left", (mouseX + 10) + "px")
                        .style("top", (mouseY - 20) + "px");
                })
                .on("mouseout", function() {
                    // Properly remove the tooltip when mouse leaves
                    d3.selectAll(".tooltip")
                        .transition()
                        .duration(500)
                        .style("opacity", 0)
                        .on("end", function() {
                            d3.select(this).remove();
                        });
                });

            const lastPoint = values[values.length - 1];
            svg4.append("text")
                .attr("class", "line-label")
                .attr("x", x(lastPoint.Year) + x.bandwidth() / 2 + 5)
                .attr("y", y(lastPoint[tobaccoColumn]))
                .text(key)
                .style("font-size", "12px")
                .style("fill", colorScale(key))
                .style("alignment-baseline", "middle");
        });

        svg4.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));
    }

    // Initially, update the chart with the tobacco prevalence data
    updateChart();

    // Dropdown change event
    select.on("change", function() {
        updateChart();
    });
});
