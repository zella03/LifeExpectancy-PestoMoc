// Set chart dimensions
const margin = { top: 40, right: 60, bottom: 60, left: 80 },
width = 900 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;

// Set up the SVG container
const svg = d3.select("#chart")
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create tooltip div (initially hidden)
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("visibility", "hidden");

// Load and process the data
d3.csv("../datasets/addictions/merged_data.csv").then(function (data) {
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

    const x = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    const addictionTypes = Object.keys(data[0]).filter(key => key !== "Year" && key !== "Entity" && key !== "Code");

    const select = d3.select("#addiction-select");
    select.selectAll("option")
        .data(addictionTypes)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

    // Function to update the chart based on the selected addiction type
    function updateChart(selectedType) {
        svg.selectAll(".line").remove();
        svg.selectAll(".y-axis").remove();

        const yMax = d3.max(data, d => d[selectedType]);
        if (yMax === undefined) return;

        const y = d3.scaleLinear()
            .domain([0, yMax * 1.1])
            .range([height, 0]);

        const line = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d[selectedType]));

        // Add line to the chart
        svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", line)
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("fill", "none")
            .on("mouseover", function(event, d) {
                // Show tooltip on hover
                tooltip.style("visibility", "visible");
            })
            .on("mousemove", function(event, d) {
                // Move tooltip to mouse position and show the data
                const [xPos, yPos] = d3.pointer(event);
                const yearData = d3.bisectLeft(years, xPos);
                const year = years[yearData];
                const country = d[0].Entity; // Assuming the first entry contains the country name
                const value = d[yearData][selectedType];
                
                tooltip
                    .html(`Country: ${country}<br>Year: ${year}<br>Value: ${value}`)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 50}px`);
            })
            .on("mouseout", function() {
                // Hide tooltip when mouse leaves
                tooltip.style("visibility", "hidden");
            });

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));
    }

    updateChart(addictionTypes[0]);

    // Dropdown change event
    select.on("change", function () {
        const selectedType = d3.select(this).property("value");
        updateChart(selectedType);
    });
});
