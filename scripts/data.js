// Initialize an empty object to store all data
const allData = {};

// Function to load and process the CSV data
function loadData() {
    const years = [];
    for (let year = 1960; year <= 2023; year++) {
        years.push(year);
    }

    // Create promises to load data for each year
    const dataPromises = years.map(year => {
        return d3.csv(`datasets/life-expectancy-population/by-years/life-expectancy-population-${year}.csv`)
            .then(data => {
                allData[year] = data.filter(d => d.Total === "total").map(d => ({
                    Country: d.Country,
                    Year: d.Year,
                    Life_expectancy: parseFloat(d.Life_expectancy)
                }));
            });
    });

    // Return the promises so we can handle them in other files
    return Promise.all(dataPromises);
}

// Call the loadData function when the script is loaded
loadData().then(() => {
    console.log("Data loaded successfully");
});
