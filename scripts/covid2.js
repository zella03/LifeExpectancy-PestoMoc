
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

        // Load the CSV data
        d3.csv('datasets/life-exp/life-expectancy.csv').then(function(data) {
            // Filter data to only include COVID-19 years (2020, 2021, 2022)
            const covidYearsData = data.filter(d => {
                return d['Year'] >= 2019 && d['Year'] <= 2021 && d['Period life expectancy at birth - Sex: total - Age: 0'] !== '';
            });

            // Parse the life expectancy data to numeric values
            covidYearsData.forEach(d => {
                d.Year = +d['Year'];
                d.life_expectancy = +d['Period life expectancy at birth - Sex: total - Age: 0'];
            });

            // Set the scales for X and Y axes
            const x = d3.scaleBand()
                .domain(covidYearsData.map(d => d.Year))
                .range([0, width])
                .padding(0.1);

            const y = d3.scaleLinear()
                .domain([d3.min(covidYearsData, d => d.life_expectancy), d3.max(covidYearsData, d => d.life_expectancy)])
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

            // Create the line chart
            svg.append("path")
                .datum(covidYearsData)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => x(d.Year) + x.bandwidth() / 2)  // Align data to the center of each band
                    .y(d => y(d.life_expectancy))
                );

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