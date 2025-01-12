const margin = { top: 40, right: 20, bottom: 60, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("display", "none")
    .style("position", "absolute")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("padding", "5px")
    .style("pointer-events", "none");

d3.csv("./datasets/life-expectancy-population/EU-life-expectancy-population-(1960-2023).csv").then(data => {
    const filteredData = data.filter(d => 
        d.Country === "Cyprus" && 
        d.Year >= 1968 && 
        d.Year <= 1978
    ).map(d => ({
        Year: +d.Year,
        Total: d.Total,
        Life_expectancy: +(+d.Life_expectancy).toFixed(2)
    }));

    const groupedData = d3.group(filteredData, d => d.Year);

    const getData = (showGender) => {
        if (showGender) {
            return Array.from(groupedData, ([year, values]) => {
                const male = values.find(d => d.Total === "male");
                const female = values.find(d => d.Total === "female");
                return {
                    Year: year,
                    Male: male ? male.Life_expectancy : 0,
                    Female: female ? female.Life_expectancy : 0,
                };
            });
        } else {
            return Array.from(groupedData, ([year, values]) => {
                const total = values.find(d => d.Total === "total");
                return {
                    Year: year,
                    Life_expectancy: total ? total.Life_expectancy : 0,
                };
            });
        }
    };

    let showGender = false;
    renderChart(getData(showGender));

    d3.select("#toggle-view").on("change", function () {
        showGender = this.checked;
        renderChart(getData(showGender));
    });

    function renderChart(data) {
        svg.selectAll("*").remove();
    
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.Year))
            .range([0, width])
            .padding(showGender ? 0.4 : 0.2);
    
        const yMax = d3.max(data, d => showGender ? Math.max(d.Male, d.Female) : d.Life_expectancy);
        const yScale = d3.scaleLinear()
            .domain([40, yMax + 5])
            .range([height, 0]);
    
        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale);
    
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .text("Year");
    
        svg.append("g")
            .call(yAxis)
            .append("text")
            .attr("class", "axis-label")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("transform", "rotate(-90)")
            .attr("fill", "black")
            .text("Life Expectancy");
    
        const updateBars = (bars, color, opacity = 1) => {
            bars.attr("fill", color)
                .style("opacity", opacity);
        };
    
        if (showGender) {
            const barWidth = xScale.bandwidth() / 2;
    
            const maleBars = svg.selectAll(".bar-male")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar-male")
                .attr("x", d => xScale(d.Year))
                .attr("y", height)  // Initially place the bars at the bottom (height = bottom of chart)
                .attr("height", 0)   // Initially set the height to 0
                .attr("width", barWidth)
                .attr("fill", "blue")
                .transition()
                .duration(1000)  // Duration of the transition
                .attr("y", d => yScale(d.Male))  // Transition the bars to their correct position
                .attr("height", d => height - yScale(d.Male));
                
                
    
            const femaleBars = svg.selectAll(".bar-female")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar-female")
                .attr("x", d => xScale(d.Year) + barWidth)
                .attr("y", height)  // Initially place the bars at the bottom (height = bottom of chart)
                .attr("height", 0)   // Initially set the height to 0
                .attr("width", barWidth)
                .attr("fill", "pink")
                .transition()
                .duration(1000)  // Duration of the transition
                .attr("y", d => yScale(d.Female))  // Transition the bars to their correct position
                .attr("height", d => height - yScale(d.Female));
    
            const bars = svg.selectAll("rect");
    
            bars.on("mouseover", function(event, d) {
                const gender = event.target.classList.contains("bar-male") ? "Male" : "Female";
                const lifeExpectancy = gender === "Male" ? d.Male : d.Female;
    
                tooltip.style("display", "block")
                    .html(`<strong>${gender} Life Expectancy:</strong> ${lifeExpectancy}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
    
                updateBars(bars, "gray", 0.5);
                d3.select(this).attr("fill", "orange").style("opacity", 1);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
                updateBars(maleBars, "blue");
                updateBars(femaleBars, "pink");
            });
    
        } else {
            const bars = svg.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", d => d.Year === 1974 ? "bar bar-1974" : "bar")
                .attr("x", d => xScale(d.Year))
                .attr("y", d => yScale(d.Life_expectancy))
                .attr("width", xScale.bandwidth())
                .attr("height", d => height - yScale(d.Life_expectancy))
                .attr("fill", d => d.Year === 1974 ? "red" : "steelblue");

        
            bars.on("mouseover", function(event, d) {
                tooltip.style("display", "block")
                    .html(`<strong>Life Expectancy:</strong> ${d.Life_expectancy}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
        
                svg.selectAll(".bar")
                    .style("opacity", 0.6);
        
                d3.select(this)
                    .attr("fill", "orange")
                    .style("opacity", 1);
            }).on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            }).on("mouseout", function() {
                tooltip.style("display", "none");
        
                svg.selectAll(".bar")
                    .attr("fill", d => d.Year === 1974 ? "red" : "steelblue")
                    .style("opacity", 1);
            });
        }
        
    }
});
