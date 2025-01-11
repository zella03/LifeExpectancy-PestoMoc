const yearSelector = document.getElementById("year-selector");
const availableYears = Array.from({ length: 2021 - 2000 + 1 }, (_, i) => 2000 + i);
availableYears.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelector.appendChild(option);
});
yearSelector.value = 2021;

async function loadData(year) {
    try {
        const csvData = await Promise.all([d3.csv(`datasets/gdp/with-healthcare-by-years/gdp-healthcare-${year}.csv`)]);
        return parseCSV(csvData[0]);
    } catch (error) {
        console.error("Error loading data", error);
    }
}

function parseCSV(csvData) {
    return csvData.map(d => {
        return {
            Country: d.Country,
            Total_GDP: +d.Total_GDP,
            Total_Health_Expenditure: +d["Total Health Expenditure"],
            Population: +d.Population,
            Income_per_Person: +d.Income_per_Person,
        };
    }).filter(d => !isNaN(d.Total_GDP) && !isNaN(d.Total_Health_Expenditure));
}

function generateWaffleData(gdp, healthcare) {
    const totalBlocks = 100;

    if (isNaN(gdp) || isNaN(healthcare) || gdp <= 0 || healthcare <= 0) {
        return Array(totalBlocks).fill("invalid");
    }

    const gdpBlocks = Math.round((gdp / (gdp + healthcare)) * totalBlocks);
    const healthcareBlocks = totalBlocks - gdpBlocks;

    return Array(gdpBlocks).fill("gdp").concat(Array(healthcareBlocks).fill("healthcare"));
}

async function initializeChart(year) {
    const data = await loadData(year);

    const top3GDP = data.sort((a, b) => b.Total_GDP - a.Total_GDP).slice(0, 3);

    const formatCurrency = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    const chartContainer = d3.select("#waffle-charts");
    chartContainer.html("");

    top3GDP.forEach(country => {
        const waffleData = generateWaffleData(country.Total_GDP, country.Total_Health_Expenditure);

        const chartDiv = chartContainer.append("div").attr("class", "chart");

        chartDiv.append("div")
            .attr("class", "gdp-bar")
            .text(`GDP: ${formatCurrency.format(country.Total_GDP)}`);

        chartDiv.append("h3").text(country.Country);

        const waffleChart = chartDiv.append("div").attr("class", "waffle-chart");
        waffleChart.selectAll(".block")
            .data(waffleData)
            .enter()
            .append("div")
            .attr("class", d => `block ${d}`);

        const ratio = (country.Total_Health_Expenditure / country.Total_GDP) * 100;
        chartDiv.append("p").html(`Healthcare to GDP ratio: <b class="bigger-text">${ratio.toFixed(2)}%</b>`);
    });
}

yearSelector.addEventListener("change", (event) => {
    const selectedYear = event.target.value;
    initializeChart(selectedYear);
});

initializeChart("2021");
