Promise.all([
    d3.json("datasets/geojson/world.geo.json"),
    d3.csv("datasets/covid/covid-2024.csv")
]).then(([geojson, data]) => {
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
        const geoCountry = countryNameMap[country] || country;
        latestData[geoCountry] = d;
    });

    const values = Object.values(latestData).map(d => +d["Total confirmed deaths due to COVID-19 per 100,000 people"] || 0);
    const minValue = d3.min(values);
    const maxValue = d3.max(values);

    const binCount = 6;
    const binSize = (maxValue - minValue) / binCount;
    const bins = d3.range(binCount).map(i => minValue + i * binSize);
    bins.push(maxValue);
    console.log(bins)
    const colorScale = d3.scaleThreshold()
        .domain(bins.slice(1, -1)) 
        .range(d3.schemeReds[binCount]);
    console.log(colorScale)

    const width = 960, height = 600;
    const svg = d3.select("#covid-map")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("cursor", "grab");

    let projection = d3.geoOrthographic()
        .scale(500)
        .translate([width / 2, height / 2])
        .rotate([0, -30])
        .clipAngle(90);

    const path = d3.geoPath().projection(projection);

    const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("color", "black")
    .style("padding", "12px")
    .style("border-radius", "10px")
    .style("box-shadow", "0 4px 15px rgba(0, 0, 0, 0.2)")
    .style("pointer-events", "none")
    .style("opacity", 0);


    const map = svg.selectAll("path")
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
        .on("mouseover", function (event, d) {
            const country = d.properties.name;
            const data = latestData[country];
            let deaths = data ? +data["Total confirmed deaths due to COVID-19 per 100,000 people"] : null;
            deaths = deaths !== null && !isNaN(deaths) ? deaths.toFixed(2) : "No data";
            d3.select(this).style("opacity", 1).style("stroke-width", "2px");
            svg.selectAll("path")
                .filter(pathData => pathData !== d)
                .style("opacity", 0.3);
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 0;">
                    ${country}
                </div>
                <div style="font-size: 36px; font-weight: bold; color:rgb(255, 80, 80);">
                    ${deaths}
                </div>
                Deaths per 100k
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
        })
        .on("mousemove", event => {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", () => {
            svg.selectAll("path")
                .style("opacity", 1)
                .style("stroke-width", "1px");
            tooltip.transition().duration(200).style("opacity", 0);
        });

    const legend = svg.append("g")
        .attr("transform", `translate(-140, ${height - 200})`);

        legend.selectAll("rect")
        .data(colorScale.range().map((color, i) => {
            const start = bins[i];
            const end = bins[i + 1];
            return { color, start, end };
        }))
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 30) // Add space for the black line
        .attr("width", 30)
        .attr("height", 30)
        .attr("fill", d => d.color);
    
    // Add black lines between the color rectangles
    legend.selectAll("line")
        .data(bins)
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", 35)
        .attr("y1", (d, i) => i * 30) // Same spacing as the color rectangles
        .attr("y2", (d, i) => i * 30)
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    

    legend.selectAll("text")
        .data(bins)
        .enter()
        .append("text")
        .attr("x", 40)
        .attr("y", (d, i) => i * 30 + 4)
        .attr("font-size", "12px")
        .attr("fill", "black")
        .text(d => d.toFixed(1));

    legend.append("text")
        .attr("x", 0)
        .attr("y", -40)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .text("COVID-19");
    legend.append("text")
        .attr("x", 0)
        .attr("y", -25)
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "black")
        .text("Deaths per 100k");


    const drag = d3.drag()
        .on("start", () => {
            svg.style("cursor", "grabbing");
        })
        .on("drag", (event) => {
            const rotate = projection.rotate();
            const dx = event.dx;
            const dy = event.dy;
            const newRotate = [
                rotate[0] + dx / 4, 
                rotate[1] - dy / 4, 
            ];
            projection.rotate(newRotate);
            svg.selectAll("path").attr("d", path); 
        })
        .on("end", () => {
            svg.style("cursor", "grab");
        });

    svg.call(drag);

    const zoomInButton = d3.select("#zoom-in");
    const zoomOutButton = d3.select("#zoom-out");

    zoomInButton.on("click", () => {
        let currentScale = projection.scale();
        projection.scale(currentScale * 1.1);
        svg.selectAll("path").attr("d", path);
    });

    zoomOutButton.on("click", () => {
        let currentScale = projection.scale();
        projection.scale(currentScale / 1.1);
        svg.selectAll("path").attr("d", path);
    });
});
