Promise.all([
    d3.json("datasets/geojson/world.geo.json"),
    d3.csv("datasets/covid/estimated-cumulative-excess-deaths-per-100000-people-during-covid-19.csv")
]).then(([geojson, data]) => {
    const selectedDate = new Date("2024-02-15");

    const latestData = {};

    const countryNameMap = {
        "Russia": "Russian Federation",
        "United States": "United States of America",
        "Democratic Republic of Congo": "Dem. Rep. Congo",
        "South Sudan": "S. Sudan",
        "Western Sahara": "W. Sahara",
        "Central African Republic": "Central African Rep."
    };

    data.forEach(d => {
        const country = d.Entity;
        const date = new Date(d.Day);

        if (date.getTime() === selectedDate.getTime()) {
            const geoCountry = countryNameMap[country] || country;
            latestData[geoCountry] = d;
        }
    });

    data.forEach(d => {
        const country = d.Entity;
        const date = new Date(d.Day);

        if (!latestData[country] && date < selectedDate) {
            const geoCountry = countryNameMap[country] || country;
            latestData[geoCountry] = d;
        }
    });

    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, d3.max(Object.values(latestData), d => +d["Total confirmed deaths due to COVID-19 per 100,000 people"] || 0)]);

    const width = 960, height = 600;
    const svg = d3.select("#map")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoEqualEarth()
        .fitSize([width, height], geojson);

    const path = d3.geoPath().projection(projection);

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("box-shadow", "0 0 10px rgba(0, 0, 0, 0.5)")
        .style("pointer-events", "none")
        .style("opacity", 0);

    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", d => {
            const country = d.properties.name;
            const value = +latestData[country]?.["Total confirmed deaths due to COVID-19 per 100,000 people"];
            return isNaN(value) || value <= 0 ? "#ccc" : colorScale(value);
        })
        .attr("stroke", "#999")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            const country = d.properties.name;
            const data = latestData[country];
            const deaths = data ? data["Total confirmed deaths due to COVID-19 per 100,000 people"] : "No data";
            tooltip.html(`
                <strong>${country}</strong><br>
                Deaths per 100k: ${deaths}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px")
            .style("opacity", 1);
        })
        .on("mousemove", event => {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

    const legend = svg.append("g")
        .attr("transform", `translate(20, ${height - 150})`);

    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, 100]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(5);

    const legendBarWidth = 30;

    legend.selectAll("rect")
        .data(d3.range(0, 100, 1))
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => d)
        .attr("width", legendBarWidth)
        .attr("height", 5)
        .attr("fill", d => colorScale(legendScale.invert(d)));

    legend.append("g")
        .attr("transform", `translate(${legendBarWidth + 5}, 0)`)
        .call(legendAxis);

    legend.append("text")
        .attr("x", 10)
        .attr("y", -10)
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text("COVID-19 Deaths per 100k");

    legend.append("text")
        .attr("x", legendBarWidth + 10)
        .attr("y", 100)
        .attr("dy", "0.8em")
        .attr("font-size", "10px")
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .text(colorScale.domain()[1]);
});
