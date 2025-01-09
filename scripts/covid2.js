// Set the dimensions of the SVG container
const margin = { top: 20, right: 30, bottom: 40, left: 40 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Set up the SVG element
const svg = d3.select("#life-expectancy-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create a tooltip element
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "4px")
    .style("box-shadow", "0px 2px 4px rgba(0, 0, 0, 0.2)")
    .style("visibility", "hidden");

// Load the CSV data
d3.csv('datasets/life-exp/life-expectancy.csv').then(function(data) {
    // Filter data to only include the years 2019 and 2020
    const covidYearsData = data.filter(d => {
        return d['Year'] === '2019' || d['Year'] === '2020' && d['Period life expectancy at birth - Sex: total - Age: 0'] !== '';
    });

    // Parse the data
    covidYearsData.forEach(d => {
        d.Year = +d['Year'];
        d.life_expectancy = +d['Period life expectancy at birth - Sex: total - Age: 0'];
    });

    // Group the data by entity (country) and calculate the difference between 2020 and 2019 life expectancy
    const countries = d3.groups(covidYearsData, d => d['Entity'])
        .map(([entity, values]) => {
            // Get life expectancy for 2019 and 2020
            const life2019 = values.find(d => d.Year === 2019)?.life_expectancy;
            const life2020 = values.find(d => d.Year === 2020)?.life_expectancy;

            // Only consider countries with both 2019 and 2020 data
            if (life2019 && life2020) {
                const difference = life2019 - life2020; // Decrease = positive difference
                return { entity, life2019, life2020, difference };
            }
            return null;
        })
        .filter(d => d !== null) // Filter out countries with missing data for 2019 or 2020
        .filter(d => d.difference > 0); // Only consider countries where life expectancy decreased

    // Sort by the largest decrease in life expectancy
    const topCountries = countries.sort((a, b) => b.difference - a.difference).slice(0, 5);

    // Set the scales for X and Y axes
    const x = d3.scaleBand()
        .domain([2019, 2020]) // Only use 2019 and 2020
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([d3.min(topCountries, d => Math.min(d.life2019, d.life2020)), d3.max(topCountries, d => Math.max(d.life2019, d.life2020))])
        .nice()
        .range([height, 0]);

    // Append the X axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Append the Y axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Create a line generator
    const line = d3.line()
        .x(d => x(d.Year) + x.bandwidth() / 2) // Align data to the center of each band
        .y(d => y(d.life_expectancy));

    // Add lines for each top country
    svg.selectAll(".line")
        .data(topCountries)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d => line([{ Year: 2019, life_expectancy: d.life2019 }, { Year: 2020, life_expectancy: d.life2020 }]))
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "orange"); // Highlight the line
            tooltip.style("visibility", "visible")
                .text(d.entity); // Display the entity (country) name
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "steelblue"); // Reset line color
            tooltip.style("visibility", "hidden");
        });

    // Add labels for the country names
    svg.selectAll(".country-label")
        .data(topCountries)
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", x(2020) + x.bandwidth()) // Position the label at the right of 2020
        .attr("y", d => y(d.life2020)) // Position based on the life expectancy for 2020
        .attr("dy", ".35em") // Vertically center the label
        .attr("text-anchor", "start") // Align the text to the left
        .text(d => d.entity) // Country name
        .style("font-size", "12px")
        .style("fill", "black");

    // Add labels for axes
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
