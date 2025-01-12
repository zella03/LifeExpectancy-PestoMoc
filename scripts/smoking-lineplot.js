const svg3 = d3.select("#chart3")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("datasets/addictions/normalized_europe_data_per_capita_FINAL.csv").then(function(data) {
    const years = [2000, 2005, 2010, 2015, 2019];
    data = data.filter(d => years.includes(+d.Year));

    data.forEach(d => {
        d.Year = +d.Year;
        for (const key in d) {
            if (key !== "Year" && key !== "Entity" && key !== "Code") {
                d[key] = +d[key];
            }
        }
    });

    const tobaccoColumn = "Prevalence of current tobacco use (% of adults)";

    const select = d3.select("#tobacco-select");
    select.append("option")
        .attr("value", tobaccoColumn)
        .text("Prevalence of current tobacco use (% of adults)");

    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.2);

    const displayedYears = years;

    svg3.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickValues(displayedYears));

    svg3.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .style("text-anchor", "middle")
        .text("Years");

    function updateChart() {
        svg3.selectAll(".line").remove();
        svg3.selectAll(".y-axis").remove();
        svg3.selectAll(".line-label").remove();
        svg3.selectAll(".legend").remove();
        svg3.selectAll(".tooltip").remove();
        svg3.selectAll(".dot").remove();
        svg3.selectAll(".y-axis-label").remove();

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
            svg3.append("path")
                .datum(values)
                .attr("class", `line line-${key}`)
                .attr("d", line)
                .attr("stroke", colorScale(key))
                .attr("stroke-width", 2)
                .attr("fill", "none");

            svg3.selectAll(`.dot-${key}`)
                .data(values)
                .enter().append("circle")
                .attr("class", `dot dot-${key}`)
                .attr("cx", d => x(d.Year) + x.bandwidth() / 2)
                .attr("cy", d => y(d[tobaccoColumn]))
                .attr("r", 4)
                .attr("fill", colorScale(key))
                .on("mouseover", function(event, d) {
                    d3.selectAll(".line").style("opacity", 0.2);
                    d3.selectAll(".dot").style("opacity", 0.2);
                    d3.selectAll(`.line-${d.Entity}`).style("opacity", 1);
                    d3.selectAll(`.dot-${d.Entity}`).style("opacity", 1);

                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("opacity", 0)
                        .style("position", "absolute");

                    const mouseX = event.pageX;
                    const mouseY = event.pageY;

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);

                    tooltip.html(`
                        <p>Country: ${d.Entity}</p>
                        <p>Year: ${d.Year}</p>
                        <p>Prevalence: ${d[tobaccoColumn].toFixed(2)}%</p>
                    `)
                        .style("left", (mouseX + 10) + "px")
                        .style("top", (mouseY - 20) + "px");
                })
                .on("mouseout", function() {
                    d3.selectAll(".line").style("opacity", 1);
                    d3.selectAll(".dot").style("opacity", 1);

                    d3.selectAll(".tooltip")
                        .transition()
                        .duration(500)
                        .style("opacity", 0)
                        .on("end", function() {
                            d3.select(this).remove();
                        });
                });
        });

        const labels = Array.from(groupedData.keys()).map(key => {
            const lastPoint = groupedData.get(key).slice(-1)[0];
            return {
                key: key,
                x: x(lastPoint.Year) + x.bandwidth() / 2 + 5,
                y: y(lastPoint[tobaccoColumn]),
                color: colorScale(key),
                originalY: y(lastPoint[tobaccoColumn])
            };
        });

        labels.sort((a, b) => a.originalY - b.originalY);

        let previousY = -Infinity;

        labels.forEach(label => {
            if (label.y - previousY < 15) {
                label.y = previousY + 15;
            }
            previousY = label.y;
        });

        labels.forEach(label => {
            svg3.append("text")
                .attr("class", "line-label")
                .attr("x", label.x)
                .attr("y", label.y)
                .text(label.key)
                .style("font-size", "12px")
                .style("fill", label.color)
                .style("alignment-baseline", "middle");
        });

        svg3.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        svg3.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .style("text-anchor", "middle")
            .text("Prevalence of tobacco use (%)");
    }

    updateChart();

    select.on("change", function() {
        updateChart();
    });
});
