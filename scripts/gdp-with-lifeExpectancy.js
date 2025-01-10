document.addEventListener("DOMContentLoaded", () => {
    const margin = { top: 50, right: 50, bottom: 150, left: 70 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3
        .select("#bubble-chart")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const tooltip = d3.select("#tooltip-bubble");
    const yearDropdown = document.getElementById("year-select");

    const xScale = d3.scaleLog().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
    const sizeScale = d3.scaleSqrt().range([4, 40]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(3)  // Show only 3 ticks for years
        .tickFormat(d => {
            if (d >= 1e12) return `${d / 1e12}T`;
            if (d >= 1e9) return `${d / 1e9}B`;
            if (d >= 1e6) return `${d / 1e6}M`;
            if (d >= 1e3) return `${d / 1e3}K`;
            return d;
        });

    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => d);

    /*
    // Function to create X axis with grid lines
    function make_x_axis() {
        return d3.axisBottom(xScale)
            .ticks(3)
            .tickSize(-height)
            .tickFormat("");
    }

    // Function to create Y axis with grid lines
    function make_y_axis() {
        return d3.axisLeft(yScale)
            .ticks(5)  // Use equal ticks based on the life expectancy range
            .tickSize(-width)
            .tickFormat("");
    }
*/
    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`);
    svg.append("g").attr("class", "y-axis");

    /*
    // Grid lines for X and Y axes using make_x_axis and make_y_axis functions
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height})`)
        .call(make_x_axis());

    svg.append("g")
        .attr("class", "grid")
        .call(make_y_axis());
*/
    svg.append("text")
        .attr("class", "x-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("total GDP in euros");

    svg.append("text")
        .attr("class", "y-label")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .text("Life Expectancy (years)");
    
    d3.csv("./datasets/gdp/merged-gdp-life_expectancy.csv").then(data => {
        const years = [...new Set(data.map(d => +d.Year))];
        for (let year = d3.min(years); year <= 2022; year++) {
            if (!years.includes(year)) years.push(year);
        }
        years.sort((a, b) => a - b);

        years.forEach(year => {
            if (year !== 2023) {
                const option = document.createElement("option");
                option.value = year;
                option.textContent = year;
                yearDropdown.appendChild(option);
            }
        });

        if (years.includes(2022)) {
            yearDropdown.value = 2022;
        }

        xScale.domain([1e9, d3.max(data, d => +d.Total_GDP)]);
        yScale.domain([30, d3.max(data, d => +d.Life_expectancy)]);

        function renderChart(year) {
            const filteredData = data.filter(d =>
                +d.Year === year && d.Total === "total" &&
                +d.Life_expectancy > 0 && +d.Total_GDP > 0
            );

            const colorScale = d3.scaleSequential(d3.interpolateRgb("#9b4d96", "#ff8c00"))
                .domain([0, d3.max(filteredData, d => +d.Population)]);

            sizeScale.domain([0, d3.max(filteredData, d => +d.Population)]);

            const bubbles = svg.selectAll(".bubble").data(filteredData, d => d.Country);

            bubbles.exit().transition().duration(500).attr("r", 0).remove();

            bubbles
                .enter()
                .append("circle")
                .attr("class", "bubble")
                .attr("cx", d => xScale(+d.Total_GDP))
                .attr("cy", d => yScale(+d.Life_expectancy))
                .attr("r", 0)
                .attr("fill", d => colorScale(+d.Population))
                .attr("opacity", 0.7)
                .on("mouseover", (event, d) => {
                    tooltip
                        .style("opacity", 1) // Make tooltip visible
                        .html(
                            `<strong>${d.Country}</strong><br>
                            GDP: ${(+d.Total_GDP).toLocaleString()} €<br>
                            Life Expectancy: ${parseFloat(d.Life_expectancy).toFixed(2)} years<br>
                            Population: ${(+d.Population).toLocaleString()}`
                        )
                        .style("left", `${event.pageX + 10}px`) // Adjust the tooltip position
                        .style("top", `${event.pageY - 20}px`)
                        .style("transform", "translateX(10px)"); // Make sure the tooltip doesn't get clipped on the left
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", 0); // Hide tooltip on mouseout
                })
                .merge(bubbles)
                .transition()
                .duration(800)
                .attr("cx", d => xScale(+d.Total_GDP))
                .attr("cy", d => yScale(+d.Life_expectancy))
                .attr("r", d => sizeScale(+d.Population));

            svg.select(".x-axis").transition().duration(800).call(xAxis);
            svg.select(".y-axis").transition().duration(800).call(yAxis);

            const legendHeight = 20;
            const legendWidth = 500;

            const legend = d3.select("#legend");

            const legendScale = d3.scaleLinear()
                .domain([0, d3.max(filteredData, d => +d.Population)])
                .range([0, legendWidth]);

            const numColors = 5;
            const colorRange = d3.range(0, numColors);

            legend.selectAll("rect")
                .data(colorRange)
                .enter()
                .append("rect")
                .attr("x", (d, i) => legendScale(i * (d3.max(filteredData, d => +d.Population)) / numColors))
                .attr("y", 0)
                .attr("width", legendWidth / numColors)
                .attr("height", legendHeight)
                .style("fill", (d, i) => colorScale(i * (d3.max(filteredData, d => +d.Population)) / numColors));

            const labelValues = d3.range(1, numColors).map(i => Math.round(i * (d3.max(filteredData, d => +d.Population)) / numColors));

            legend.selectAll("text")
                .data(labelValues)
                .enter()
                .append("text")
                .attr("x", (d, i) => legendScale(d) + (legendWidth / numColors) / 100)
                .attr("y", legendHeight + 15)
                .attr("text-anchor", "middle")
                .text(d => d.toLocaleString())
                .style("font-size", "12px");

            legend.append("text")
                .attr("x", legendWidth / 2)
                .attr("y", legendHeight + 35)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Population");
        }

        renderChart(+yearDropdown.value);

        yearDropdown.addEventListener("change", () => renderChart(+yearDropdown.value));
    });

    /*
    // CSS for grid lines and opacity
    const style = document.createElement("style");
    style.textContent = `
        .grid .tick {
            stroke: lightgrey;
            opacity: 0.05;
        }
        .grid path {
            stroke-width: 0;
        }
    `
    document.head.appendChild(style);;*/
});
