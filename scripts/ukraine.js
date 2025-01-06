d3.csv("datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023).csv").then(data => {
    data.forEach(d => {
        d.Year = +d.Year;
        d.Life_expectancy = +d.Life_expectancy;
    });

    const filteredData = data.filter(d => 
        d.Year <= 2022 && 
        (d.Country === "Russian Federation" || d.Country === "Ukraine")
    );

    if (filteredData.length === 0) {
        console.error("No data found for Russia or Ukraine. Check your CSV file.");
        return;
    }

    // Group data by Country and the "Total" column
    const dataByCountryAndTotal = d3.group(filteredData, d => d.Country, d => d.Total);

    const margin = { top: 50, right: 150, bottom: 50, left: 80 };
    const width = 800 - margin.left - margin.right;
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
        .domain([
            d3.min(filteredData, d => d.Life_expectancy) - 5, 
            d3.max(filteredData, d => d.Life_expectancy) + 5
        ])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);

    svg.append("g")
        .call(yAxis);

    const line = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.Life_expectancy));

    // Define separate color scales for each country
    const countryColors = {
        "Russian Federation": d3.scaleOrdinal()
            .domain(["MALE", "FEMALE", "TOTAL"])
            .range(["#1f77b4", "#aec7e8", "#2ca02c"]), // Blue-green palette for Russia
        "Ukraine": d3.scaleOrdinal()
            .domain(["MALE", "FEMALE", "TOTAL"])
            .range(["#ff7f0e", "#ffbb78", "#d62728"])  // Orange-red palette for Ukraine
    };

    // Draw lines for each country and Total group
    for (let [country, totalData] of dataByCountryAndTotal) {
        for (let [total, values] of totalData) {
            svg.append("path")
                .datum(values.sort((a, b) => a.Year - b.Year)) // Sort data by year
                .attr("class", `line ${country.replace(/\s+/g, '')} ${total.toLowerCase()}`) // Add classes for selection
                .attr("fill", "none")
                .attr("stroke", countryColors[country](total.toUpperCase()))
                .attr("stroke-width", 2)
                .attr("d", line);
        }
    }

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 20)`);

    const legendData = [
        { country: "Russian Federation", label: "Russia (MALE, FEMALE, TOTAL)", colors: countryColors["Russian Federation"] },
        { country: "Ukraine", label: "Ukraine (MALE, FEMALE, TOTAL)", colors: countryColors["Ukraine"] }
    ];

    let i = 0;
    legendData.forEach(({ country, label, colors }) => {
        ["MALE", "FEMALE", "TOTAL"].forEach((total, j) => {
            const g = legend.append("g")
                .attr("transform", `translate(0, ${(i + j) * 20})`);
            g.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", colors(total));
            g.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .text(`${label.split(" ")[0]} (${total})`)
                .attr("font-size", "12px")
                .attr("alignment-baseline", "middle");
        });
        i += 3;
    });

    // Add event listeners to checkboxes
    d3.selectAll("input[type=checkbox]").on("change", function() {
        const id = this.id;
        const isChecked = this.checked;
        const total = id.replace("Checkbox", "").toLowerCase();
        d3.selectAll(`.line.${total}`).classed("hidden", !isChecked);
    });
}).catch(error => {
    console.error("Error loading the CSV file:", error);
    d3.select("#chart").append("p").text("Error loading data. Please check the console.");
});
