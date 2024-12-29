// Set up the SVG container
const svg2 = d3.select("#chart4")
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

    // List the addiction types
    const addictionTypes = [
        { label: "Opioid use disorders", value: "Normalized Total deaths from opioid use disorders among both sexes" },
        { label: "Cocaine use disorders", value: "Normalized Total deaths from cocaine use disorders among both sexes" },
        { label: "Other drug use disorders", value: "Normalized Total deaths from other drug use disorders among both sexes" },
        { label: "Amphetamine use disorders", value: "Normalized Total deaths from amphetamine use disorders among both sexes" },
        { label: "Drug use disorders", value: "Normalized Total deaths from drug use disorders among both sexes" },
        { label: "Mental and substance use disorders", value: "Normalized Total deaths from mental and substance use disorders among both sexes" },
        { label: "Substance use disorders", value: "Normalized Total deaths from substance use disorders among both sexes" }
    ];

    // Get the unique list of countries
    const countries = Array.from(new Set(data.map(d => d.Entity))).sort();

    // Populate the dropdown menu for country selection
    const select = d3.select("#country-select");
    select.selectAll("option")
        .data(countries)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

    // Set up the x scale
    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.2);

    // Filter the years to display on the x-axis
    const displayedYears = years.filter(year => year % 5 === 0 || year === 2000 || year === 2021);

    svg2.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickValues(displayedYears));

    // Function to update the chart based on the selected country
    function updateChart(selectedCountry) {
        svg2.selectAll(".line").remove();
        svg2.selectAll(".y-axis").remove();
        svg2.selectAll(".line-label").remove();
        svg2.selectAll(".tooltip").remove();

        // Filter data for the selected country
        const filteredData = data.filter(d => d.Entity === selectedCountry);

        const yMax = d3.max(filteredData, d => 
            Math.max(...addictionTypes.map(type => d[type.value]))
        );
        if (yMax === undefined) return;

        const y = d3.scaleLinear()
            .domain([0, yMax * 1.1])
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.Year) + x.bandwidth() / 2)
            .y(d => y(d.value));

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(addictionTypes.map(d => d.label));

        addictionTypes.forEach(type => {
            const values = filteredData.map(d => ({
                Year: d.Year,
                value: d[type.value]
            }));

            svg2.append("path")
                .datum(values)
                .attr("class", "line")
                .attr("d", line)
                .attr("stroke", colorScale(type.label))
                .attr("stroke-width", 2)
                .attr("fill", "none");

            // Add labels for the last data point of each line
            const lastPoint = values[values.length - 1];
            if (lastPoint) {
                svg2.append("text")
                    .attr("class", "line-label")
                    .attr("x", x(lastPoint.Year) + x.bandwidth() / 2 + 5)
                    .attr("y", y(lastPoint.value))
                    .text(type.label)
                    .style("font-size", "12px")
                    .style("fill", colorScale(type.label))
                    .style("alignment-baseline", "middle");
            }
        });

        // Add y-axis
        svg2.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));
    }

    // Initially update the chart with the first country
    updateChart(countries[0]);

    // Dropdown change event
    select.on("change", function() {
        const selectedCountry = d3.select(this).property("value");
        updateChart(selectedCountry);
    });
});
