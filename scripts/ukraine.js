d3.csv("datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023).csv").then(data => {
    data.forEach(d => {
        d.Year = +d.Year;
        d.Life_expectancy = +d.Life_expectancy;
    });

    const filteredData = data.filter(d => 
        d.Year <= 2022 && d.Year > 2013 &&
        (d.Country === "Russian Federation" || d.Country === "Ukraine")
    );

    if (filteredData.length === 0) {
        console.error("No data found for Russia or Ukraine. Check your CSV file.");
        return;
    }

    const dataByCountryAndTotal = d3.group(filteredData, d => d.Country, d => d.Total);

    const margin = { top: 50, right: 230, bottom: 50, left: 80 };
    const width = 1300 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.Year))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(filteredData, d => d.Life_expectancy) - 5, 
                 d3.max(filteredData, d => d.Life_expectancy) + 5])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 10})`)
        .style("text-anchor", "middle")
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .style("text-anchor", "middle")
        .text("Life Expectancy");

    const line = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.Life_expectancy));

    const countryColors = {
        "Russian Federation": d3.scaleOrdinal()
            .domain(["male", "female"])
            .range(["#ff0000", "#ff0000"]),
        "Ukraine": d3.scaleOrdinal()
            .domain(["male", "female"])
            .range(["#0000ff", "#0000ff"])
    };

    const tooltip = d3.select("#chart")
        .append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("display", "none");

    const labels = {};

    for (let [country, totalData] of dataByCountryAndTotal) {
        for (let [total, values] of totalData) {
            if (total === "total") continue;
            const lineStyle = total === "female" ? "dashed" : "solid";

            svg.append("path")
                .datum(values.sort((a, b) => a.Year - b.Year))
                .attr("class", `line ${total.toLowerCase()}`)
                .attr("fill", "none")
                .attr("stroke", countryColors[country](total.toLowerCase()))
                .attr("stroke-width", total === "female" ? 3 : 2)
                .attr("stroke-dasharray", lineStyle === "dashed" ? "5,5" : "0")
                .attr("d", line);

            const lastValue = values[values.length - 1];
            const label = svg.append("text")
                .datum(lastValue)
                .attr("class", `label ${total.toLowerCase()}`)
                .attr("x", xScale(lastValue.Year) + 5)
                .attr("y", yScale(lastValue.Life_expectancy))
                .attr("fill", countryColors[country](total.toLowerCase()))
                .text(`${country} (${total.toUpperCase()})`)
                .style("font-size", "12px")
                .style("display", "none");

            labels[`${total.toLowerCase()}_${country.toLowerCase().replace(/\s+/g, "_")}`] = label;

            svg.selectAll(`.dot-${country}-${total}`)
                .data(values)
                .enter()
                .append("circle")
                .attr("class", `dot ${total.toLowerCase()}`)
                .attr("cx", d => xScale(d.Year))
                .attr("cy", d => yScale(d.Life_expectancy))
                .attr("r", 4)
                .attr("fill", countryColors[country](total.toLowerCase()))
                .on("mouseover", (event, d) => {
                    tooltip.style("display", "block")
                        .html(`Country: ${country}<br>Sex: ${total}<br>Year: ${d.Year}<br>Life Expectancy: ${d.Life_expectancy}`);

                    d3.selectAll(".line")
                        .style("opacity", 0.2);
                    d3.selectAll(".dot")
                        .style("opacity", 0.2);

                    d3.selectAll(`.line.${total.toLowerCase()}`)
                        .style("opacity", 1);
                    d3.selectAll(`.dot.${total.toLowerCase()}`)
                        .style("opacity", 1);
                })
                .on("mousemove", event => {
                    tooltip.style("top", `${event.pageY + 10}px`)
                        .style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", () => {
                    tooltip.style("display", "none");
                    d3.selectAll(".line")
                        .style("opacity", 1);
                    d3.selectAll(".dot")
                        .style("opacity", 1);
                });
        }
    }

    d3.selectAll("input[type=checkbox]").on("change", function () {
        const id = this.id;
        const isChecked = this.checked;
        const total = id.replace("Checkbox", "").toLowerCase();

        d3.selectAll(`.line.${total}`).classed("hidden", !isChecked);
        d3.selectAll(`.dot.${total}`).classed("hidden", !isChecked);

        for (let [key, label] of Object.entries(labels)) {
            if (key.startsWith(total)) {
                label.style("display", isChecked ? "block" : "none");
            }
        }
    });

    d3.selectAll(".line, .dot, .label").classed("hidden", true);

    if (d3.select("#maleCheckbox").property("checked")) {
        d3.selectAll(".line.male").classed("hidden", false);
        d3.selectAll(".dot.male").classed("hidden", false);
        for (let [key, label] of Object.entries(labels)) {
            if (key.startsWith("male")) {
                label.style("display", "block");
            }
        }
    }
    if (d3.select("#femaleCheckbox").property("checked")) {
        d3.selectAll(".line.female").classed("hidden", false);
        d3.selectAll(".dot.female").classed("hidden", false);
        for (let [key, label] of Object.entries(labels)) {
            if (key.startsWith("female")) {
                label.style("display", "block");
            }
        }
    }
}).catch(error => {
    console.error("Error loading the CSV file:", error);
    d3.select("#chart").append("p").text("Error loading data. Please check the console.");
});
