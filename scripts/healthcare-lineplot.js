async function initializeChart() {
    // Function to load CSV data
    async function loadCSVData(year) {
        return fetch(`datasets/healthcare/with-life-expectancy-by-years/life-expectancy-health-expenditure-${year}.csv`)
            .then(response => response.text())
            .then(data => parseCSV(data))
            .catch(error => console.error(`Error loading ${year}.csv`, error));
    }

    // Function to parse CSV data
    function parseCSV(data) {
        const rows = data.split('\n');
        const parsedData = [];
        rows.slice(1).forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 5) {
                const country = cols[0].trim();
                const year = parseInt(cols[1].trim());
                const lifeExpectancy = parseFloat(cols[2].trim());
                const healthExpenditure = parseFloat(cols[4].trim());
                const population = parseFloat(cols[3].trim());
                if (!isNaN(lifeExpectancy) && !isNaN(healthExpenditure)) {
                    parsedData.push({ country, year, lifeExpectancy, healthExpenditure, population });
                }
            }
        });
        return parsedData;
    }

    const allData = {};
    const availableCountries = new Set();

    // Function to populate country dropdowns
    function populateCountrySelection(data) {
        data.forEach(item => availableCountries.add(item.country));

        const country1Select = document.getElementById('country1');
        const country2Select = document.getElementById('country2');

        availableCountries.forEach(country => {
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');
            option1.value = country;
            option2.value = country;
            option1.textContent = country;
            option2.textContent = country;
            country1Select.appendChild(option1);
            country2Select.appendChild(option2);
        });

        country1Select.value = "Poland";//[...availableCountries][0];
        country2Select.value = "Italy";//[...availableCountries][1];
    }

    // Load initial data
    const initialData = await loadCSVData(2021);
    populateCountrySelection(initialData);

    const ctx = document.getElementById('lifeExpectancyChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: '',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    fill: false,
                    tension: 0.3,
                    pointRadius: 10,
                    pointHoverRadius: 12,
                },
                {
                    label: '',
                    data: [],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    fill: false,
                    tension: 0.3,
                    pointRadius: 10,
                    pointHoverRadius: 12,
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        title: tooltipItems => `Year: ${tooltipItems[0].raw.year}`,
                        label: tooltipItem => [
                            `Life Expectancy: ${tooltipItem.raw.y.toFixed(2)}`,
                            `Expenditure: $${tooltipItem.raw.x.toFixed(2)}`,
                            `Population: ${tooltipItem.raw.population}`
                        ],
                    },
                },
                // customTextPlugin: {
                //     id: 'customTextPlugin',
                //     afterDatasetsDraw(chart) {
                //         const ctx = chart.ctx;
                //         const datasets = chart.data.datasets;

                //         datasets.forEach((dataset, datasetIndex) => {
                //             const data = dataset.data;
                //             const meta = chart.getDatasetMeta(datasetIndex);
                //             if (data.length > 0) {
                //                 const firstPoint = meta.data[0];
                //                 const { x, y } = firstPoint.getCenterPoint();

                //                 ctx.save();
                //                 ctx.font = '12px Arial';
                //                 ctx.fillStyle = dataset.borderColor;
                //                 ctx.fillText('2000', x + 5, y - 10); // Adjust positioning as needed
                //                 ctx.restore();
                //             }
                //         });
                //     }
                // }
            },
            
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Healthcare Expenditure ($)' },
                },
                y: {
                    title: { display: true, text: 'Life Expectancy (Years)' },
                }
            }
        },
        plugins: [
            {
                id: 'customLabelPlugin',
                afterDatasetsDraw(chart) {
                    const ctx = chart.ctx;
                    const datasets = chart.data.datasets;

                    datasets.forEach((dataset, datasetIndex) => {
                        const data = dataset.data;
                        const meta = chart.getDatasetMeta(datasetIndex);
                        if (data.length > 0) {
                            const firstPoint = meta.data[0];
                            const lastPoint = meta.data[data.length - 1]; // Get the last point
                            const { x: xFirst, y: yFirst } = firstPoint.getCenterPoint();
                            const { x: xLast, y: yLast } = lastPoint.getCenterPoint();

                            ctx.save();

                            // **Label for the first year (2000)**
                            //const labelTextFirst = '2000';
                            const firstYear = data[0].year;
                            const labelTextFirst = `${firstYear}`;
                            const padding = 5;
                            const fontSize = 20;
                            ctx.font = `${fontSize}px Arial`;
                            const textWidthFirst = ctx.measureText(labelTextFirst).width;
                            const labelWidthFirst = textWidthFirst + padding * 2;
                            const labelHeightFirst = fontSize + padding * 2;

                            // Draw label box for the first point
                            ctx.fillStyle = 'white';
                            ctx.strokeStyle = dataset.borderColor;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.roundRect(xFirst - labelWidthFirst / 2 - 20, yFirst - labelHeightFirst + 50, labelWidthFirst, labelHeightFirst, 5);
                            ctx.fill();
                            ctx.stroke();

                            // Draw text for the first point
                            ctx.fillStyle = dataset.borderColor;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(labelTextFirst, xFirst - 20, yFirst - labelHeightFirst / 2 + 50);

                            // **Label for the last year**
                            const labelTextLast = `${data[data.length - 1].year}`; // Dynamically fetch the last year
                            const textWidthLast = ctx.measureText(labelTextLast).width;
                            const labelWidthLast = textWidthLast + padding * 2;
                            const labelHeightLast = fontSize + padding * 2;

                            // Draw label box for the last point
                            ctx.fillStyle = 'white';
                            ctx.strokeStyle = dataset.borderColor;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.roundRect(xLast - labelWidthLast / 2, yLast - labelHeightLast - 20, labelWidthLast, labelHeightLast, 5);
                            ctx.fill();
                            ctx.stroke();

                            // Draw text for the last point
                            ctx.fillStyle = dataset.borderColor;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(labelTextLast, xLast, yLast - labelHeightLast / 2 - 20);

                            ctx.restore();
                        }
                    });
                }
            }
        ]
    });

    const slider = document.getElementById('yearSlider');
    const currentYearLabel = document.getElementById('currentYear');
    let animationRunning = false;
    let currentYear = 2000;

    const pauseButton = document.getElementById('pauseButton');
    const resumeButton = document.getElementById('resumeButton');
    const replayButton = document.getElementById('replayButton');

    // Function to update the chart
    async function createOrUpdateChart(year) {
        if (!allData[year]) {
            allData[year] = await loadCSVData(year);
        }

        const combinedData = Object.keys(allData)
            .filter(y => y <= year)
            .reduce((acc, y) => acc.concat(allData[y]), []);

        const country1 = document.getElementById('country1').value;
        const country2 = document.getElementById('country2').value;

        const country1Data = combinedData.filter(d => d.country === country1);
        const country2Data = combinedData.filter(d => d.country === country2);

        chart.data.datasets[0].label = `${country1}`;
        chart.data.datasets[0].data = country1Data.map(d => ({
            x: d.healthExpenditure,
            y: d.lifeExpectancy,
            year: d.year,
            population: d.population,
            radius: Math.sqrt(d.population) / 500
        }));

        chart.data.datasets[1].label = `${country2}`;
        chart.data.datasets[1].data = country2Data.map(d => ({
            x: d.healthExpenditure,
            y: d.lifeExpectancy,
            year: d.year,
            population: d.population,
            radius: Math.sqrt(d.population) / 500
        }));

        chart.update();
    }

    slider.addEventListener('input', async function () {
        currentYear = parseInt(slider.value);
        currentYearLabel.textContent = currentYear;
        await createOrUpdateChart(currentYear);
    });

    document.getElementById('country1').addEventListener('change', async () => {
        await createOrUpdateChart(currentYear);
    });

    document.getElementById('country2').addEventListener('change', async () => {
        await createOrUpdateChart(currentYear);
    });

    async function animateYears() {
        animationRunning = true;
        pauseButton.disabled = false;
        resumeButton.disabled = true;

        for (; currentYear <= 2022; currentYear++) {
            if (!animationRunning) break;
            slider.value = currentYear;
            currentYearLabel.textContent = currentYear;
            await createOrUpdateChart(currentYear);
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        if (currentYear > 2022) {
            replayButton.disabled = false;
            pauseButton.disabled = true;
        }
    }

    pauseButton.addEventListener('click', () => {
        animationRunning = false;
        pauseButton.disabled = true;
        resumeButton.disabled = false;
        replayButton.disabled = false;
    });

    resumeButton.addEventListener('click', () => {
        animationRunning = true;
        animateYears();
    });

    replayButton.addEventListener('click', () => {
        currentYear = 2000;
        animationRunning = true;
        replayButton.disabled = true;
        animateYears();
    });

    replayButton.disabled = true;
    pauseButton.disabled = true;
    resumeButton.disabled = false;
    //animateYears();
}

initializeChart();