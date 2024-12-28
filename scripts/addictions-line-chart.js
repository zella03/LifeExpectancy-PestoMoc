// Set chart dimensions
const margin = { top: 40, right: 100, bottom: 60, left: 80 },
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Set up the SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load and process the data
d3.csv("../datasets/addictions/normalized_europe_data_per_capita_FINAL.csv").then(function(data) {
    const years = d3.range(2000, 2022);
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

    // List the last 7 columns that represent the "Normalized Total deaths" fields
    const addictionTypes = [
        { label: "Opioid use disorders", value: "Normalized Total deaths from opioid use disorders among both sexes" },
        { label: "Cocaine use disorders", value: "Normalized Total deaths from cocaine use disorders among both sexes" },
        { label: "Other drug use disorders", value: "Normalized Total deaths from other drug use disorders among both sexes" },
        { label: "Amphetamine use disorders", value: "Normalized Total deaths from amphetamine use disorders among both sexes" },
        { label: "Drug use disorders", value: "Normalized Total deaths from drug use disorders among both sexes" },
        { label: "Mental and substance use disorders", value: "Normalized Total deaths from mental and substance use disorders among both sexes" },
        { label: "Substance use disorders", value: "Normalized Total deaths from substance use disorders among both sexes" }
    ];

    // Populate the dropdown menu
    const select = d3.select("#addiction-select");
    select.selectAll("option")
        .data(addictionTypes)
        .enter().append("option")
        .attr("value", d => d.value)
        .text(d => d.label);

    // Set up the x scale (outside updateChart for efficiency)
    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.2);

    // Filter the years to display on the x-axis
    const displayedYears = years.filter(year => year % 5 === 0 || year === 2000 || year === 2021);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickValues(displayedYears));

    // Function to update the chart based on the selected addiction type
    function updateChart(selectedType) {
        svg.selectAll(".line").remove();
        svg.selectAll(".y-axis").remove();
        svg.selectAll(".line-label").remove();
        svg.selectAll(".legend").remove();
        svg.selectAll(".tooltip").remove();
        svg.selectAll(".dot").remove();

        // Filter data to get the top 5 countries for the selected type
        const top5Countries = Array.from(d3.rollup(data, v => d3.mean(v, d => d[selectedType]), d => d.Entity))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(d => d[0]);

        const filteredData = data.filter(d => top5Countries.includes(d.Entity));

        const yMax = d3.max(filteredData, d => d[selectedType]);
        if (yMax === undefined) return;

        const y = d3.scaleLinear()
            .domain([0, yMax * 1.1])
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.Year) + x.bandwidth() / 2)
            .y(d => y(d[selectedType]));

        const groupedData = d3.group(filteredData, d => d.Entity);
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(groupedData.keys());

        groupedData.forEach((values, key) => {
            svg.append("path")
                .datum(values)
                .attr("class", "line")
                .attr("d", line)
                .attr("stroke", colorScale(key))
                .attr("stroke-width", 2)
                .attr("fill", "none");

            svg.selectAll(`.dot-${key}`)
                .data(values)
                .enter().append("circle")
                .attr("class", `dot dot-${key}`)
                .attr("cx", d => x(d.Year) + x.bandwidth() / 2)
                .attr("cy", d => y(d[selectedType]))
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
                        <p>Value: ${d[selectedType].toFixed(6)}</p>
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
            svg.append("text")
                .attr("class", "line-label")
                .attr("x", x(lastPoint.Year) + x.bandwidth() / 2 + 5)
                .attr("y", y(lastPoint[selectedType]))
                .text(key)
                .style("font-size", "12px")
                .style("fill", colorScale(key))
                .style("alignment-baseline", "middle");
        });

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        const legend = svg.selectAll(".legend")
            .data(groupedData.keys())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legend.append("rect")
            .attr("x", width + 20)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", colorScale);

        legend.append("text")
            .attr("x", width + 40)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d);
    }

    // Initially, update the chart with the first addiction type
    updateChart(addictionTypes[0].value);

    // Dropdown change event
    select.on("change", function() {
        const selectedType = d3.select(this).property("value");
        updateChart(selectedType);
    });
});
