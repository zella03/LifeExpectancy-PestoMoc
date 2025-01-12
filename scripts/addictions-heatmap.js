d3.csv("datasets/addictions/normalized_europe_data_per_capita_FINAL.csv").then(function(data) {
    const lifeExpectancyCol = "Period life expectancy at birth - Sex: total - Age: 0";

    const data2019 = data.filter(d => +d.Year === 2019);

    if (data2019.length === 0) {
        console.error("No data found for the year 2019.");
        d3.select("#matrix").append("p").text("No data available for 2019.");
        return;
    }

    const labelMapping = {
        "Normalized Total deaths from opioid use disorders among both sexes": "Opioid Deaths",
        "Normalized Total deaths from cocaine use disorders among both sexes": "Cocaine Deaths",
        "Normalized Total deaths from other drug use disorders among both sexes": "Other Drug Deaths",
        "Normalized Total deaths from amphetamine use disorders among both sexes": "Amphetamine Deaths",
        "Normalized Total deaths from drug use disorders among both sexes": "Drug Use Deaths",
        "Normalized Total deaths from mental and substance use disorders among both sexes": "Mental and Substance Disorders",
        "Normalized Total deaths from substance use disorders among both sexes": "Substance Use Disorders"
    };

    const originalColumns = Object.keys(labelMapping);
    const otherColumns = Object.values(labelMapping);

    const correlations = {};

    originalColumns.forEach((col, i) => {
        const x = data2019.map(d => +d[col]);
        const y = data2019.map(d => +d[lifeExpectancyCol]);
        correlations[otherColumns[i]] = calculateCorrelation(x, y);
    });

    function calculateCorrelation(x, y) {
        if (!x || !y || x.length !== y.length) return NaN;

        const n = x.length;
        const xMean = d3.mean(x);
        const yMean = d3.mean(y);

        let numerator = 0;
        let xSumSq = 0;
        let ySumSq = 0;

        for (let i = 0; i < n; i++) {
            numerator += (x[i] - xMean) * (y[i] - yMean);
            xSumSq += Math.pow(x[i] - xMean, 2);
            ySumSq += Math.pow(y[i] - yMean, 2);
        }
        const denominator = Math.sqrt(xSumSq * ySumSq);

        return denominator === 0 ? 0 : numerator / denominator;
    }

    const numCols = otherColumns.length;
    const margin = { top: 50, right: 300, bottom: 200, left: 250 };
    const width = Math.min((window.innerWidth || document.documentElement.clientWidth) - margin.left - margin.right, numCols * 80);
    const cellSize = width / numCols;
    const height = cellSize;

    const svg = d3.select("#matrix").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.1).domain(otherColumns);
    const y = d3.scaleBand().rangeRound([0, height]).paddingInner(0.1).domain(["Life Expectancy"]);

    const colorScale = d3.scaleDiverging().domain([-1, 0, 1]).range(["#1f77b4", "#EEEEEE", "#d62728"]);

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width / 2 + 300}, ${height + 150})`);

    const legendHeight = 20;
    const legendWidth = 250;

    const gradient = legend.append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", colorScale(1));
    gradient.append("stop").attr("offset", "50%").attr("stop-color", colorScale(0));
    gradient.append("stop").attr("offset", "100%").attr("stop-color", colorScale(-1));

    legend.append("rect")
        .attr("x", 0).attr("y", 0).attr("width", legendWidth).attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", legendHeight + 15)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text("Correlation");

    legend.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text("-1");

    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", -5)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text("0");

    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", -5)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text("1");

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("y", 15)
    .attr("x", 9).attr("dy", ".35em")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end").style("font-size", "12px");

    svg.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "10px");

    const cells = svg.selectAll(".cell")
        .data(otherColumns.map(col => ({ x: col, y: lifeExpectancyCol })))
        .enter().append("g")
        .attr("transform", d => `translate(${x(d.x)}, 0)`);

    cells.append("rect")
        .attr("class", "cell")
        .attr("width", cellSize).attr("height", cellSize)
        .attr("fill", d => colorScale(correlations[d.x]));

    cells.append("text")
        .attr("class", "cell-text")
        .attr("x", cellSize / 2).attr("y", cellSize / 2)
        .attr("dy", ".35em")
        .text(d => {
            const corr = correlations[d.x];
            return (corr === null || isNaN(corr)) ? "" : corr.toFixed(2);
        })
        .style("fill", d => Math.abs(correlations[d.x]) > 0.6 ? "white" : "black")
        .style("text-anchor", "middle");
}).catch(error => {
    console.error("Error loading or processing the CSV file:", error);
    d3.select("#matrix").append("p").text("Error loading data.");
});
