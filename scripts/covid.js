Promise.all([
    d3.json("datasets/geojson/world.geo.json"),
    d3.csv("datasets/covid/estimated-cumulative-excess-deaths-per-100000-people-during-covid-19.csv")
]).then(([geojson, data]) => {
    const selectedDate = new Date("2024-02-15");

    const latestData = {};

    data.forEach(d => {
        const country = d.Entity;
        const date = new Date(d.Day);

        if (date.getTime() === selectedDate.getTime()) {
            latestData[country] = d;
        }
    });

    data.forEach(d => {
        const country = d.Entity;
        const date = new Date(d.Day);

        if (!latestData[country] && date < selectedDate) {
            latestData[country] = d;
        }
    });

    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, d3.max(Object.values(latestData), d => +d["Total confirmed deaths due to COVID-19 per 100,000 people"] || 0)]);

    const width = 960, height = 600;
    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoEqualEarth()
        .fitSize([width, height], geojson);

    const path = d3.geoPath().projection(projection);

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px 10px")
        .style("border-radius", "5px")
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
        .attr("stroke", "#333")
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
        .attr("transform", `translate(${width - 150}, 20)`);

    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, 100]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

    legend.selectAll("rect")
        .data(d3.range(0, 100, 1))
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => d)
        .attr("width", 20)
        .attr("height", 1)
        .attr("fill", d => colorScale(legendScale.invert(d)));

    legend.append("g")
        .attr("transform", "translate(20, 0)")
        .call(legendAxis);

    
});
